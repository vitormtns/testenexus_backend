import { FormEvent, useEffect, useState } from "react";

import { API_BASE_URL, ApiError, apiRequest } from "./api";
import type {
  DepositResponse,
  HealthResponse,
  LoginResponse,
  MeResponse,
  QuoteResponse,
  RegisterResponse,
  SwapResponse,
  Token,
  TransactionsResponse,
  WalletResponse,
  WithdrawalResponse
} from "./types";

const TOKENS: Token[] = ["BRL", "BTC", "ETH", "USDT"];
const TOKEN_STORAGE_KEY = "nexus-demo-access-token";
const USER_STORAGE_KEY = "nexus-demo-user";

type FeedbackTone = "idle" | "loading" | "success" | "error";

type FeedbackState = {
  tone: FeedbackTone;
  message: string;
};

type StoredUser = {
  id: string;
  email: string;
  status: string;
};

const idleFeedback: FeedbackState = { tone: "idle", message: "" };

function formatError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado";
}

function saveSession(token: string, user: StoredUser): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function clearSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

function readStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function ResultBlock({ title, data }: { title: string; data: unknown }) {
  if (!data) {
    return null;
  }

  return (
    <div className="result-block">
      <p className="result-title">{title}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function Feedback({ state }: { state: FeedbackState }) {
  if (state.tone === "idle" || !state.message) {
    return null;
  }

  return <p className={`feedback ${state.tone}`}>{state.message}</p>;
}

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(() => readStoredUser());

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthFeedback, setHealthFeedback] = useState<FeedbackState>(idleFeedback);

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerResult, setRegisterResult] = useState<RegisterResponse | null>(null);
  const [registerFeedback, setRegisterFeedback] = useState<FeedbackState>(idleFeedback);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginResult, setLoginResult] = useState<LoginResponse | null>(null);
  const [loginFeedback, setLoginFeedback] = useState<FeedbackState>(idleFeedback);

  const [authFeedback, setAuthFeedback] = useState<FeedbackState>(idleFeedback);

  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [walletFeedback, setWalletFeedback] = useState<FeedbackState>(idleFeedback);

  const [quoteFromToken, setQuoteFromToken] = useState<Token>("BTC");
  const [quoteToToken, setQuoteToToken] = useState<Token>("USDT");
  const [quoteAmount, setQuoteAmount] = useState("0.1");
  const [quoteResult, setQuoteResult] = useState<QuoteResponse | null>(null);
  const [quoteFeedback, setQuoteFeedback] = useState<FeedbackState>(idleFeedback);

  const [swapResult, setSwapResult] = useState<SwapResponse | null>(null);
  const [swapFeedback, setSwapFeedback] = useState<FeedbackState>(idleFeedback);

  const [depositUserId, setDepositUserId] = useState("");
  const [depositToken, setDepositToken] = useState<Token>("BTC");
  const [depositAmount, setDepositAmount] = useState("0.5");
  const [depositKey, setDepositKey] = useState(`demo-${Date.now()}`);
  const [depositResult, setDepositResult] = useState<DepositResponse | null>(null);
  const [depositFeedback, setDepositFeedback] = useState<FeedbackState>(idleFeedback);

  const [withdrawToken, setWithdrawToken] = useState<Token>("USDT");
  const [withdrawAmount, setWithdrawAmount] = useState("50");
  const [withdrawalResult, setWithdrawalResult] = useState<WithdrawalResponse | null>(null);
  const [withdrawalFeedback, setWithdrawalFeedback] = useState<FeedbackState>(idleFeedback);

  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactions, setTransactions] = useState<TransactionsResponse | null>(null);
  const [transactionsFeedback, setTransactionsFeedback] = useState<FeedbackState>(idleFeedback);

  useEffect(() => {
    if (currentUser?.id) {
      setDepositUserId(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const verifySession = async () => {
      setAuthFeedback({ tone: "loading", message: "Validando sessão salva..." });

      try {
        const user = await apiRequest<MeResponse>("/auth/me", { token: accessToken });
        setCurrentUser(user);
        saveSession(accessToken, user);
        setAuthFeedback({ tone: "success", message: "Você está autenticado e já pode testar o fluxo." });
      } catch (error) {
        clearSession();
        setAccessToken(null);
        setCurrentUser(null);
        setAuthFeedback({ tone: "error", message: `A sessão salva expirou: ${formatError(error)}` });
      }
    };

    void verifySession();
  }, [accessToken]);

  const handleHealthCheck = async () => {
    setHealthFeedback({ tone: "loading", message: "Verificando status da API..." });

    try {
      const result = await apiRequest<HealthResponse>("/health");
      setHealth(result);
      setHealthFeedback({ tone: "success", message: "API online." });
    } catch (error) {
      setHealthFeedback({ tone: "error", message: `Erro ao consultar a API: ${formatError(error)}` });
    }
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setRegisterFeedback({ tone: "loading", message: "Criando conta..." });

    try {
      const result = await apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: {
          email: registerEmail,
          password: registerPassword
        }
      });

      setRegisterResult(result);
      setRegisterFeedback({ tone: "success", message: "Conta criada com sucesso." });
      setLoginEmail(registerEmail);
      setLoginPassword(registerPassword);
      setDepositUserId(result.user.id);
    } catch (error) {
      setRegisterFeedback({ tone: "error", message: `Não foi possível criar a conta: ${formatError(error)}` });
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoginFeedback({ tone: "loading", message: "Entrando..." });

    try {
      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: {
          email: loginEmail,
          password: loginPassword
        }
      });

      setLoginResult(result);
      setCurrentUser(result.user);
      setAccessToken(result.accessToken);
      saveSession(result.accessToken, result.user);
      setLoginFeedback({ tone: "success", message: "Login realizado com sucesso." });
      setAuthFeedback({ tone: "success", message: "Você está autenticado e já pode testar o fluxo." });
    } catch (error) {
      setLoginFeedback({ tone: "error", message: `Não foi possível entrar: ${formatError(error)}` });
    }
  };

  const handleLogout = () => {
    clearSession();
    setAccessToken(null);
    setCurrentUser(null);
    setWallet(null);
    setLoginResult(null);
    setAuthFeedback({ tone: "success", message: "Sessão encerrada com sucesso." });
  };

  const handleCheckBalances = async () => {
    if (!accessToken) {
      setWalletFeedback({ tone: "error", message: "Faça login antes de consultar os saldos." });
      return;
    }

    setWalletFeedback({ tone: "loading", message: "Carregando saldos..." });

    try {
      const result = await apiRequest<WalletResponse>("/wallet/balances", {
        token: accessToken
      });

      setWallet(result);
      setWalletFeedback({ tone: "success", message: "Saldos carregados com sucesso." });
    } catch (error) {
      setWalletFeedback({ tone: "error", message: `Não foi possível consultar os saldos: ${formatError(error)}` });
    }
  };

  const handleGetQuote = async (event: FormEvent) => {
    event.preventDefault();
    setQuoteFeedback({ tone: "loading", message: "Gerando cotação..." });

    try {
      const result = await apiRequest<QuoteResponse>("/swap/quote", {
        method: "POST",
        body: {
          fromToken: quoteFromToken,
          toToken: quoteToToken,
          amount: Number(quoteAmount)
        }
      });

      setQuoteResult(result);
      setQuoteFeedback({ tone: "success", message: "Cotação gerada com sucesso." });
    } catch (error) {
      setQuoteFeedback({ tone: "error", message: `Não foi possível gerar a cotação: ${formatError(error)}` });
    }
  };

  const handleExecuteSwap = async () => {
    if (!accessToken) {
      setSwapFeedback({ tone: "error", message: "Faça login antes de executar o swap." });
      return;
    }

    setSwapFeedback({ tone: "loading", message: "Executando swap..." });

    try {
      const result = await apiRequest<SwapResponse>("/swap/execute", {
        method: "POST",
        token: accessToken,
        body: {
          fromToken: quoteFromToken,
          toToken: quoteToToken,
          amount: Number(quoteAmount)
        }
      });

      setSwapResult(result);
      setSwapFeedback({ tone: "success", message: "Swap executado com sucesso." });
      await handleCheckBalances();
    } catch (error) {
      setSwapFeedback({ tone: "error", message: `Não foi possível executar o swap: ${formatError(error)}` });
    }
  };

  const handleCreateDeposit = async (event: FormEvent) => {
    event.preventDefault();
    setDepositFeedback({ tone: "loading", message: "Simulando depósito..." });

    try {
      const result = await apiRequest<DepositResponse>("/webhooks/deposit", {
        method: "POST",
        body: {
          userId: depositUserId,
          token: depositToken,
          amount: Number(depositAmount),
          idempotencyKey: depositKey
        }
      });

      setDepositResult(result);
      setDepositFeedback({ tone: "success", message: "Depósito simulado com sucesso." });
      setDepositKey(`demo-${Date.now()}`);

      if (accessToken) {
        await handleCheckBalances();
      }
    } catch (error) {
      setDepositFeedback({ tone: "error", message: `Não foi possível simular o depósito: ${formatError(error)}` });
    }
  };

  const handleWithdrawal = async (event: FormEvent) => {
    event.preventDefault();

    if (!accessToken) {
      setWithdrawalFeedback({ tone: "error", message: "Faça login antes de sacar." });
      return;
    }

    setWithdrawalFeedback({ tone: "loading", message: "Criando saque..." });

    try {
      const result = await apiRequest<WithdrawalResponse>("/withdrawals", {
        method: "POST",
        token: accessToken,
        body: {
          token: withdrawToken,
          amount: Number(withdrawAmount)
        }
      });

      setWithdrawalResult(result);
      setWithdrawalFeedback({ tone: "success", message: "Saque criado com sucesso." });
      await handleCheckBalances();
    } catch (error) {
      setWithdrawalFeedback({ tone: "error", message: `Não foi possível criar o saque: ${formatError(error)}` });
    }
  };

  const handleLoadTransactions = async (page = transactionsPage) => {
    if (!accessToken) {
      setTransactionsFeedback({ tone: "error", message: "Faça login antes de consultar o histórico." });
      return;
    }

    setTransactionsFeedback({ tone: "loading", message: "Carregando histórico de transações..." });

    try {
      const result = await apiRequest<TransactionsResponse>(`/transactions?page=${page}&limit=5`, {
        token: accessToken
      });

      setTransactions(result);
      setTransactionsPage(result.page);
      setTransactionsFeedback({ tone: "success", message: "Histórico carregado com sucesso." });
    } catch (error) {
      setTransactionsFeedback({
        tone: "error",
        message: `Não foi possível carregar o histórico: ${formatError(error)}`
      });
    }
  };

  const handleCopyUserId = async () => {
    if (!currentUser?.id) {
      setAuthFeedback({ tone: "error", message: "Nenhum ID de usuário disponível para copiar." });
      return;
    }

    try {
      await navigator.clipboard.writeText(currentUser.id);
      setDepositUserId(currentUser.id);
      setAuthFeedback({ tone: "success", message: "ID do usuário copiado." });
    } catch {
      setAuthFeedback({ tone: "error", message: "Não foi possível copiar o ID do usuário." });
    }
  };

  const isLoggedIn = Boolean(accessToken && currentUser);

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Demo visual Nexus</p>
          <h1>Interface simples para testar a API da carteira</h1>
          <p className="hero-copy">
            Esta interface visual já está conectada ao backend real publicado online no Railway.
          </p>
          <div className="helper-box">
            <p className="result-title">Como testar</p>
            <p className="helper-copy">Siga esta ordem para visualizar o fluxo principal com mais facilidade:</p>
            <ol className="steps-list">
              <li>Criar conta</li>
              <li>Entrar</li>
              <li>Simular depósito</li>
              <li>Consultar saldos</li>
              <li>Gerar cotação</li>
              <li>Executar swap</li>
            </ol>
          </div>
        </div>

        <div className="hero-panel">
          <p className="panel-label">URL do backend</p>
          <code>{API_BASE_URL}</code>
          <button className="secondary-button" type="button" onClick={handleHealthCheck}>
            Verificar API
          </button>
          <Feedback state={healthFeedback} />
          <ResultBlock title="Resposta da saúde da API" data={health} />
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Criar conta</h2>
          <p className="card-copy">Cadastre um novo usuário. A carteira será criada automaticamente no backend.</p>
          <form className="form" onSubmit={handleRegister}>
            <label>
              Email
              <input
                type="email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder="reviewer@example.com"
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                placeholder="Mínimo de 8 caracteres"
                minLength={8}
                required
              />
            </label>
            <button type="submit">Criar conta</button>
          </form>
          <Feedback state={registerFeedback} />
          <ResultBlock title="Resposta do cadastro" data={registerResult} />
        </article>

        <article className="card">
          <h2>Entrar</h2>
          <p className="card-copy">Faça login para consultar saldos, executar swap e criar saques.</p>
          <form className="form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="reviewer@example.com"
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Sua senha"
                required
              />
            </label>
            <button type="submit">Entrar</button>
          </form>
          <Feedback state={loginFeedback} />
          <ResultBlock title="Resposta do login" data={loginResult ? { user: loginResult.user } : null} />
        </article>

        <article className="card">
          <h2>Status da autenticação</h2>
          <p className="card-copy">Para facilitar o teste, o token desta demo fica salvo localmente no navegador.</p>
          <div className="status-box">
            <p>
              <strong>Status:</strong> {isLoggedIn ? "Conectado" : "Não conectado"}
            </p>
            <p>
              <strong>Usuário:</strong> {currentUser?.email ?? "Nenhum usuário ativo"}
            </p>
            <p>
              <strong>ID do usuário:</strong> {currentUser?.id ?? "Indisponível"}
            </p>
          </div>
          <div className="button-row">
            <button type="button" onClick={handleCheckBalances}>
              Consultar saldos
            </button>
            <button className="secondary-button" type="button" onClick={handleCopyUserId}>
              Copiar ID do usuário
            </button>
            <button className="secondary-button" type="button" onClick={handleLogout}>
              Sair
            </button>
          </div>
          <Feedback state={authFeedback} />
        </article>

        <article className="card">
          <h2>Saldos da carteira</h2>
          <p className="card-copy">Mostra os saldos atuais da carteira do usuário autenticado.</p>
          {wallet?.balances ? (
            <div className="balance-list">
              {wallet.balances.map((item) => (
                <div className="balance-item" key={item.token}>
                  <span>{item.token}</span>
                  <strong>{item.balance}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="placeholder">Nenhuma consulta de saldo realizada ainda.</p>
          )}
          <Feedback state={walletFeedback} />
          <ResultBlock title="Resposta da carteira" data={wallet} />
        </article>

        <article className="card">
          <h2>Gerar cotação</h2>
          <p className="card-copy">Veja a estimativa do swap antes de executar a troca entre os ativos.</p>
          <form className="form" onSubmit={handleGetQuote}>
            <label>
              De
              <select value={quoteFromToken} onChange={(event) => setQuoteFromToken(event.target.value as Token)}>
                {TOKENS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Para
              <select value={quoteToToken} onChange={(event) => setQuoteToToken(event.target.value as Token)}>
                {TOKENS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Valor
              <input
                type="number"
                min="0"
                step="any"
                value={quoteAmount}
                onChange={(event) => setQuoteAmount(event.target.value)}
                required
              />
            </label>
            <button type="submit">Gerar cotação</button>
          </form>
          <Feedback state={quoteFeedback} />
          {quoteResult ? (
            <div className="quote-summary">
              <p>
                <strong>Valor estimado a receber:</strong> {quoteResult.netAmount} {quoteResult.toToken}
              </p>
              <p>
                <strong>Taxa:</strong> {quoteResult.feeAmount} {quoteResult.toToken} ({quoteResult.feePercentage}%)
              </p>
            </div>
          ) : null}
          <div className="button-row">
            <button type="button" onClick={handleExecuteSwap}>
              Executar swap
            </button>
          </div>
          <ResultBlock title="Resposta da cotação" data={quoteResult} />
          <Feedback state={swapFeedback} />
          <ResultBlock title="Resposta do swap" data={swapResult} />
        </article>

        <article className="card">
          <h2>Simular depósito</h2>
          <p className="card-copy">Usa a rota pública de webhook para simular um depósito externo.</p>
          <form className="form" onSubmit={handleCreateDeposit}>
            <label>
              ID do usuário
              <input
                type="text"
                value={depositUserId}
                onChange={(event) => setDepositUserId(event.target.value)}
                placeholder="ID do usuário obtido no cadastro ou login"
                required
              />
            </label>
            <label>
              Token
              <select value={depositToken} onChange={(event) => setDepositToken(event.target.value as Token)}>
                {TOKENS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Valor
              <input
                type="number"
                min="0"
                step="any"
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                required
              />
            </label>
            <label>
              Referência do depósito
              <input
                type="text"
                value={depositKey}
                onChange={(event) => setDepositKey(event.target.value)}
                placeholder="Identificador único do depósito"
                required
              />
            </label>
            <button type="submit">Simular depósito</button>
          </form>
          <Feedback state={depositFeedback} />
          <ResultBlock title="Resposta do depósito" data={depositResult} />
        </article>

        <article className="card">
          <h2>Sacar</h2>
          <p className="card-copy">Cria um saque autenticado a partir da carteira atual.</p>
          <form className="form" onSubmit={handleWithdrawal}>
            <label>
              Token
              <select value={withdrawToken} onChange={(event) => setWithdrawToken(event.target.value as Token)}>
                {TOKENS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Valor
              <input
                type="number"
                min="0"
                step="any"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
                required
              />
            </label>
            <button type="submit">Sacar</button>
          </form>
          <Feedback state={withdrawalFeedback} />
          <ResultBlock title="Resposta do saque" data={withdrawalResult} />
        </article>

        <article className="card">
          <h2>Histórico de transações</h2>
          <p className="card-copy">
            Esta área mostra as principais operações já realizadas na carteira, como depósitos, swaps e saques.
          </p>
          <div className="button-row">
            <button type="button" onClick={() => void handleLoadTransactions(1)}>
              Carregar transações
            </button>
          </div>
          <Feedback state={transactionsFeedback} />
          {transactions ? (
            <>
              <div className="transactions-meta">
                <span>
                  <strong>Página:</strong> {transactions.page}
                  {transactions.totalPages > 0 ? ` de ${transactions.totalPages}` : ""}
                </span>
                <span>
                  <strong>Total:</strong> {transactions.total}
                </span>
              </div>
              {transactions.items.length > 0 ? (
                <div className="transactions-list">
                  {transactions.items.map((item) => (
                    <div className="transaction-item" key={item.id}>
                      <p>
                        <strong>Tipo:</strong> {item.type}
                      </p>
                      <p>
                        <strong>Ativos:</strong> {item.fromToken ?? "-"} {item.toToken ? `-> ${item.toToken}` : ""}
                      </p>
                      <p>
                        <strong>Valores:</strong> {item.fromAmount ?? "-"} {item.fromToken ?? ""}
                        {item.toAmount ? ` | ${item.toAmount} ${item.toToken ?? ""}` : ""}
                      </p>
                      <p>
                        <strong>Taxa:</strong>{" "}
                        {item.feeAmount && item.feeToken ? `${item.feeAmount} ${item.feeToken}` : "Sem taxa"}
                      </p>
                      <p>
                        <strong>Data:</strong> {new Date(item.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="placeholder">Nenhuma transação encontrada para este usuário.</p>
              )}
              <div className="button-row">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void handleLoadTransactions(transactionsPage - 1)}
                  disabled={transactionsPage <= 1}
                >
                  Página anterior
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void handleLoadTransactions(transactionsPage + 1)}
                  disabled={transactions.totalPages === 0 || transactionsPage >= transactions.totalPages}
                >
                  Próxima página
                </button>
              </div>
            </>
          ) : (
            <p className="placeholder">Nenhum histórico carregado ainda.</p>
          )}
        </article>
      </section>
    </main>
  );
}
