# Deploy WA Agent SaaS no Easypanel

## Visão Geral

Você vai criar **3 serviços** no Easypanel:
1. **wa-agent** — App Next.js
2. **wa-agent-db** — PostgreSQL (com pgvector)
3. **evolution-api** — Evolution API para WhatsApp

---

## Passo 1: Criar projeto

1. No Easypanel, clique **New Project** → nome: `wa-agent`

---

## Passo 2: Banco de dados PostgreSQL

1. No projeto, clique **New Service** → **Database** → **PostgreSQL**
2. Nome: `wa-agent-db`
3. Versão: **16**
4. Clique **Create**
5. Após criar, vá em **Variables** e anote:
   - `POSTGRES_HOST` (interno)
   - `POSTGRES_PORT`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`
6. Acesse o **Adminer** (ícone de banco no Easypanel) e execute:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Passo 3: Evolution API

1. No projeto, clique **New Service** → **App Service**
2. Nome: `evolution-api`
3. **Source**: Docker Image
4. Image: ` atendai/evolution-api:latest`
5. **Port**: 8080
6. **Environment Variables**:
```
SERVER_TYPE=http
SERVER_PORT=8080
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://wa_agent:SUA_SENHA@wa-agent-db:5432/evolution?schema=public
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE=true
DATABASE_SAVE_CONTACT=true
DATABASE_SAVE_QRCODE=true
DATABASE_CLEAN_QRCODE=true
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=SUA_EVOLUTION_API_KEY_AQUI
```
7. Clique **Create**
8. Anote a URL interna: `http://evolution-api:8080`

---

## Passo 4: App Next.js

1. No projeto, clique **New Service** → **App Service**
2. Nome: `wa-agent`
3. **Source**: Git
4. Conecte seu repositório (GitHub/GitLab)
5. **Branch**: `main`
6. **Build Command**: `npm install && npx prisma generate && npm run build`
7. **Start Command**: `npm start`
8. **Port**: 3000
9. **Environment Variables** (preencha com seus valores):

```
NODE_ENV=production
DATABASE_URL=postgresql://wa_agent:SUA_SENHA@wa-agent-db:5432/wa_agent?schema=public
DIRECT_URL=postgresql://wa_agent:SUA_SENHA@wa-agent-db:5432/wa_agent?schema=public
AUTH_SECRET=gere_uma_string_aleatoria_com_openssl_rand_base64_32
NEXTAUTH_URL=https://seudominio.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=sk-...
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=SUA_EVOLUTION_API_KEY_AQUI
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_BUSINESS_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=https://seudominio.com
```

10. Clique **Create**
11. Na aba **Deployments**, clique **Deploy**

---

## Passo 5: Rodar migration do banco

Após o primeiro deploy, você precisa rodar as migrations:

1. No Easypanel, vá no serviço `wa-agent`
2. Abra o **Console/Terminal**
3. Execute:
```bash
npx prisma db push
```

---

## Passo 6: Domínio e SSL

1. No serviço `wa-agent`, vá em **Domains**
2. Clique **Add Domain**
3. Digite seu domínio (ex: `app.seudominio.com`)
4. Configure o DNS no seu registrador:
   - Tipo: `CNAME`
   - Nome: `app` (ou subdomínio escolhido)
   - Valor: o domínio fornecido pelo Easypanel
5. SSL é automático via Let's Encrypt

---

## Passo 7: Configurar Stripe Webhook

1. No Stripe Dashboard → **Developers** → **Webhooks**
2. Endpoint URL: `https://app.seudominio.com/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copie o `whsec_...` para `STRIPE_WEBHOOK_SECRET` no Easypanel

---

## Estrutura no Easypanel

```
Projeto: wa-agent
├── wa-agent (Next.js)      → porta 3000 → https://app.seudominio.com
├── wa-agent-db (PostgreSQL) → porta 5432 (interno)
└── evolution-api            → porta 8080 (interno + opcional externo)
```

---

## Custos estimados Easypanel

| Recurso | Custo |
|---------|-------|
| App Next.js (1GB RAM) | ~$5/mês |
| PostgreSQL | ~$3/mês |
| Evolution API (1GB RAM) | ~$5/mês |
| **Total** | **~$13/mês** |

---

## Comandos úteis (Console do Easypanel)

```bash
# Verificar status da app
pm2 status

# Ver logs
pm2 logs

# Reiniciar
pm2 restart all

# Rodar migration
npx prisma db push

# Gerar Prisma client
npx prisma generate
```