import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import { getPagination } from "../../shared/utils/pagination";

type GetTransactionsInput = {
  page?: number;
  limit?: number;
};

type TransactionItem = {
  id: string;
  type: string;
  fromToken: string | null;
  toToken: string | null;
  fromAmount: string | null;
  toAmount: string | null;
  feeToken: string | null;
  feeAmount: string | null;
  createdAt: Date;
};

type TransactionsResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: TransactionItem[];
};

export class TransactionsService {
  async list(userId: string, input: GetTransactionsInput): Promise<TransactionsResponse> {
    const { page, limit } = getPagination(input.page, input.limit);
    const skip = (page - 1) * limit;

    const wallet = await prisma.wallet.findUnique({
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

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({
        where: {
          walletId: wallet.id
        }
      }),
      prisma.transaction.findMany({
        where: {
          walletId: wallet.id
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          fromToken: true,
          toToken: true,
          fromAmount: true,
          toAmount: true,
          feeToken: true,
          feeAmount: true,
          createdAt: true
        }
      })
    ]);

    return {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      items: transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        fromToken: transaction.fromToken,
        toToken: transaction.toToken,
        fromAmount: transaction.fromAmount?.toString() ?? null,
        toAmount: transaction.toAmount?.toString() ?? null,
        feeToken: transaction.feeToken,
        feeAmount: transaction.feeAmount?.toString() ?? null,
        createdAt: transaction.createdAt
      }))
    };
  }
}
