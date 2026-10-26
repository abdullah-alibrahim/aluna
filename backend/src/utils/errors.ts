export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (code) this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code?: string) {
    super(message, 404, true, code);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code?: string) {
    super(message, 400, true, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code?: string) {
    super(message, 401, true, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code?: string) {
    super(message, 403, true, code);
  }
}
