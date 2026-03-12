import type { JwtPayload } from "../shared/http/types";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module "fastify" {
  interface FastifyRequest {
    authUser?: JwtPayload;
  }
}
