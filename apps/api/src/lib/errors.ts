/**
 * Errors that are safe to show to API clients. Anything else is treated as an
 * unexpected failure and reported as a generic 500.
 */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string | number) {
    super(404, 'NOT_FOUND', `${resource} ${id} was not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

/** A request that is well-formed but breaks a business rule. */
export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(422, 'BUSINESS_RULE_VIOLATION', message);
  }
}
