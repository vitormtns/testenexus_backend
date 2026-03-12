export const TOKEN_SYMBOLS = ["BTC", "ETH", "USDT"] as const;

export type TokenSymbol = (typeof TOKEN_SYMBOLS)[number];
