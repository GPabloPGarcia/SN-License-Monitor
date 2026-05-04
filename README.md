# SN-License Monitor

MVP de micro-SaaS para coletar snapshots semanais de licencas ServiceNow, manter historico e exibir dashboards por visao geral, cliente, instancia e licenca.

## Stack

- Next.js App Router com TypeScript
- PostgreSQL + Prisma ORM
- Tailwind CSS + componentes no estilo shadcn/ui
- Autenticacao propria com cookie HTTP-only, bcrypt e JWT assinado
- Recharts para graficos
- Coletor ServiceNow com modo real e modo mock

## Como executar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

3. Suba o PostgreSQL:

```bash
docker compose up -d
```

4. Crie as tabelas e gere o cliente Prisma:

```bash
npm run db:push
```

5. Execute o seed:

```bash
npm run db:seed
```

6. Rode a aplicacao:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

Usuario inicial:

- Email: valor de `SEED_ADMIN_EMAIL` ou `admin@example.com`
- Senha: valor de `SEED_ADMIN_PASSWORD` ou `Admin@123456`

## Variaveis importantes

- `DATABASE_URL`: conexao PostgreSQL.
- `AUTH_SECRET`: segredo para sessao autenticada.
- `ENCRYPTION_KEY`: segredo usado para criptografar credenciais das instancias.
- `MOCK_SERVICE_NOW`: use `true` para processar arquivos mockados sem credenciais reais.
- `CRON_SECRET`: token do endpoint interno de coleta semanal.

## Coleta semanal

O MVP inclui o endpoint interno:

```text
POST /api/jobs/weekly-collection
Authorization: Bearer <CRON_SECRET>
```

Configure um cron externo para chamar esse endpoint semanalmente. A semana de referencia considera segunda-feira como inicio.

## ServiceNow

O frontend nunca chama o ServiceNow diretamente. O backend consulta:

- `/api/now/table/sn_sub_man_st_subscription_overview`
- `/api/now/table/subscription_entitlement/{sys_id}`
- `/api/now/table/license_details`

No modo real, configure usuario e senha Basic Auth pela tela de instancias. As credenciais sao criptografadas no banco e nunca sao renderizadas no frontend.
