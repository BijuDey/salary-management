import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import { ZodError } from 'zod';
import type { Database } from './db/client.js';
import { AppError } from './lib/errors.js';
import { authPlugin, type AuthOptions } from './modules/auth/auth.routes.js';
import { EmployeeRepository } from './modules/employees/employee.repository.js';
import { employeeRoutes } from './modules/employees/employee.routes.js';
import { EmployeeService } from './modules/employees/employee.service.js';
import { InsightsRepository } from './modules/insights/insights.repository.js';
import { insightsRoutes } from './modules/insights/insights.routes.js';
import { InsightsService } from './modules/insights/insights.service.js';
import { ReferenceRepository } from './modules/reference/reference.repository.js';
import { referenceRoutes } from './modules/reference/reference.routes.js';

export interface AppOptions {
  db: Database;
  auth: AuthOptions;
  logger?: boolean;
}

export interface ErrorResponse {
  error: { code: string; message: string; details?: unknown };
}

/**
 * Builds the HTTP application. Dependencies are passed in rather than imported, so tests can
 * run the full stack against an in-memory database.
 *
 * The web app proxies /api/* through its own origin, so the browser never calls this server
 * cross-origin: no CORS is needed, and the session cookie stays first-party.
 */
export async function buildApp({ db, auth, logger = false }: AppOptions): Promise<FastifyInstance> {
  // Behind the platform's proxy (and the web app's rewrite): use X-Forwarded-For for client IPs.
  const app = Fastify({ logger, trustProxy: true });

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` },
    } satisfies ErrorResponse);
  });

  // Public: platform health checks and signing in.
  app.get('/health', async () => ({ status: 'ok' }));
  await app.register(authPlugin, auth);

  // Everything else under /api requires a valid session.
  await app.register(async (protectedApi) => {
    protectedApi.addHook('onRequest', protectedApi.requireSession);

    const referenceRepository = new ReferenceRepository(db);

    await protectedApi.register(referenceRoutes, {
      prefix: '/api/reference',
      repository: referenceRepository,
    });
    await protectedApi.register(employeeRoutes, {
      prefix: '/api/employees',
      service: new EmployeeService(new EmployeeRepository(db), referenceRepository),
    });
    await protectedApi.register(insightsRoutes, {
      prefix: '/api/insights',
      service: new InsightsService(new InsightsRepository(db), referenceRepository),
    });
  });

  return app;
}

function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request contains invalid data',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    } satisfies ErrorResponse);
  }

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: { code: error.code, message: error.message, details: error.details },
    } satisfies ErrorResponse);
  }

  // Errors raised by Fastify itself, e.g. malformed JSON bodies.
  const statusCode = 'statusCode' in error ? error.statusCode : undefined;
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return reply.code(statusCode).send({
      error: { code: 'BAD_REQUEST', message: error.message },
    } satisfies ErrorResponse);
  }

  request.log.error({ err: error }, 'Unhandled error');
  return reply.code(500).send({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  } satisfies ErrorResponse);
}
