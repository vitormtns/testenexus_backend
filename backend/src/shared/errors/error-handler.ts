import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "./app-error";

export function errorHandler(
  error: FastifyError | AppError,
  _request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      message: error.message
    });
  }

  return reply.status(500).send({
    message: "Internal server error"
  });
}
