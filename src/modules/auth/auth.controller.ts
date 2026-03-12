import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../../shared/errors/app-error";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schemas";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = registerSchema.parse(request.body);
    const result = await authService.register(input);

    reply.status(201).send(result);
  }

  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = loginSchema.parse(request.body);
    const result = await authService.login(request.server, input);

    reply.status(200).send(result);
  }

  async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = refreshSchema.parse(request.body);
    const result = await authService.refresh(request.server, input);

    reply.status(200).send(result);
  }

  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.authUser) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await authService.getCurrentUser(request.authUser.sub);

    reply.status(200).send(user);
  }
}
