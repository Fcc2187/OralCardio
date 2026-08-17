# 📋 Documentação Técnica — CardioCare Connect

> **Versão:** 1.1.0
> **Data:** Agosto de 2026  
> **Idioma do Código:** Inglês (padrão técnico)  
> **Idioma da Interface:** Português (Brasil)

---

## 1. Visão Geral do Projeto

O **CardioCare Connect** é uma aplicação web mobile-first voltada para **pacientes com condições cardíacas**, com foco na prevenção da **Endocardite Infecciosa** — uma infecção grave do coração que pode ser desencadeada por bactérias oriundas da boca durante uma má higiene oral.

### Objetivo Principal
Engajar o paciente cardíaco em hábitos consistentes de saúde bucal através de:
- Orientação diária com timer guiado de escovação
- Educação sobre a conexão boca-coração
- Gamificação e recompensas para manter a adesão
- Organização de consultas odontológicas

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Front-end** | React + Vite | PWA mobile-first, componentização, possível migração futura para React Native |
| **Back-end** | Python + FastAPI | API REST performática, documentação automática (Swagger), compatível com IA/ML no futuro |
| **Banco de Dados** | PostgreSQL (via Supabase) | Dados relacionais estruturados, open source, robusto para dados de saúde |
| **Autenticação** | Supabase Auth | Login com email/senha e social login já incluídos, JWT embutido |
| **Storage** | Supabase Storage | Armazenamento de arquivos (ex: relatórios em PDF) |

### Arquitetura Geral

```
┌─────────────────────────────────┐
│     Mobile Browser / PWA        │
│        React + Vite             │
└────────────────┬────────────────┘
                 │ HTTP / REST
                 ▼
┌─────────────────────────────────┐
│       FastAPI (Python)          │
│   Rotas, Regras de Negócio,     │
│   Validação com Pydantic        │
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌───────────────┐  ┌──────────────────┐
│  PostgreSQL   │  │  Supabase Auth   │
│  (Supabase)   │  │  (JWT Tokens)    │
│  Dados do App │  │  Usuários/Senhas │
└───────────────┘  └──────────────────┘
```

---

## 3. Funcionalidades do Sistema

### 3.1 🏠 Dashboard (Home)
Tela principal do usuário após o login. Exibe:
- Saudação personalizada com o nome do paciente
- Status do questionário de saúde (completo/incompleto)
- Resumo rápido do dia: escovações, streak atual, pontos
- Atalhos para as funções principais

> **Fluxo:** O usuário só tem acesso pleno ao app após completar o questionário de saúde (`health_profiles.is_completed = TRUE`).

---

### 3.2 ⏱️ Timer de Escovação

Timer de **2 minutos** dividido em **5 zonas da boca**:

| Zona | Código no BD | Tempo |
|---|---|---|
| Superior Direito | `upper_right` | ~24s |
| Superior Esquerdo | `upper_left` | ~24s |
| Inferior Direito | `lower_right` | ~24s |
| Inferior Esquerdo | `lower_left` | ~24s |
| Língua | `tongue` | ~24s |

**Fluxo de dados:**
1. Usuário inicia o timer → cria um registro em `brushing_sessions` com `is_completed = FALSE`
2. O mapa vetorial da boca destaca quatro quadrantes e a língua; cada zona
   concluída é persistida sequencialmente em `zones_completed[]`
3. Ao finalizar os 2 minutos → a última zona é confirmada antes de
   `is_completed = TRUE` e `completed_at` ser preenchido
4. **Trigger automático** no banco atualiza `user_stats`: pontos (+5), streak e nível

**Regras de Negócio:**
- Toda sessão completa soma `total_brushings` e +5 pontos, sem limite diário
- O streak avança no máximo uma vez por data civil de `America/Sao_Paulo`
- Escovações adicionais no mesmo dia mantêm o streak e incrementam o contador diário
- A sessão é salva mesmo que incompleta (para análise de aderência futura)

---

### 3.3 📚 Módulos Educacionais

