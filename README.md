# Nexus Backend Challenge - Crypto Wallet API

API REST que simula o núcleo de uma carteira cripto com características comuns de um sistema financeiro real: autenticação segura, gestão de saldos multiativos, movimentações financeiras, integração externa para cotação de ativos e trilha contábil auditável via ledger.

O projeto foi construído em `Node.js + TypeScript`, utilizando `Fastify`, `PostgreSQL`, `Prisma`, `Zod`, `JWT` e integração com a `CoinGecko`, além de cache em `Redis` para otimizar a consulta de preços.

## Visão geral

Esta API cobre o fluxo principal de uma wallet cripto com foco em consistência, rastreabilidade e clareza arquitetural:

- cadastro e autenticação com `access token` e `refresh token`
- criação automática da wallet no signup
- saldos materializados por ativo
- depósitos via webhook com idempotência
- cotação e execução de swap entre ativos
- saques
- ledger detalhado para auditoria de movimentações
- histórico transacional com paginação

## API pública / deploy

O projeto está publicado no Railway e pode ser testado diretamente, sem necessidade de clonar o repositório primeiro.

- Base URL pública: `https://testenexusbackend-production.up.railway.app`
- Health check: `GET https://testenexusbackend-production.up.railway.app/health`

Isso permite validar rapidamente o comportamento da API, os fluxos principais e a consistência das respostas já em ambiente online.

## Funcionalidades

- autenticação com `JWT access token` e `refresh token`
- persistência de `refresh tokens` com hash no banco
- criação automática de wallet ao registrar um novo usuário
- suporte aos ativos `BRL`, `BTC`, `ETH` e `USDT`
- consulta de saldo da wallet autenticada
- depósito via webhook com proteção por `idempotencyKey`
- cotação de swap com preço real via CoinGecko
- execução de swap com taxa fixa de `1.5%`
- saque autenticado com baixa de saldo
- ledger com `balanceBefore` e `balanceAfter`
- histórico de transações com paginação
- cache de cotações em Redis com `TTL` e fallback seguro

## Stack técnica

- `Node.js`
- `TypeScript`
- `Fastify`
- `PostgreSQL`
- `Prisma ORM`
- `Zod`
- `@fastify/jwt`
- `Redis`
- `CoinGecko API`
- `Git`

## Decisões técnicas

### Fastify

Escolha por um framework enxuto, performático e adequado para APIs REST, com boa ergonomia para middlewares, plugins e tratamento centralizado de erros.

### Prisma + PostgreSQL

Prisma foi usado para modelagem tipada, migrations e transações de banco, enquanto PostgreSQL sustenta a consistência das operações financeiras e o histórico persistente.

### Zod na borda da aplicação

Todos os payloads principais são validados com Zod, reduzindo ambiguidade de entrada e garantindo contratos mais previsíveis para quem consome a API.

### Separação entre saldo materializado e ledger

O projeto mantém leitura rápida do saldo atual em `wallet_balances`, sem abrir mão da auditabilidade completa em `ledger_entries`.

### Transações atômicas

Fluxos críticos como registro inicial, depósito, swap e saque utilizam `prisma.$transaction`, garantindo consistência entre saldo, transação de negócio, ledger e controle de idempotência.

## Banco de dados e modelo de ledger

O desenho do banco separa claramente duas visões complementares:

- `wallet_balances`: estado atual da wallet por token, otimizado para leitura rápida
- `ledger_entries`: trilha auditável de todas as movimentações que alteram saldo

Também existe uma separação intencional entre:

- `transactions`: operação de negócio em alto nível, como `DEPOSIT`, `SWAP` e `WITHDRAWAL`
- `ledger_entries`: efeitos contábeis detalhados da operação, como `SWAP_OUT`, `SWAP_IN`, `SWAP_FEE` e `WITHDRAWAL`

Esse modelo melhora rastreabilidade, depuração e reconstituição de histórico financeiro. Cada entrada do ledger registra:

- ativo movimentado
- valor da movimentação
- saldo antes
- saldo depois
- vínculo opcional com a transação de negócio
- timestamp da operação

