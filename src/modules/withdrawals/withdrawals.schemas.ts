import { Token } from "@prisma/client";
import { z } from "zod";

export const createWithdrawalSchema = z.object({
  token: z.nativeEnum(Token),
  amount: z.coerce.number().positive()
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