Conteúdo educacional sobre a conexão boca-coração. Estrutura modular com JSON flexível.

**Categorias disponíveis:**

| Categoria | Descrição |
|---|---|
| `mouth_heart_connection` | A conexão entre saúde bucal e cardíaca |
| `bacteremia` | Como bactérias orais entram na corrente sanguínea |
| `endocarditis` | O que é endocardite e seus riscos |
| `gingivitis` | Riscos da gengivite para pacientes cardíacos |
| `oral_hygiene_techniques` | Técnicas corretas de escovação e fio dental |
| `medication_interactions` | Interação entre medicamentos cardíacos e odontologia |

**Fluxo de dados:**
1. App busca todos os módulos ativos (`is_active = TRUE`) em `education_modules`
2. Progresso do usuário é buscado em `user_module_progress`
3. Ao iniciar um módulo → registro criado com `started_at`
4. Ao concluir → `is_completed = TRUE` e `completed_at` preenchido

---

### 3.4 📅 Agenda de Consultas

Gerenciamento completo das consultas odontológicas do paciente.

**Tipos de consulta (`appointment_type`):**
- `routine_checkup` — Exame de rotina
- `cleaning` — Limpeza / profilaxia
- `emergency` — Emergência
- `follow_up` — Retorno
- `procedure` — Procedimento odontológico

**Status do ciclo de vida (`appointment_status`):**
```
scheduled → completed
           → cancelled
           → rescheduled → scheduled (novo ciclo)
```

**Campos da consulta:** dentista, clínica, endereço, telefone, data/hora, tipo, notas e lembretes.

---

### 3.5 🏆 Gamificação

Sistema de pontos, níveis e conquistas para manter o engajamento do paciente.

#### Sistema de Pontos

| Ação | Pontos |
|---|---|
| Completar sessão de escovação | +5 pts, sem limite diário |
| Registrar uso de fio dental | +5 pts, sem limite diário |
| Concluir módulo educacional | +15 pts (via conquista) |
| Completar perfil de saúde | +25 pts (via conquista) |
| Agendar primeira consulta | +20 pts (via conquista) |

#### Progressão de Níveis

| Nível | Nome | Pontos Necessários |
|---|---|---|
| 1 | 🌱 Semente | 0 — 19 pts |
| 2 | 🌿 Broto | 20 — 49 pts |
| 3 | 🌳 Raiz | 50 — 99 pts |
| 4 | 🌸 Flor | 100 — 249 pts |
| 5 | 🍎 Fruto | 250 — 499 pts |
| 6 | 💙 Guardião do Coração | 500+ pts |

#### Streak (Sequência de Dias)
- Calculado automaticamente por **trigger** no banco ao completar cada escovação
- Se o usuário escovar no dia seguinte → streak incrementa
- Se pular um dia → streak reseta para 1
- Escovações adicionais no mesmo dia não alteram a sequência
- `longest_streak_days` nunca diminui (guarda o recorde histórico)
- Todas as datas de negócio usam `America/Sao_Paulo`

#### Revelação de conquistas

- A condição é persistida e o bônus é concedido imediatamente, de forma atômica
- A conquista permanece oculta até a data civil seguinte em São Paulo
- Claim e confirmação de exibição são idempotentes e usam lease temporário para
  impedir duplicidade entre dispositivos sem perder a notificação

#### Conquistas Disponíveis (10 no lançamento)

| Nome | Condição | Pontos |
|---|---|---|
| 🦷 Primeira Escovação | 1ª sessão completada | 10 |
| 🔥 Semana Perfeita | Streak de 7 dias | 50 |
| 🏆 Mês Dedicado | Streak de 30 dias | 200 |
| 📚 Primeira Leitura | 1º módulo concluído | 15 |
| 🎓 Estudante Assíduo | Todos os módulos concluídos | 100 |
| 📅 Agenda Organizada | 1ª consulta agendada | 20 |
| ✅ Perfil Completo | Perfil de saúde completo | 25 |
| ⭐ 50 Escovações | 50 sessões totais | 75 |
| 💎 100 Escovações | 100 sessões totais | 150 |
| 🪥 Fio Dental Frequente | 30 registros de fio dental | 60 |

