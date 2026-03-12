import { LedgerEntryType, Prisma, TransactionType } from "@prisma/client";

import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import type { DepositWebhookInput } from "./webhooks.schemas";

type DepositWebhookResponse = {
  message: string;
  transactionId: string;
  token: DepositWebhookInput["token"];
  balanceBefore: Prisma.Decimal;
  balanceAfter: Prisma.Decimal;
};

export class WebhooksService {
  async processDeposit(input: DepositWebhookInput): Promise<DepositWebhookResponse> {
    const amount = new Prisma.Decimal(input.amount);

    try {
      return await prisma.$transaction(async (tx) => {
        const existingWebhookDeposit = await tx.webhookDeposit.findUnique({
          where: {
            idempotencyKey: input.idempotencyKey
          }
        });

        if (existingWebhookDeposit) {
          throw new AppError("Webhook deposit already processed", 409);
        }

        const user = await tx.user.findUnique({
          where: {
            id: input.userId
          },
          select: {
            id: true,
            wallet: {
              select: {
                id: true
              }
            }
          }
        });

        if (!user) {
          throw new AppError("User not found", 404);
        }

        if (!user.wallet) {
          throw new AppError("Wallet not found", 404);
        }

        const walletBalance = await tx.walletBalance.findUnique({
          where: {
            walletId_token: {
              walletId: user.wallet.id,
              token: input.token
            }
          },
          select: {
            id: true,
            walletId: true,
            balance: true
          }
        });

        if (!walletBalance) {
          throw new AppError("Wallet balance not found for token", 404);
        }

        const balanceBefore = walletBalance.balance;
        const balanceAfter = balanceBefore.plus(amount);

        await tx.walletBalance.update({
          where: {
            id: walletBalance.id
          },
          data: {
            balance: balanceAfter
          }
        });

        const transaction = await tx.transaction.create({
          data: {
            walletId: walletBalance.walletId,
            type: TransactionType.DEPOSIT,
            toToken: input.token,
            toAmount: amount
          },
          select: {
            id: true
          }
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: walletBalance.walletId,
            transactionId: transaction.id,
            type: LedgerEntryType.DEPOSIT,
            token: input.token,
            amount,
            balanceBefore,
            balanceAfter
          }
        });

        await tx.webhookDeposit.create({
          data: {
            idempotencyKey: input.idempotencyKey,
            userId: input.userId,
            token: input.token,
            amount,
            processedAt: new Date()
          }
        });

        return {
          message: "Deposit processed successfully",
          transactionId: transaction.id,
          token: input.token,
          balanceBefore,
          balanceAfter
        };
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Webhook deposit already processed", 409);
      }

      throw error;
    }
  }
}
