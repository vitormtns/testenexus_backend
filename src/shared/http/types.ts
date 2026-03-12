import type { UserStatus } from "@prisma/client";

export type HealthResponse = {
  status: "ok";
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  status: UserStatus;
};

export type JwtTokenType = "access" | "refresh";

export type JwtPayload = {
  sub: string;
  email: string;
  status: UserStatus;
  tokenType: JwtTokenType;
  iat?: number;
  exp?: number;
};