---

## 4. Banco de Dados — Documentação das Tabelas

> **Schema:** `public`  
> **Banco:** PostgreSQL 15+ (Supabase)  
> **Quantidade atual:** 10 tabelas de domínio
> **Padrão de ID:** UUID (Universally Unique Identifier)  
> **Padrão de data:** TIMESTAMPTZ (com fuso horário)

---

### 4.1 `users`

Armazena o perfil público de cada usuário do sistema. Extensão da tabela `auth.users` gerenciada internamente pelo Supabase.

> **Criação automática:** Um trigger cria o registro nesta tabela automaticamente quando um usuário se registra pelo Supabase Auth.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Referência direta ao `auth.users(id)` do Supabase |
| `full_name` | TEXT | ✅ | Nome completo do usuário |
| `avatar_url` | TEXT | ❌ | URL da foto de perfil |
| `phone` | TEXT | ❌ | Telefone de contato |
| `date_of_birth` | DATE | ❌ | Data de nascimento |
| `created_at` | TIMESTAMPTZ | ✅ | Data de criação (automático) |
| `updated_at` | TIMESTAMPTZ | ✅ | Data da última atualização (atualizado por trigger) |

**Relacionamentos:**
- `1:1` → `health_profiles`
- `1:1` → `user_stats`
- `1:N` → `brushing_sessions`
- `1:N` → `flossing_logs`
- `1:N` → `appointments`
- `N:N` → `education_modules` (via `user_module_progress`)
- `N:N` → `achievements` (via `user_achievements`)

---

### 4.2 `health_profiles`

Dados clínicos do paciente coletados no questionário inicial de saúde. Cada usuário tem **no máximo um** perfil de saúde.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Identificador único |
| `user_id` | UUID (FK, UNIQUE) | ✅ | Referência ao usuário |
| `cardiac_condition` | ENUM | ✅ | Tipo de condição cardíaca |
| `cardiac_condition_detail` | TEXT | ❌ | Descrição livre da condição |
| `has_pacemaker` | BOOLEAN | ✅ | Possui marcapasso? |
| `has_prosthetic_valve` | BOOLEAN | ✅ | Possui válvula prostética? |
| `medications` | TEXT[] | ❌ | Lista de medicamentos em uso |
| `allergies` | TEXT[] | ❌ | Alergias a medicamentos |
| `last_dental_visit` | DATE | ❌ | Data da última visita ao dentista |
| `brushing_frequency_before` | SMALLINT | ❌ | Frequência de escovação antes do app (vezes/dia) |
| `dentist_name` | TEXT | ❌ | Nome do dentista de referência |
| `dentist_phone` | TEXT | ❌ | Telefone do dentista |
| `cardiologist_name` | TEXT | ❌ | Nome do cardiologista |
| `is_completed` | BOOLEAN | ✅ | Questionário completamente preenchido? |
| `created_at` | TIMESTAMPTZ | ✅ | Data de criação |
| `updated_at` | TIMESTAMPTZ | ✅ | Última atualização |

**ENUMs de `cardiac_condition`:**
- `valve_disease` — Doença valvular
- `congenital_heart` — Cardiopatia congênita
- `heart_failure` — Insuficiência cardíaca
- `arrhythmia` — Arritmia
- `coronary_artery` — Doença arterial coronariana
- `endocarditis_history` — Histórico de endocardite
- `other` — Outro

---

### 4.3 `brushing_sessions`

