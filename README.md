# SN-License Monitor

MVP de micro-SaaS para coletar snapshots semanais de licencas ServiceNow, manter historico e exibir dashboards por visao geral, cliente, instancia e licenca.

## Funcionalidades

- Dashboard com KPIs, graficos e riscos por licenca.
- Cadastro de clientes e instancias ServiceNow.
- Coleta manual por escopo geral, cliente ou instancia.
- Coleta semanal por endpoint interno protegido por `CRON_SECRET`.
- Modo mock para testar a coleta sem credenciais reais do ServiceNow.
- Autenticacao propria com cookie HTTP-only, bcrypt e JWT assinado.
- Perfis `ADMIN` e `VIEWER`.
- Tela de usuarios para administradores criarem, editarem, desativarem ou excluirem outros admins e viewers.
- Logout em `/logout` para alternar entre usuarios durante testes.

## Stack

- Next.js App Router com TypeScript
- PostgreSQL + Prisma ORM
- Tailwind CSS + componentes no estilo shadcn/ui
- Recharts para graficos
- Docker Compose para banco local

## Como Executar Localmente

1. Instale as dependencias:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Revise o `.env`.

Para desenvolvimento local com o `docker-compose.yml`, o `DATABASE_URL` deve apontar para o PostgreSQL local. Preencha tambem `AUTH_SECRET`, `ENCRYPTION_KEY`, `CRON_SECRET` e os dados do usuario admin inicial.

Exemplo:

```env
SEED_ADMIN_NAME="Seu Nome"
SEED_ADMIN_EMAIL="admin.local@example.com"
SEED_ADMIN_PASSWORD="use-uma-senha-forte-local"
```

4. Suba o PostgreSQL:

```bash
docker compose up -d
```

5. Crie as tabelas e gere o cliente Prisma:

```bash
npm run db:push
```

6. Execute o seed:

```bash
npm run db:seed
```

7. Rode a aplicacao:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Usuario Inicial

O seed cria um usuario `ADMIN`.

- Email: valor de `SEED_ADMIN_EMAIL`.
- Senha: valor de `SEED_ADMIN_PASSWORD`.
- Nome: valor de `SEED_ADMIN_NAME`.

Preencha essas variaveis antes de rodar `npm run db:seed`. O seed falha se `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` ou `SEED_ADMIN_PASSWORD` estiverem ausentes ou vazios.

## Perfis de Acesso

`ADMIN`:

- Acessa dashboards e consultas.
- Cadastra e edita clientes.
- Cadastra e edita instancias.
- Executa coletas manuais.
- Gerencia usuarios em `/users`.
- Pode criar outros usuarios `ADMIN` ou `VIEWER`.
- Pode ativar, desativar ou excluir usuarios.
- Nao pode remover o ultimo administrador ativo.

`VIEWER`:

- Acessa dashboards, clientes, instancias, licencas e historico de coletas em modo consulta.
- Nao executa coletas manuais.
- Nao cria nem edita clientes, instancias ou usuarios.

Usuarios desativados nao conseguem fazer login. Se um usuario ativo for excluido, a sessao deixa de ser considerada valida na proxima verificacao da aplicacao.

Para sair da sessao atual e testar outro usuario, use o menu do usuario no topo direito ou acesse:

```text
/logout
```

## Variaveis Importantes

- `DATABASE_URL`: conexao PostgreSQL usada pelo Prisma.
- `AUTH_SECRET`: segredo para assinar a sessao autenticada.
- `ENCRYPTION_KEY`: segredo usado para criptografar credenciais das instancias.
- `MOCK_SERVICE_NOW`: use `true` para processar arquivos mockados sem credenciais reais.
- `SERVICE_NOW_TIMEOUT_MS`: timeout das chamadas ao ServiceNow.
- `CRON_SECRET`: token do endpoint interno de coleta semanal.
- `SEED_ADMIN_NAME`: nome do admin inicial.
- `SEED_ADMIN_EMAIL`: email do admin inicial.
- `SEED_ADMIN_PASSWORD`: senha do admin inicial.

Nao versionar `.env`, `.env.production` ou qualquer arquivo com segredos reais. O `.env.example` deve conter apenas exemplos ou placeholders.

## Seguranca

- Nao use senhas, tokens ou chaves de exemplo em producao.
- Gere valores fortes e unicos para `AUTH_SECRET`, `ENCRYPTION_KEY` e `CRON_SECRET`.
- Guarde secrets em variaveis de ambiente da plataforma, no servidor ou em secret manager.
- Nao publique `DATABASE_URL` real, credenciais ServiceNow ou token do cron.
- Rode o seed de producao somente com credenciais admin definidas explicitamente.
- Desative ou exclua usuarios que nao devem mais acessar o sistema pela tela `/users`.
- Mantenha pelo menos um `ADMIN` ativo; a aplicacao bloqueia a remocao do ultimo admin ativo.

## Comandos Uteis

```bash
npm run dev
npm run dev:reset
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run db:push
npm run db:seed
npm run db:studio
```

`npm run dev:reset` para servidores Next antigos do projeto e remove o cache `.next`. Use quando aparecer erro de arquivo travado em desenvolvimento.

## Coleta Semanal

O MVP inclui o endpoint interno:

```text
POST /api/jobs/weekly-collection
Authorization: Bearer <CRON_SECRET>
```

Configure um cron externo para chamar esse endpoint semanalmente. A semana de referencia considera segunda-feira como inicio.

Exemplo local:

```bash
curl -X POST http://localhost:3000/api/jobs/weekly-collection \
  -H "Authorization: Bearer <CRON_SECRET>"
```

## ServiceNow

O frontend nunca chama o ServiceNow diretamente. O backend consulta:

- `/api/now/table/sn_sub_man_st_subscription_overview`
- `/api/now/table/subscription_entitlement/{sys_id}`
- `/api/now/table/license_details`

No modo real, configure usuario e senha Basic Auth pela tela de instancias. As credenciais sao criptografadas no banco e nunca sao renderizadas no frontend.

Para testar sem ServiceNow real, configure:

```env
MOCK_SERVICE_NOW=true
```

## Producao

Em producao, configure as variaveis de ambiente na plataforma, no servidor ou em um secret manager. Nao commit valores reais no repositorio.

Antes de subir:

- Gerar `AUTH_SECRET`, `ENCRYPTION_KEY` e `CRON_SECRET` fortes.
- Configurar `DATABASE_URL` com usuario e senha de producao.
- Configurar `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` antes de executar seed.
- Garantir backup do banco.
- Rodar as migracoes ou sincronizacao de schema de acordo com o processo escolhido para producao.
- Executar `npm run build`.
- Subir com `npm run start` ou pelo runtime da plataforma.

Para Prisma em producao, prefira um fluxo de migracoes versionadas. Este MVP usa `prisma db push` no ambiente local para simplificar o desenvolvimento.

## Troubleshooting

### EPERM em `.next\trace` no Windows

Esse erro normalmente acontece quando ha mais de um `npm run dev` rodando ou quando um processo antigo do Next ficou segurando arquivos da pasta `.next`.

Rode:

```powershell
npm run dev:reset
npm run dev
```

Se precisar conferir a porta:

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

Se houver um processo preso na porta 3000:

```powershell
$pid = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess
if ($pid) { Stop-Process -Id $pid -Force }
```

### Login retorna erro ou usuario nao existe

Confirme que o banco esta rodando e que o seed foi executado:

```bash
docker compose up -d
npm run db:push
npm run db:seed
```

Depois tente entrar com o usuario definido em `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`.

### SN-License Monitor