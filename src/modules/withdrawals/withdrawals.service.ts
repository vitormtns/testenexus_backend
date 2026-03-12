import { LedgerEntryType, Prisma, TransactionType } from "@prisma/client";

import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import type { CreateWithdrawalInput } from "./withdrawals.schemas";

export class WithdrawalsService {
  async create(userId: string, input: CreateWithdrawalInput) {
    const amount = new Prisma.Decimal(input.amount);

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          userId
        },
        select: {
          id: true
        }
      });

      if (!wallet) {
        throw new AppError("Wallet not found", 404);
      }

      const walletBalance = await tx.walletBalance.findUnique({
        where: {
          walletId_token: {
            walletId: wallet.id,
            token: input.token
          }
        },
        select: {
          id: true,
          balance: true
        }
      });

      if (!walletBalance) {
        throw new AppError("Wallet balance not found for token", 404);
      }

      if (walletBalance.balance.lt(amount)) {
        throw new AppError("Insufficient balance", 400);
      }

      const balanceBefore = walletBalance.balance;
      const balanceAfter = balanceBefore.minus(amount);

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
          walletId: wallet.id,
          type: TransactionType.WITHDRAWAL,
          fromToken: input.token,
          fromAmount: amount
        },
        select: {
          id: true
        }
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          transactionId: transaction.id,
          type: LedgerEntryType.WITHDRAWAL,
          token: input.token,
          amount,
          balanceBefore,
          balanceAfter
        }
      });

      return {
        message: "Withdrawal created successfully",
        transactionId: transaction.id,
        token: input.token,
        amount: amount.toString(),
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString()
      };
    });
  }
}