Registro de cada sessão de escovação guiada pelo timer do app.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Identificador único da sessão |
| `user_id` | UUID (FK) | ✅ | Referência ao usuário |
| `started_at` | TIMESTAMPTZ | ✅ | Quando o timer foi iniciado |
| `completed_at` | TIMESTAMPTZ | ❌ | Quando foi finalizado (NULL se abandonado) |
| `duration_seconds` | SMALLINT | ❌ | Duração real em segundos |
| `target_duration` | SMALLINT | ✅ | Duração alvo (padrão: 120 segundos) |
| `zones_completed` | TEXT[] | ❌ | Zonas da boca concluídas |
| `is_completed` | BOOLEAN | ✅ | Completou todos os 2 minutos? |
| `technique_tip_shown` | TEXT | ❌ | Dica de técnica exibida ao usuário |
| `notes` | TEXT | ❌ | Anotação opcional do usuário |
| `created_at` | TIMESTAMPTZ | ✅ | Data de criação |

**Valores possíveis de `zones_completed`:**
`upper_right`, `upper_left`, `lower_right`, `lower_left`, `tongue`

**Índices:** `user_id`, `started_at DESC`

---

### 4.4 `flossing_logs`

Registro simples de uso de fio dental.

Cada registro é independente, incrementa `total_flossings` e concede +5 pontos,
sem limite diário. Todos os registros contam para conquistas relacionadas.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Identificador único |
| `user_id` | UUID (FK) | ✅ | Referência ao usuário |
| `logged_at` | TIMESTAMPTZ | ✅ | Quando foi registrado |
| `notes` | TEXT | ❌ | Observação opcional |
| `created_at` | TIMESTAMPTZ | ✅ | Data de criação |

---

### 4.5 `education_modules`

Catálogo de módulos educacionais criados pelos administradores do sistema. **Dados públicos para leitura** por qualquer usuário autenticado.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Identificador único |
| `title` | TEXT | ✅ | Título do módulo |
| `slug` | TEXT (UNIQUE) | ✅ | Identificador amigável para URL (ex: `o-que-e-bacteremia`) |
| `description` | TEXT | ✅ | Descrição curta do módulo |
| `content` | JSONB | ✅ | Conteúdo estruturado em JSON (seções, parágrafos, imagens, quizzes) |
| `category` | ENUM | ✅ | Categoria do conteúdo |
| `order_index` | SMALLINT | ✅ | Ordem de exibição na listagem |
| `estimated_minutes` | SMALLINT | ✅ | Tempo estimado de leitura em minutos |
| `thumbnail_url` | TEXT | ❌ | URL da imagem de capa |
| `is_active` | BOOLEAN | ✅ | Módulo visível para os usuários? |
| `created_at` | TIMESTAMPTZ | ✅ | Data de criação |
| `updated_at` | TIMESTAMPTZ | ✅ | Última atualização |

**Estrutura sugerida do campo `content` (JSONB):**
```json
{
  "sections": [
    {
      "type": "text",
      "title": "O que é bacteremia?",
      "body": "Bacteremia é a presença de bactérias na corrente sanguínea..."
    },
    {
      "type": "image",
      "url": "https://...",
      "caption": "Diagrama da conexão boca-coração"
    },
    {
      "type": "quiz",
      "question": "Qual o principal fator de risco?",
      "options": ["Gengivite", "Cárie", "Tártaro"],
      "correct": 0
    }
  ]
}
```

---

### 4.6 `user_module_progress`

Tabela de junção que rastreia o progresso de cada usuário em cada módulo educacional.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Identificador único |
| `user_id` | UUID (FK) | ✅ | Referência ao usuário |
| `module_id` | UUID (FK) | ✅ | Referência ao módulo |
| `started_at` | TIMESTAMPTZ | ✅ | Quando iniciou a leitura |
| `completed_at` | TIMESTAMPTZ | ❌ | Quando concluiu (NULL se em andamento) |
| `is_completed` | BOOLEAN | ✅ | Módulo concluído? |
| `read_time_seconds` | INT | ❌ | Tempo real de leitura em segundos |

> **Constraint:** `UNIQUE(user_id, module_id)` — Um usuário tem apenas um registro de progresso por módulo.

---

### 4.7 `appointments`

