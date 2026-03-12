import type { FastifyReply, FastifyRequest } from "fastify";

import { depositWebhookSchema } from "./webhooks.schemas";
import { WebhooksService } from "./webhooks.service";

const webhooksService = new WebhooksService();

export class WebhooksController {
  async deposit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = depositWebhookSchema.parse(request.body);
    const result = await webhooksService.processDeposit(input);

    reply.status(201).send(result);
  }
}
