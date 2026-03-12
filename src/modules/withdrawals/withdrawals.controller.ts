import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../../shared/errors/app-error";
import { createWithdrawalSchema } from "./withdrawals.schemas";
import { WithdrawalsService } from "./withdrawals.service";

const withdrawalsService = new WithdrawalsService();

export class WithdrawalsController {
  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.authUser) {
      throw new AppError("Unauthorized", 401);
    }

    const input = createWithdrawalSchema.parse(request.body);
    const result = await withdrawalsService.create(request.authUser.sub, input);

    reply.status(201).send(result);
  }
}
