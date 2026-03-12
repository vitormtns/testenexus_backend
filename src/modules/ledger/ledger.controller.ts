import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { AppError } from "../../shared/errors/app-error";
import { LedgerService } from "./ledger.service";

const ledgerQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional()
});

const ledgerService = new LedgerService();

export class LedgerController {
  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.authUser) {
      throw new AppError("Unauthorized", 401);
    }

    const query = ledgerQuerySchema.parse(request.query);
    const result = await ledgerService.list(request.authUser.sub, query);

    reply.status(200).send(result);
  }
}
