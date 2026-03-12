import type { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../db/prisma";
import { AppError } from "../errors/app-error";
import { verifyAccessToken } from "./jwt";

function extractBearerToken(authorizationHeader?: string): string {
  if (!authorizationHeader) {
    throw new AppError("Missing authorization header", 401);
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/);

  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    throw new AppError("Invalid authorization header", 401);
  }

  return token;
}

export async function authMiddleware(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const token = extractBearerToken(request.headers.authorization);
  const payload = verifyAccessToken(request.server, token);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      status: true
    }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  request.authUser = {
    sub: user.id,
    email: user.email,
    status: user.status,
    tokenType: "access"
  };
}
