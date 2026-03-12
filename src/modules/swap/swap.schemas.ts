import { Token } from "@prisma/client";
import { z } from "zod";

export const swapQuoteSchema = z
  .object({
    fromToken: z.nativeEnum(Token),
    toToken: z.nativeEnum(Token),
    amount: z.coerce.number().positive()
  })
  .refine((data) => data.fromToken !== data.toToken, {
    message: "fromToken and toToken must be different",
    path: ["toToken"]
  });

export type SwapQuoteInput = z.infer<typeof swapQuoteSchema>;
export type SwapExecuteInput = SwapQuoteInput;
