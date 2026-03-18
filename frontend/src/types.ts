export type Token = "BRL" | "BTC" | "ETH" | "USDT";

export type HealthResponse = {
  status: "ok";
};

export type User = {
  id: string;
  email: string;
  status: string;
};

export type RegisterResponse = {
  user: User;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type MeResponse = User;

export type WalletBalance = {
  token: Token;
  balance: string;
};

export type WalletResponse = {
  walletId: string;
  balances: WalletBalance[];
};

export type QuoteResponse = {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  exchangeRate: string;
  grossAmount: string;
  feePercentage: string;
  feeAmount: string;
  netAmount: string;
};

export type SwapResponse = QuoteResponse & {
  message: string;
  transactionId: string;
  updatedBalances: Partial<Record<Token, string>>;
};

export type DepositResponse = {
  message: string;
  transactionId: string;
  token: Token;
  balanceBefore: string;
  balanceAfter: string;
};

export type WithdrawalResponse = {
  message: string;
  transactionId: string;
  token: Token;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
};

export type TransactionItem = {
  id: string;
  type: string;
  fromToken: string | null;
  toToken: string | null;
  fromAmount: string | null;
  toAmount: string | null;
  feeToken: string | null;
  feeAmount: string | null;
  createdAt: string;
};

export type TransactionsResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: TransactionItem[];
};
