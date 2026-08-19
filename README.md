# OralCardio

Aplicação web mobile-first para pacientes cardíacos, focada na prevenção da
Endocardite Infecciosa através de hábitos consistentes de saúde bucal. Veja a
[documentação técnica completa](documentacao_tecnica.md) para o contexto de
produto e o desenho do banco de dados.

## Estrutura do monorepo

```
cardio-care/
├── backend/      # API REST em FastAPI (Python)
├── frontend/     # PWA em React + Vite + TypeScript
└── database/     # Scripts SQL do schema, triggers, RLS e seed (Supabase)
```

## Pré-requisitos

- Python 3.11+
- Node.js 20+
- Um projeto criado em [supabase.com](https://supabase.com) (gratuito)

## 1. Banco de dados (Supabase)

1. Crie um projeto em supabase.com.
2. No **SQL Editor**, execute os arquivos de `database/` na ordem numérica
   (`001` a `017`). Detalhes em [database/README.md](database/README.md).
3. Em **Settings → API**, copie a Project URL e a chave `publishable`.

## 2. Backend (FastAPI)

```bash
cd backend
python -m venv venv
./venv/Scripts/activate     # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements-dev.txt
cp .env.example .env        # preencha com as credenciais do Supabase
uvicorn app.main:app --reload
```

- API disponível em `http://localhost:8000`
- Documentação automática (Swagger) em `http://localhost:8000/docs`
- Testes: `pytest`
- Lint: `ruff check app tests`

## 3. Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env        # preencha com as credenciais do Supabase e a URL da API
npm run dev
```

- App disponível em `http://localhost:5173`
- Lint: `npm run lint`
- Build de produção: `npm run build`

## Notificações push

O fluxo de usuário para iPhone/iPad e Android, a configuração VAPID, o Cron e
o procedimento de validação estão em
[docs/notificacoes-push.md](docs/notificacoes-push.md).

## Arquitetura e princípios

- **Backend**: arquitetura em camadas (router → service → repository), com
  inversão de dependência via `Protocol` — os services dependem de interfaces
  de repositório, não de implementações concretas, o que facilita testes e
  troca de infraestrutura.
- **Frontend**: organização *feature-based* (`src/features/<feature>`), com
  toda chamada de rede isolada em módulos `api/` — componentes nunca chamam
  `fetch`/`supabase-js` diretamente.
- **Banco de dados**: Row Level Security habilitado em todas as tabelas; cada
  usuário só acessa os próprios dados no nível do banco.

## Próximos passos

Consulte a seção 8 da [documentação técnica](documentacao_tecnica.md) para o
roadmap completo (autenticação, timer de escovação, módulos educacionais,
agenda de consultas e gamificação).
