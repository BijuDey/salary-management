import type { FastifyPluginAsync } from 'fastify';
import {
  createEmployeeSchema,
  employeeIdParamsSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from './employee.schemas.js';
import type { EmployeeService } from './employee.service.js';

export const employeeRoutes: FastifyPluginAsync<{ service: EmployeeService }> = async (
  app,
  { service },
) => {
  app.get('/', async (request) => {
    return service.list(listEmployeesQuerySchema.parse(request.query));
  });

  app.get('/:id', async (request) => {
    const { id } = employeeIdParamsSchema.parse(request.params);
    return service.get(id);
  });

  app.post('/', async (request, reply) => {
    const employee = service.create(createEmployeeSchema.parse(request.body));
    return reply.code(201).header('location', `/api/employees/${employee.id}`).send(employee);
  });

  app.patch('/:id', async (request) => {
    const { id } = employeeIdParamsSchema.parse(request.params);
    return service.update(id, updateEmployeeSchema.parse(request.body));
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = employeeIdParamsSchema.parse(request.params);
    service.delete(id);
    return reply.code(204).send();
  });
};
