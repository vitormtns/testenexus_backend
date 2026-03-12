import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../../shared/errors/app-error";
import { swapQuoteSchema } from "./swap.schemas";
import { SwapService } from "./swap.service";

const swapService = new SwapService();

export class SwapController {
  async quote(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = swapQuoteSchema.parse(request.body);
    const result = await swapService.quote(input);

    reply.status(200).send(result);
  }

  async execute(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.authUser) {
      throw new AppError("Unauthorized", 401);
    }

    const input = swapQuoteSchema.parse(request.body);
    const result = await swapService.execute(request.authUser.sub, input);

    reply.status(200).send(result);
  }
}
