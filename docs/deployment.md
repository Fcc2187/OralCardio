# Deploy e operação — OralCardio

Este guia publica a PWA no **Vercel**, a API FastAPI no **Render** e mantém
PostgreSQL, Auth, Vault e Cron no **Supabase**. Execute primeiro tudo em
staging; produção só recebe uma versão que passou pelo checklist final.

```text
app.seu-dominio.com ── Vercel ──► api.seu-dominio.com ── Render/FastAPI
       │                                           │
       └──────────────────────────────► Supabase ──┘
                                             │
                                      Cron/Vault/Web Push
```

## 1. Preparação de ambientes

Crie ambientes separados para `staging` e `production`. Cada um precisa de:

- projeto Supabase próprio ou, no mínimo, chaves e dados completamente
  isolados;
- par VAPID próprio;
- serviço Render próprio;
- projeto Vercel próprio;
- domínio HTTPS próprio;
- token de dispatcher exclusivo.

Nunca copie `SUPABASE_SECRET_KEY`, chave privada VAPID ou
`NOTIFICATION_DISPATCH_TOKEN` para o frontend, GitHub ou arquivos `.env`
versionados.

## 2. Supabase e migrations

1. Faça um backup verificável do projeto de produção.
2. Confirme no histórico quais migrations já foram aplicadas.
3. Aplique as pendentes em ordem numérica, até `019` para o estado atual.
4. Para esta entrega, aplique `020_appointment_cursor_pagination.sql` e
   `021_push_revocation_tokens.sql`.
5. Publique backend e frontend desta versão.
6. Verifique criação/edição de consulta, página seguinte da agenda, login,
   logout e Push.
7. Depois que não existir mais instância antiga de backend, aplique
   `022_remove_legacy_push_subscription_rpc.sql`.

O `022` não deve ser antecipado: ele remove a permissão do RPC usado pela
versão anterior do backend durante a transição.

Execute também os testes SQL documentados em [database/tests/README.md](../database/tests/README.md).

## 3. Render — FastAPI

O arquivo [render.yaml](../render.yaml) descreve o serviço. No Render:

1. Crie um Blueprint a partir do repositório ou um Web Service Docker com
   `Root Directory = backend`.
2. Vincule o domínio `api.seu-dominio.com` e aguarde o TLS ficar ativo.
3. Cadastre as variáveis abaixo. Todas as URLs devem usar HTTPS, sem barra ou
   caminho ao final.

```env
ENV=production
LOG_LEVEL=INFO
CORS_ORIGINS=https://app.seu-dominio.com
ALLOWED_HOSTS=api.seu-dominio.com
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
WEB_PUSH_VAPID_PUBLIC_KEY=...
WEB_PUSH_VAPID_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----... ou caminho PEM legível
WEB_PUSH_VAPID_SUBJECT=mailto:contato@seu-dominio.com
WEB_PUSH_VAPID_KEY_VERSION=1
NOTIFICATION_DISPATCH_TOKEN=<ao-menos-32-caracteres-aleatórios>
```

4. Confirme `GET /api/v1/health/live` (processo) e
   `GET /api/v1/health/ready` (Supabase) após publicar.
5. Em produção, `/docs`, `/redoc` e `/openapi.json` devem retornar `404`.

O container executa como usuário sem privilégios, não executa migrations no
startup e usa `PORT` fornecida pelo Render.

## 4. Vercel — PWA

Crie um projeto Vercel com:

- repositório: este monorepo;
- `Root Directory`: `frontend`;
- build command: `npm run build:production`;
- output: `dist` (detectado pelo Vite);
- Node.js: 24.

Cadastre no Vercel:

```env
VITE_DEPLOYMENT_ENV=production
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_API_BASE_URL=https://api.seu-dominio.com
VITE_RELEASE_ID=<commit-git-ou-versão>
```

O arquivo [frontend/vercel.json](../frontend/vercel.json) já configura
fallback da SPA, cache seguro para HTML/service worker e headers que não
dependem do domínio final.

### CSP obrigatória

A CSP exige os domínios reais e, por isso, não deve conter placeholders no
arquivo versionado. No painel Vercel, primeiro configure o header
`Content-Security-Policy-Report-Only` e monitore os relatórios; depois altere
para `Content-Security-Policy`:

```text
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
script-src 'self';
style-src 'self';
font-src 'self';
img-src 'self' data:;
connect-src 'self' https://seu-projeto.supabase.co https://api.seu-dominio.com;
manifest-src 'self';
worker-src 'self';
upgrade-insecure-requests
```

Não adicione `unsafe-eval`. Só adicione `unsafe-inline` se uma violação real e
revisada demonstrar que ele é inevitável.

## 5. Supabase Auth e Web Push

No Supabase Auth, configure `Site URL` e `Redirect URLs` para os domínios de
staging e produção. Configure SMTP real antes de convidar pacientes, incluindo
confirmação de e-mail e recuperação de senha.

Depois que o backend HTTPS estiver saudável, guarde no Vault:

```sql
select vault.create_secret(
  'https://api.seu-dominio.com',
  'notification_dispatch_url'
);

select vault.create_secret(
  '<o-mesmo-NOTIFICATION_DISPATCH_TOKEN-do-Render>',
  'notification_dispatch_token'
);
```

Valide no Cron os jobs `oralcardio-notification-dispatch` e
`oralcardio-notification-cleanup`. O dispatcher recebe chamadas a cada minuto;
`404/410` revogam subscriptions e `429/5xx` usam retry no outbox.

## 6. Gates automatizados

Antes de qualquer deploy, devem passar:

```powershell
cd backend
python -m pip install -r requirements-dev.txt
python -m ruff check app tests
python -m pytest -q
python -m pip_audit

cd ../frontend
npm ci
npm run lint
npm test
npm run build:production
npm audit --audit-level=high
npx playwright install --with-deps chromium
npm run test:e2e
```

O workflow do frontend executa testes unitários, build, audit e Playwright. O
workflow de backend executa lint, testes e auditoria Python.

## 7. Smoke test e validação física

Em staging e novamente em produção, valide:

- cadastro, confirmação de e-mail, login, logout e troca de usuário;
- questionário, escovação, registros sucessivos de fio dental e pontos;
- conquista na virada de data de `America/Sao_Paulo`;
- criar, editar, cancelar e paginar consultas;
- deep link em rota da agenda e recuperação offline básica da PWA;
- Android Chrome aberto e PWA fechada;
- iPhone/iPad 16.4+ com a PWA instalada na Tela de Início e fechada;
- permissão Push negada, logout offline, reconexão e rotação de VAPID.

## 8. Observabilidade, backup e rollback

Antes da abertura para pacientes, conecte uma ferramenta de monitoramento que
capture exceções sem token, e-mail, endpoint Push ou dado clínico. Monitore:

- disponibilidade e latência da API;
- erros `5xx` e `X-Request-ID`;
- execução do Cron;
- idade da entrega pendente mais antiga;
- retries, deliveries mortas e subscriptions revogadas.

Mantenha backup do Supabase e faça ao menos uma restauração de teste. Para
rollback, restaure primeiro o frontend/serviço backend anterior; para parar
Push sem apagar dados, desabilite o job Cron ou remova os dois segredos do
Vault. Não aplique migrations destrutivas no mesmo instante de uma mudança sem
backup verificável.