Registro de consultas odontológicas agendadas pelo paciente.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Identificador único |
| `user_id` | UUID (FK) | ✅ | Referência ao usuário |
| `scheduled_at` | TIMESTAMPTZ | ✅ | Data e hora da consulta |
| `appointment_type` | ENUM | ✅ | Tipo de consulta |
| `dentist_name` | TEXT | ✅ | Nome do dentista |
| `clinic_name` | TEXT | ❌ | Nome da clínica |
| `clinic_address` | TEXT | ❌ | Endereço da clínica |
| `clinic_phone` | TEXT | ❌ | Telefone da clínica |
| `notes` | TEXT | ❌ | Observações sobre a consulta |
| `status` | ENUM | ✅ | Status atual (scheduled/completed/cancelled/rescheduled) |
| `reminder_sent` | BOOLEAN | ✅ | Lembrete já enviado por notificação? |
| `created_at` | TIMESTAMPTZ | ✅ | Data de criação |
| `updated_at` | TIMESTAMPTZ | ✅ | Última atualização |

**Índices:** `user_id`, `scheduled_at DESC`, `status`

---

### 4.8 `achievements`

Catálogo de todas as conquistas/badges disponíveis no sistema. **Dado de configuração**, criado pelos administradores.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Identificador único |
| `name` | TEXT | ✅ | Nome da conquista |
| `description` | TEXT | ✅ | Descrição da conquista |
| `icon` | TEXT | ✅ | Emoji ou nome do ícone |
| `condition_type` | ENUM | ✅ | Tipo de condição para desbloquear |
| `condition_value` | INT | ✅ | Valor da condição (ex: 7 para streak de 7 dias) |
| `points_reward` | SMALLINT | ✅ | Pontos concedidos ao desbloquear |
| `is_active` | BOOLEAN | ✅ | Conquista ativa no sistema? |
| `created_at` | TIMESTAMPTZ | ✅ | Data de criação |

---

### 4.9 `user_achievements`

Tabela de junção que registra quais conquistas cada usuário desbloqueou.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Identificador único |
| `user_id` | UUID (FK) | ✅ | Referência ao usuário |
| `achievement_id` | UUID (FK) | ✅ | Referência à conquista |
| `earned_at` | TIMESTAMPTZ | ✅ | Quando foi desbloqueada |
| `visible_on` | DATE | ✅ | Primeira data civil em que pode ser exibida |
| `reveal_claimed_at` | TIMESTAMPTZ | ❌ | Início do lease temporário de apresentação |
| `revealed_at` | TIMESTAMPTZ | ❌ | Confirmação de que foi apresentada |

> **Constraint:** `UNIQUE(user_id, achievement_id)` — Cada conquista é desbloqueada apenas uma vez por usuário.

---

### 4.10 `user_stats`

Tabela de **agregação de estatísticas** de gamificação. **Uma linha por usuário.** Atualizada automaticamente por triggers do banco ao completar escovações.

> **Criação automática:** Um trigger cria o registro nesta tabela com valores zerados quando o usuário se registra.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Identificador único |
| `user_id` | UUID (FK, UNIQUE) | ✅ | Referência ao usuário |
| `total_points` | INT | ✅ | Total de pontos acumulados |
| `level` | SMALLINT | ✅ | Nível atual (1–6) |
| `level_name` | TEXT | ✅ | Nome do nível atual |
| `current_streak_days` | SMALLINT | ✅ | Sequência atual de dias escovando |
| `longest_streak_days` | SMALLINT | ✅ | Maior sequência já alcançada (recorde) |
| `total_brushings` | INT | ✅ | Total de sessões de escovação completas |
| `total_flossings` | INT | ✅ | Total de registros de fio dental |
| `last_brushing_date` | DATE | ❌ | Data da última escovação registrada |
| `last_flossing_date` | DATE | ❌ | Data do último fio dental registrado |
| `brushings_on_last_date` | INT | ✅ | Escovações na última data registrada |
| `flossings_on_last_date` | INT | ✅ | Usos de fio na última data registrada |
| `updated_at` | TIMESTAMPTZ | ✅ | Última atualização |

