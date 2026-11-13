import type { FastifyPluginAsync } from 'fastify';
import { roleInsightsQuerySchema } from './insights.schemas.js';
import type { InsightsService } from './insights.service.js';

export const insightsRoutes: FastifyPluginAsync<{ service: InsightsService }> = async (
  app,
  { service },
) => {
  app.get('/summary', async () => service.summary());

  app.get('/roles', async (request) => service.roles(roleInsightsQuerySchema.parse(request.query)));
};
