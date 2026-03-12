import type { FastifyInstance } from "fastify";
import { Prisma, Token } from "@prisma/client";

import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import { comparePassword, hashPassword } from "../../shared/auth/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../../shared/auth/jwt";
import type { AuthenticatedUser } from "../../shared/http/types";
import type { LoginInput, RefreshInput, RegisterInput } from "./auth.schemas";

const INITIAL_WALLET_TOKENS: Token[] = [Token.BRL, Token.BTC, Token.ETH, Token.USDT];

type AuthUserResponse = {
  id: string;
  email: string;
  status: AuthenticatedUser["status"];
};

type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
};

export class AuthService {
  async register(input: RegisterInput): Promise<{ user: AuthUserResponse }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    const passwordHash = await hashPassword(input.password);

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash
        },
        select: {
          id: true,
          email: true,
          status: true
        }
      });

      const wallet = await tx.wallet.create({
        data: {
          userId: user.id
        },
        select: {
          id: true
        }
      });

      await tx.walletBalance.createMany({
        data: INITIAL_WALLET_TOKENS.map((token) => ({
          walletId: wallet.id,
          token,
          balance: new Prisma.Decimal(0)
        }))
      });

      return user;
    });

    return {
      user: createdUser
    };
  }

  async login(app: FastifyInstance, input: LoginInput): Promise<AuthTokensResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        status: true,
        passwordHash: true
      }
    });

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError("Invalid credentials", 401);
    }

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      status: user.status
    };

    const accessToken = signAccessToken(app, authUser);
    const refreshToken = signRefreshToken(app, authUser);
    const refreshTokenHash = await hashPassword(refreshToken);
    const refreshPayload = verifyRefreshToken(app, refreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date((refreshPayload.exp ?? 0) * 1000)
      }
    });

    return {
      accessToken,
      refreshToken,
      user: authUser
    };
  }

  async refresh(app: FastifyInstance, input: RefreshInput): Promise<{ accessToken: string }> {
    const payload = verifyRefreshToken(app, input.refreshToken);

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

    const activeRefreshTokens = await prisma.refreshToken.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const hasMatchingRefreshToken = await this.hasMatchingRefreshToken(
      input.refreshToken,
      activeRefreshTokens.map((item) => item.tokenHash)
    );

    if (!hasMatchingRefreshToken) {
      throw new AppError("Refresh token revoked", 401);
    }

    return {
      accessToken: signAccessToken(app, user)
    };
  }

  async getCurrentUser(userId: string): Promise<AuthUserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true
      }
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  private async hasMatchingRefreshToken(token: string, tokenHashes: string[]): Promise<boolean> {
    for (const tokenHash of tokenHashes) {
      const matches = await comparePassword(token, tokenHash);

      if (matches) {
        return true;
      }
    }

    return false;
  }
}