---

## 5. Automações no Banco (Triggers)

### `handle_new_user()`
- **Quando dispara:** `AFTER INSERT ON auth.users`
- **O que faz:** Cria automaticamente um registro em `public.users` e em `public.user_stats` (zerado) para o novo usuário.

### `handle_updated_at()`
- **Quando dispara:** `BEFORE UPDATE` nas tabelas: `users`, `health_profiles`, `appointments`, `user_stats`
- **O que faz:** Atualiza automaticamente o campo `updated_at` com a data/hora atual.

### `handle_new_brushing_session()`
- **Quando dispara:** na transição `is_completed = FALSE → TRUE`
- **O que faz:** Ao concluir uma sessão, atualiza atomicamente em `user_stats`:
  - `total_brushings` (+1)
  - `total_points` (+5)
  - `current_streak_days` (incrementa ou reseta somente em nova data civil)
  - `longest_streak_days` (atualiza se novo recorde)
  - `last_brushing_date` e `brushings_on_last_date`
  - `level` e `level_name`

### `handle_new_flossing_log()`
- **Quando dispara:** `AFTER INSERT ON flossing_logs`
- **O que faz:** Incrementa `total_flossings`, soma +5 pontos, registra a data e
  o contador diário e recalcula o nível.

### Funções de conquistas
- `unlock_achievement()` insere uma conquista uma única vez, concede seu bônus
  imediatamente e define `visible_on` para o dia seguinte em São Paulo.
- `claim_due_achievement_reveals()` reivindica conquistas vencidas com lease de
  15 minutos e bloqueio concorrente.
- `acknowledge_achievement_reveals()` confirma a exibição sem duplicar efeitos.

---

## 6. Segurança — Row Level Security (RLS)

Todas as tabelas possuem **RLS habilitado** no Supabase. Isso garante que cada usuário acessa **apenas seus próprios dados**, diretamente no nível do banco de dados.

| Tabela | Acesso autenticado |
|---|---|
| `users` | SELECT e UPDATE somente do próprio registro |
| `health_profiles` | ALL somente nos próprios registros |
| `brushing_sessions` | ALL somente nos próprios registros |
| `flossing_logs` | ALL somente nos próprios registros |
| `appointments` | ALL somente nos próprios registros |
| `user_stats` | SELECT somente do próprio registro |
| `user_module_progress` | ALL somente nos próprios registros |
| `user_achievements` | SELECT somente dos próprios registros |
| `education_modules` | SELECT do catálogo ativo |
| `achievements` | SELECT do catálogo ativo |

O banco continua sendo a autoridade final de autorização e pontuação. O
FastAPI opera com o JWT do usuário autenticado, e nenhuma política concede
acesso transversal a dados de outro paciente.

---

## 7. Diagrama de Relacionamento (Simplificado)

```
auth.users (Supabase)
    │ (1:1)
    ▼
users
  │ (1:1)
  ├──► health_profiles
  │
  │ (1:N)
  ├──► brushing_sessions
  │ (1:N)
  ├──► flossing_logs
  │
  │ (1:N)
  ├──► appointments
  │
  │ (1:1)
  ├──► user_stats
  │
  │ (N:N via user_module_progress)
  ├──► education_modules
  │
  │ (N:N via user_achievements)
  └──► achievements
```

---

## 8. Próximos Passos de Desenvolvimento

- [x] **Fase 1 — Infraestrutura**: Criar projeto no Supabase, aplicar o schema SQL, configurar variáveis de ambiente
- [x] **Fase 2 — Back-end (FastAPI)**: Criar as rotas de API (autenticação, usuários, escovação, consultas e gamificação)
- [x] **Fase 3 — Front-end (React + Vite)**: Criar estrutura PWA mobile-first, telas e componentes
- [ ] **Fase 4 — Integrações**: Notificações push para lembretes de hábitos e consultas
- [ ] **Fase 5 — Testes e Deploy**: Testes de integração e publicação
