import { STATUS_CODES } from "node:http";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

import { AppError } from "./app-error";

function isZodValidationError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

export function errorHandler(
  error: FastifyError | AppError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: STATUS_CODES[error.statusCode] ?? "Error",
      message: error.message,
      details: error.details ?? null
    });
    return;
  }

  if (isZodValidationError(error)) {
    reply.status(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Validation error",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code
      }))
    });
    return;
  }

  request.log.error(error);

  reply.status(500).send({
    statusCode: 500,
    error: "Internal Server Error",
    message: "Internal server error"
  });
}
