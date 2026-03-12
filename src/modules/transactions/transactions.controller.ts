import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { AppError } from "../../shared/errors/app-error";
import { TransactionsService } from "./transactions.service";

const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional()
});

const transactionsService = new TransactionsService();

export class TransactionsController {
  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.authUser) {
      throw new AppError("Unauthorized", 401);
    }

    const query = transactionsQuerySchema.parse(request.query);
    const result = await transactionsService.list(request.authUser.sub, query);

    reply.status(200).send(result);
  }
}
