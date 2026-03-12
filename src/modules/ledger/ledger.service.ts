import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import { getPagination } from "../../shared/utils/pagination";

type GetLedgerInput = {
  page?: number;
  limit?: number;
};

type LedgerItem = {
  id: string;
  transactionId: string | null;
  type: string;
  token: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: Date;
};

type LedgerResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: LedgerItem[];
};

export class LedgerService {
  async list(userId: string, input: GetLedgerInput): Promise<LedgerResponse> {
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

    const [total, entries] = await Promise.all([
      prisma.ledgerEntry.count({
        where: {
          walletId: wallet.id
        }
      }),
      prisma.ledgerEntry.findMany({
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
          transactionId: true,
          type: true,
          token: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          createdAt: true
        }
      })
    ]);

    return {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      items: entries.map((entry) => ({
        id: entry.id,
        transactionId: entry.transactionId,
        type: entry.type,
        token: entry.token,
        amount: entry.amount.toString(),
        balanceBefore: entry.balanceBefore.toString(),
        balanceAfter: entry.balanceAfter.toString(),
        createdAt: entry.createdAt
      }))
    };
  }
}