## Diferencial: cache Redis para cotações

As cotações consultadas na CoinGecko são normalizadas em BRL e armazenadas em uma única chave de cache no Redis, com `TTL de 60 segundos`.

Benefícios da abordagem:

- reduz chamadas repetidas à API externa
- melhora significativamente a latência do endpoint de quote em cache hit, com testes mostrando queda de cerca de `~100-250ms` para `~2-5ms` em chamadas repetidas dentro do TTL
- mantém o sistema funcionando mesmo se o Redis estiver indisponível

O Redis é tratado como otimização, não como dependência crítica. Se o Redis falhar, a aplicação segue operando com consulta direta à CoinGecko. Se a CoinGecko falhar, a API responde com erro controlado.

## Como testar a API

Você pode testar diretamente na URL pública publicada no Railway:

```bash
curl https://testenexusbackend-production.up.railway.app/health
```

## ⚡ Quick Test (2 minutos)

Fluxo mais rápido para avaliação:

1. Registrar usuário
2. Fazer login
3. Simular depósito
4. Gerar cotação de swap
5. Executar swap
6. Consultar saldo da wallet

Esse fluxo valida autenticação, comportamento do ledger, integração com API externa e consistência dos saldos após movimentações.

Fluxo recomendado de validação:

1. Registrar um usuário
2. Fazer login e obter `accessToken` e `refreshToken`
3. Consultar saldos da wallet criada automaticamente
4. Simular um depósito via webhook
5. Gerar uma cotação de swap
6. Executar o swap autenticado
7. Criar um saque
8. Consultar ledger e histórico transacional paginado

Para endpoints protegidos, use:

```http
Authorization: Bearer <accessToken>
```

## Endpoints principais

### `GET /health`

Verifica disponibilidade da API.

```bash
curl https://testenexusbackend-production.up.railway.app/health
```

Resposta esperada:

```
{"status":"ok"}
```

### `POST /auth/register`

Cria um usuário e provisiona automaticamente uma wallet com saldo inicial zerado para `BRL`, `BTC`, `ETH` e `USDT`.

```bash
curl -X POST https://testenexusbackend-production.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "avaliador@example.com",
    "password": "strongpass123"
  }'
```

Payload:

```json
{
  "email": "avaliador@example.com",
  "password": "strongpass123"
}
```

### `POST /auth/login`

Autentica o usuário e retorna `accessToken`, `refreshToken` e dados básicos da conta.

```bash
curl -X POST https://testenexusbackend-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "avaliador@example.com",
    "password": "strongpass123"
  }'
```

Payload:

```json
{
  "email": "avaliador@example.com",
  "password": "strongpass123"
}
```

### `POST /auth/refresh`

Gera um novo `accessToken` a partir de um `refreshToken` válido.

```json
{
  "refreshToken": "SEU_REFRESH_TOKEN"
}
```

### `POST /webhooks/deposit`

Simula um evento externo de depósito com proteção por idempotência.

```bash
curl -X POST https://testenexusbackend-production.up.railway.app/webhooks/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "token": "BTC",
    "amount": 0.5,
    "idempotencyKey": "deposit-btc-0001"
  }'
```

Payload:

```json
{
  "userId": "USER_ID_HERE",
  "token": "BTC",
  "amount": 0.5,
  "idempotencyKey": "deposit-btc-0001"
}
```

### `POST /swap/quote`

Consulta cotação entre dois ativos com taxa fixa de `1.5%` já calculada no retorno.

```bash
curl -X POST https://testenexusbackend-production.up.railway.app/swap/quote \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "BTC",
    "toToken": "USDT",
    "amount": 0.1
  }'
```

Payload:

```json
{
  "fromToken": "BTC",
  "toToken": "USDT",
  "amount": 0.1
}
```

### `POST /swap/execute`

Executa o swap na wallet autenticada, atualiza saldos, cria a transação de negócio e registra os lançamentos de ledger correspondentes.

```bash
curl -X POST https://testenexusbackend-production.up.railway.app/swap/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -d '{
    "fromToken": "BTC",
    "toToken": "USDT",
    "amount": 0.1
  }'
```

