import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../../shared/errors/app-error";
import { WalletService } from "./wallet.service";

const walletService = new WalletService();

export class WalletController {
  async getBalances(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.authUser) {
      throw new AppError("Unauthorized", 401);
    }

    const result = await walletService.getBalances(request.authUser.sub);

    reply.status(200).send(result);
  }
}
