# Crypto Wallet API

API REST para gerenciamento de uma carteira cripto multiativo.

A aplicação implementa autenticação JWT, gestão de saldos, depósitos via webhook com idempotência, execução de swaps com cotação real da CoinGecko, saques mockados, ledger auditável de movimentações financeiras e histórico paginado de transações.

---

## Visão geral

Esta API implementa:

- autenticação com JWT
- wallet multiativos com saldos em `BRL`, `BTC`, `ETH` e `USDT`
- depósito via webhook com idempotência
- cotação de swap com valor real via CoinGecko
- execução de swap com taxa fixa de `1.5%`
- saque mockado
- ledger auditável
- histórico de transações com paginação

---

## Stack utilizada

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Prisma ORM
- Zod
- JWT
- CoinGecko API

---

## Como rodar o projeto localmente

### 1. Pré-requisitos

Você precisa ter instalado:

- Node.js
- npm
- Docker Desktop **ou** PostgreSQL local

---

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar o `.env`

Copie o arquivo de exemplo:

Mac/Linux

```bash
cp .env.example .env
```

Windows

```bash
copy .env.example .env
```

Exemplo de configuração:

```env
PORT=3333
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crypto_wallet?schema=public"
JWT_ACCESS_SECRET="change-me-access"
JWT_REFRESH_SECRET="change-me-refresh"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
COINGECKO_API_URL="https://api.coingecko.com/api/v3"
```

### 4. Subir o banco com Docker

Forma mais simples para rodar o PostgreSQL localmente:

```bash
docker run --name crypto-wallet-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=crypto_wallet -p 5432:5432 -d postgres:16
```

Se preferir usar PostgreSQL local já instalado, basta ajustar a `DATABASE_URL` no `.env`.

### 5. Rodar migrations

```bash
npm run prisma:migrate -- --name init
```

### 6. Rodar a API

```bash
npm run dev
```

Por padrão, a API sobe em:

```text
http://localhost:3333
```

### 7. Health check

Valide se a aplicação subiu corretamente:

```http
GET http://localhost:3333/health
```

Exemplo:

```bash
curl http://localhost:3333/health
```

Resposta esperada:

```json
{
  "status": "ok"
}
```

## Ordem recomendada para testar a API

Base URL usada nos exemplos:

```text
http://localhost:3333
```

### 1. `POST /auth/register`

Cria o usuário e já provisiona a wallet com saldo inicial zerado para `BRL`, `BTC`, `ETH` e `USDT`.

`Authorization`: não precisa

```json
{
  "email": "avaliador@example.com",
  "password": "strongpass123"
}
```

### 2. `POST /auth/login`

Autentica o usuário e retorna `accessToken` e `refreshToken`.

`Authorization`: não precisa

```json
{
  "email": "avaliador@example.com",
  "password": "strongpass123"
}
```

Use o `accessToken` retornado nos endpoints protegidos:

```text
Authorization: Bearer <accessToken>
```

### 3. `GET /auth/me`

Retorna os dados do usuário autenticado.

`Authorization`: obrigatória

### 4. `GET /wallet/balances`

Lista os saldos atuais da wallet do usuário autenticado.

`Authorization`: obrigatória

### 5. `POST /webhooks/deposit`

Simula a entrada de saldo via webhook. Esse endpoint usa `idempotencyKey` para impedir processamento duplicado.

`Authorization`: não precisa

Importante: use o `user.id` retornado em `/auth/register` ou `/auth/login`.

```json
{
  "userId": "uuid-do-usuario",
  "token": "BTC",
  "amount": 0.5,
  "idempotencyKey": "deposit-btc-0001"
}
```

### 6. `GET /wallet/balances`

Consulte novamente os saldos para confirmar o depósito.

`Authorization`: obrigatória

### 7. `POST /swap/quote`

Gera uma cotação de swap com valor real via CoinGecko e taxa fixa de `1.5%`.

`Authorization`: não precisa

```json
{
  "fromToken": "BTC",
  "toToken": "USDT",
  "amount": 0.1
}
```

### 8. `POST /swap/execute`

Executa o swap na wallet do usuário autenticado, atualiza os saldos e registra `transaction` + `ledger`.

`Authorization`: obrigatória

```json
{
  "fromToken": "BTC",
  "toToken": "USDT",
  "amount": 0.1
}
```

### 9. `POST /withdrawals`

Cria um saque mockado, debitando o saldo e registrando a movimentação.

`Authorization`: obrigatória

```json
{
  "token": "USDT",
  "amount": 50
}
```

### 10. `GET /ledger`

Consulta o ledger auditável com as movimentações detalhadas de saldo.

`Authorization`: obrigatória

Exemplo com paginação:

```http
GET /ledger?page=1&limit=10
```

### 11. `GET /transactions`

Consulta o histórico de operações de negócio da wallet.

`Authorization`: obrigatória

Exemplo com paginação:

```http
GET /transactions?page=1&limit=10
```

## Endpoints implementados

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`

### Wallet

- `GET /wallet/balances`

### Webhooks

- `POST /webhooks/deposit`

### Swap

- `POST /swap/quote`
- `POST /swap/execute`

### Withdrawals

- `POST /withdrawals`

### Ledger

- `GET /ledger`

### Transactions

- `GET /transactions`

## Paginação

Os endpoints abaixo suportam paginação via query params `page` e `limit`:

- `GET /ledger`
- `GET /transactions`

Exemplos:

```text
/ledger?page=1&limit=10
/transactions?page=1&limit=10
```

Se nada for informado, o padrão atual é:

- `page = 1`
- `limit = 10`

## Decisões técnicas relevantes

### Fastify

Optei por usar Fastify por ser um framework leve, rápido e alinhado com as preferências sinalizadas no teste. Ele oferece uma estrutura enxuta e adequada para uma API REST desse porte.

### Prisma

Usei Prisma ORM pela produtividade com TypeScript, clareza na modelagem do banco, facilidade com migrations e boa legibilidade nas operações transacionais.

### Zod

Usei Zod para validar os payloads na borda da API, garantindo consistência dos dados de entrada e retornos de erro previsíveis.

### Ledger + saldo materializado

A solução mantém dois níveis de informação:

- `wallet_balances` para leitura rápida do saldo atual
- `ledger_entries` para auditabilidade completa

Isso permite consultar saldo com eficiência e, ao mesmo tempo, reconstruir o estado da carteira a partir das movimentações.

### Transactions x Ledger

Separei:

- `transactions`: operações de negócio em alto nível (`DEPOSIT`, `SWAP`, `WITHDRAWAL`)
- `ledger_entries`: movimentações contábeis detalhadas (`SWAP_OUT`, `SWAP_IN`, `SWAP_FEE`, etc.)

Essa distinção melhora a rastreabilidade e a leitura da operação.

### Transações de banco

Operações críticas como cadastro inicial, depósito via webhook, swap e saque utilizam transação do banco com Prisma para garantir consistência entre:

- saldo atualizado
- `transaction` criada
- `ledger` registrado
- idempotência aplicada

### Idempotência no webhook

Depósitos usam `idempotencyKey` para impedir que o mesmo evento externo seja processado duas vezes.

### Refresh token com hash

Os refresh tokens são armazenados com hash no banco, evitando persistência do token puro.

### CoinGecko

A cotação de swap utiliza a CoinGecko API com taxa fixa de `1.5%`, conforme solicitado no teste.

## Estrutura do banco de dados

### `users`

Armazena os usuários da aplicação.

### `wallets`

Cada usuário possui uma wallet em relação `1:1`.

### `wallet_balances`

Armazena o saldo atual por token dentro da wallet.

Exemplo:

- `BRL`
- `BTC`
- `ETH`
- `USDT`

### `transactions`

Registra operações de negócio em alto nível:

- `DEPOSIT`
- `SWAP`
- `WITHDRAWAL`

### `ledger_entries`

Registra todas as movimentações detalhadas de saldo:

- `DEPOSIT`
- `SWAP_OUT`
- `SWAP_IN`
- `SWAP_FEE`
- `WITHDRAWAL`

Cada lançamento registra:

- `token`
- `amount`
- `balanceBefore`
- `balanceAfter`
- `createdAt`

### `refresh_tokens`

Armazena refresh tokens hasheados, com expiração e revogação.

### `webhook_deposits`

Controla a idempotência dos depósitos via webhook.

## Observações técnicas

- Depósitos via webhook usam `idempotencyKey` para evitar duplicidade.
- Refresh tokens são armazenados com hash no banco.
- Operações críticas usam transação do banco com Prisma.
- O `ledger` registra movimentações detalhadas de saldo.
- `transactions` registra as operações de negócio em nível mais alto.
- O swap usa cotação real da CoinGecko e aplica taxa fixa de `1.5%`.

## Estrutura do projeto

- `src/modules`: módulos de domínio da aplicação (`auth`, `wallet`, `webhooks`, `swap`, `withdrawals`, `ledger`, `transactions`)
- `src/shared`: autenticação, acesso ao banco, tratamento de erros e utilitários compartilhados
- `prisma/schema.prisma`: modelagem do banco de dados
- `src/config`: carregamento e validação de variáveis de ambiente
- `src/app.ts`: criação da instância do Fastify e registro das rotas
- `src/server.ts`: bootstrap do servidor HTTP