Payload:

```json
{
  "fromToken": "BTC",
  "toToken": "USDT",
  "amount": 0.1
}
```

### `POST /withdrawals`

Cria um saque autenticado e debita o saldo do ativo informado.

```bash
curl -X POST https://testenexusbackend-production.up.railway.app/withdrawals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -d '{
    "token": "USDT",
    "amount": 50
  }'
```

Payload:

```json
{
  "token": "USDT",
  "amount": 50
}
```

### `GET /wallet/balances`

Consulta os saldos atuais da wallet autenticada.

```bash
curl https://testenexusbackend-production.up.railway.app/wallet/balances \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### `GET /ledger`

Consulta o extrato auditável do ledger com paginação.

```bash
curl "https://testenexusbackend-production.up.railway.app/ledger?page=1&limit=10" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### `GET /transactions`

Consulta o histórico de transações de negócio com paginação.

```bash
curl "https://testenexusbackend-production.up.railway.app/transactions?page=1&limit=10" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

## Setup local

### Pré-requisitos

- `Node.js`
- `npm`
- `PostgreSQL`
- `Redis` opcional, caso queira habilitar cache local de cotações

### Instalação

```bash
git clone https://github.com/vitormtns/testenexus_backend
cd PASTA_DO_REPO
npm install
```

### Configuração do ambiente

```bash
cp .env.example .env
```

No Windows:

```powershell
copy .env.example .env
```

### Subida do banco

Você pode usar PostgreSQL local ou container Docker. Exemplo com Docker:

```bash
docker run --name crypto-wallet-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=crypto_wallet \
  -p 5432:5432 \
  -d postgres:16
```

### Migrations

```bash
npm run prisma:migrate -- --name init
```

### Executar em desenvolvimento

```bash
npm run dev
```

API local padrão:

```text
http://localhost:3333
```

## Variáveis de ambiente

Exemplo de configuração:

```env
PORT=3333
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crypto_wallet?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="change-me-access"
JWT_REFRESH_SECRET="change-me-refresh"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
COINGECKO_API_URL="https://api.coingecko.com/api/v3"
```

Descrição resumida:

- `PORT`: porta HTTP da aplicação
- `NODE_ENV`: ambiente de execução
- `DATABASE_URL`: conexão com PostgreSQL
- `REDIS_URL`: conexão com Redis, opcional
- `JWT_ACCESS_SECRET`: segredo para access token
- `JWT_REFRESH_SECRET`: segredo para refresh token
- `JWT_ACCESS_EXPIRES_IN`: expiração do access token
- `JWT_REFRESH_EXPIRES_IN`: expiração do refresh token
- `COINGECKO_API_URL`: base URL da CoinGecko

## Diferenciais implementados

- deploy público em Railway, facilitando avaliação sem setup local prévio
- autenticação completa com `access token` e `refresh token`
- armazenamento de refresh token com hash
- criação automática da wallet no cadastro
- suporte a `BRL`, `BTC`, `ETH` e `USDT`
- webhook de depósito com idempotência
- execução de swap com cotação real
- ledger auditável com saldo antes e depois
- histórico paginado
- cache Redis com `TTL` e fallback seguro
- modelagem separando transação de negócio e lançamento contábil

## Performance

Durante os testes, requisições repetidas de cotação dentro da janela de `TTL` foram atendidas com latência muito menor via Redis, enquanto requisições sem cache dependeram diretamente do tempo de resposta da CoinGecko.

Essa abordagem melhora a responsividade do endpoint de quote sem comprometer a resiliência da aplicação, já que o sistema continua funcional mesmo sem Redis.

## Considerações finais

O projeto foi desenhado para demonstrar fundamentos importantes de backend aplicados a um domínio financeiro simplificado: consistência transacional, rastreabilidade, validação de entrada, integração externa, autenticação segura e clareza arquitetural.

Além de atender aos requisitos centrais do desafio, a API foi organizada para ser fácil de avaliar tanto pelo código quanto pelo deploy público, permitindo validação rápida do comportamento sem dependência obrigatória de ambiente local.
