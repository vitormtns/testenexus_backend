import { LedgerEntryType, Prisma, TransactionType } from "@prisma/client";

import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import type { SwapExecuteInput, SwapQuoteInput } from "./swap.schemas";
import { CoinGeckoService } from "./coingecko.service";

const FEE_PERCENTAGE = new Prisma.Decimal(1.5);
const ONE_HUNDRED = new Prisma.Decimal(100);

type SwapQuoteResult = {
  fromToken: SwapQuoteInput["fromToken"];
  toToken: SwapQuoteInput["toToken"];
  fromAmount: string;
  exchangeRate: string;
  grossAmount: string;
  feePercentage: string;
  feeAmount: string;
  netAmount: string;
};

export class SwapService {
  private readonly coingeckoService = new CoinGeckoService();

  async quote(input: SwapQuoteInput): Promise<SwapQuoteResult> {
    return this.buildQuote(input);
  }

  async execute(userId: string, input: SwapExecuteInput) {
    const quote = await this.buildQuote(input);
    const fromAmount = new Prisma.Decimal(quote.fromAmount);
    const grossAmount = new Prisma.Decimal(quote.grossAmount);
    const feeAmount = new Prisma.Decimal(quote.feeAmount);
    const netAmount = new Prisma.Decimal(quote.netAmount);

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

      const fromBalance = await tx.walletBalance.findUnique({
        where: {
          walletId_token: {
            walletId: wallet.id,
            token: input.fromToken
          }
        },
        select: {
          id: true,
          balance: true
        }
      });

      const toBalance = await tx.walletBalance.findUnique({
        where: {
          walletId_token: {
            walletId: wallet.id,
            token: input.toToken
          }
        },
        select: {
          id: true,
          balance: true
        }
      });

      if (!fromBalance || !toBalance) {
        throw new AppError("Wallet balance not found for selected token", 404);
      }

      if (fromBalance.balance.lt(fromAmount)) {
        throw new AppError("Insufficient balance", 400);
      }

      const fromBalanceBefore = fromBalance.balance;
      const fromBalanceAfter = fromBalanceBefore.minus(fromAmount);
      const toBalanceBefore = toBalance.balance;
      const toBalanceAfterSwapIn = toBalanceBefore.plus(grossAmount);
      const toBalanceAfterFee = toBalanceAfterSwapIn.minus(feeAmount);

      await tx.walletBalance.update({
        where: {
          id: fromBalance.id
        },
        data: {
          balance: fromBalanceAfter
        }
      });

      await tx.walletBalance.update({
        where: {
          id: toBalance.id
        },
        data: {
          balance: toBalanceAfterFee
        }
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.SWAP,
          fromToken: input.fromToken,
          toToken: input.toToken,
          fromAmount,
          toAmount: grossAmount,
          feeToken: input.toToken,
          feeAmount
        },
        select: {
          id: true
        }
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            walletId: wallet.id,
            transactionId: transaction.id,
            type: LedgerEntryType.SWAP_OUT,
            token: input.fromToken,
            amount: fromAmount,
            balanceBefore: fromBalanceBefore,
            balanceAfter: fromBalanceAfter
          },
          {
            walletId: wallet.id,
            transactionId: transaction.id,
            type: LedgerEntryType.SWAP_IN,
            token: input.toToken,
            amount: grossAmount,
            balanceBefore: toBalanceBefore,
            balanceAfter: toBalanceAfterSwapIn
          },
          {
            walletId: wallet.id,
            transactionId: transaction.id,
            type: LedgerEntryType.SWAP_FEE,
            token: input.toToken,
            amount: feeAmount,
            balanceBefore: toBalanceAfterSwapIn,
            balanceAfter: toBalanceAfterFee
          }
        ]
      });

      return {
        message: "Swap executed successfully",
        transactionId: transaction.id,
        ...quote,
        updatedBalances: {
          [input.fromToken]: fromBalanceAfter.toString(),
          [input.toToken]: toBalanceAfterFee.toString()
        }
      };
    });
  }

  private async buildQuote(input: SwapQuoteInput): Promise<SwapQuoteResult> {
    const pricesInBrl = await this.coingeckoService.getTokenPricesInBrl();
    const fromPriceInBrl = pricesInBrl[input.fromToken];
    const toPriceInBrl = pricesInBrl[input.toToken];

    if (!fromPriceInBrl || !toPriceInBrl) {
      throw new AppError("Quote unavailable for the selected tokens", 502);
    }

    const fromAmount = new Prisma.Decimal(input.amount);
    const exchangeRate = new Prisma.Decimal(fromPriceInBrl).div(toPriceInBrl);
    const grossAmount = fromAmount.mul(exchangeRate);
    const feeAmount = grossAmount.mul(FEE_PERCENTAGE).div(ONE_HUNDRED);
    const netAmount = grossAmount.minus(feeAmount);

    return {
      fromToken: input.fromToken,
      toToken: input.toToken,
      fromAmount: fromAmount.toString(),
      exchangeRate: exchangeRate.toString(),
      grossAmount: grossAmount.toString(),
      feePercentage: FEE_PERCENTAGE.toString(),
      feeAmount: feeAmount.toString(),
      netAmount: netAmount.toString()
    };
  }
}
