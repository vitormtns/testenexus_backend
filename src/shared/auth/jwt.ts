import type { FastifyInstance } from "fastify";

import { env } from "../../config/env";
import type { AuthenticatedUser, JwtPayload } from "../http/types";
import { AppError } from "../errors/app-error";

function toJwtPayload(user: AuthenticatedUser, tokenType: JwtPayload["tokenType"]): JwtPayload {
  return {
    sub: user.id,
    email: user.email,
    status: user.status,
    tokenType
  };
}

export function signAccessToken(app: FastifyInstance, user: AuthenticatedUser): string {
  return app.jwt.sign(toJwtPayload(user, "access"), {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    key: env.JWT_ACCESS_SECRET
  });
}

export function signRefreshToken(app: FastifyInstance, user: AuthenticatedUser): string {
  return app.jwt.sign(toJwtPayload(user, "refresh"), {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    key: env.JWT_REFRESH_SECRET
  });
}

export function verifyAccessToken(app: FastifyInstance, token: string): JwtPayload {
  try {
    const payload = app.jwt.verify<JwtPayload>(token, {
      key: env.JWT_ACCESS_SECRET
    });

    if (!payload.sub || !payload.email || !payload.status || payload.tokenType !== "access") {
      throw new AppError("Invalid access token", 401);
    }

    return payload;
  } catch {
    throw new AppError("Invalid access token", 401);
  }
}

export function verifyRefreshToken(app: FastifyInstance, token: string): JwtPayload {
  try {
    const payload = app.jwt.verify<JwtPayload>(token, {
      key: env.JWT_REFRESH_SECRET
    });

    if (!payload.sub || !payload.email || !payload.status || payload.tokenType !== "refresh") {
      throw new AppError("Invalid refresh token", 401);
    }

    return payload;
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }
}
