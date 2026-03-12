import { Token } from "@prisma/client";
import { z } from "zod";

export const depositWebhookSchema = z.object({
  userId: z.string().min(1),
  token: z.nativeEnum(Token),
  amount: z.coerce.number().positive(),
  idempotencyKey: z.string().min(1)
});

export type DepositWebhookInput = z.infer<typeof depositWebhookSchema>;
