import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";

type WalletBalanceItem = {
  token: string;
  balance: string;
};

type WalletBalancesResponse = {
  walletId: string;
  balances: WalletBalanceItem[];
};

export class WalletService {
  async getBalances(userId: string): Promise<WalletBalancesResponse> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true
      }
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId
      },
      select: {
        id: true,
        balances: {
          orderBy: {
            token: "asc"
          },
          select: {
            token: true,
            balance: true
          }
        }
      }
    });

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    return {
      walletId: wallet.id,
      balances: wallet.balances.map((item) => ({
        token: item.token,
        balance: item.balance.toString()
      }))
    };
  }
}
