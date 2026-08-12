# 📋 Documentação Técnica — CardioCare Connect

> **Versão:** 1.0.0  
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
- Suporte de cuidadores e familiares
- Organização de consultas odontológicas

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Front-end** | React + Vite | PWA mobile-first, componentização, possível migração futura para React Native |
| **Back-end** | Python + FastAPI | API REST performática, documentação automática (Swagger), compatível com IA/ML no futuro |
| **Banco de Dados** | PostgreSQL (via Supabase) | Dados relacionais estruturados, open source, robusto para dados de saúde |
| **Autenticação** | Supabase Auth | Login com email/senha e social login já incluídos, JWT embutido |
| **Realtime** | Supabase Realtime | Notificações ao vivo para o Modo Cuidador |
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
2. A cada zona concluída, `zones_completed[]` é atualizado
3. Ao finalizar os 2 minutos → `is_completed = TRUE` e `completed_at` é preenchido
4. **Trigger automático** no banco atualiza `user_stats`: pontos (+5), streak e nível

**Regras de Negócio:**
- Apenas 1 sessão por dia conta para o streak e total (evita "batota")
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

### 3.5 👨‍👩‍👧 Modo Cuidador

Permite que o paciente convide familiares ou cuidadores para acompanhar seu progresso remotamente.

**Fluxo de convite:**
```
1. Paciente informa e-mail do cuidador
2. Sistema cria registro em caregivers (status = 'pending')
3. E-mail de convite é enviado ao cuidador
4. Cuidador aceita o convite → status = 'active', accepted_at preenchido
5. Cuidador passa a ver os dados do paciente via painel específico
```

**Permissões granulares por cuidador:**

| Permissão | Campo | Descrição |
|---|---|---|
| Ver relatórios | `can_view_reports` | Acesso ao histórico de escovações e estatísticas |
| Ver consultas | `can_view_appointments` | Visualização da agenda de consultas |
| Receber alertas | `receive_alerts` | Notificação quando paciente não escova por X dias |

> **Segurança:** Cuidadores só conseguem **visualizar** dados. Nunca alterar ou excluir. Isso é garantido pelas políticas de RLS do banco.

---

### 3.6 🏆 Gamificação

Sistema de pontos, níveis e conquistas para manter o engajamento do paciente.

#### Sistema de Pontos

| Ação | Pontos |
|---|---|
| Completar sessão de escovação | +5 pts |
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
- `longest_streak_days` nunca diminui (guarda o recorde histórico)

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
- `1:N` → `caregivers` (como paciente)
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

### 4.8 `caregivers`

Define o vínculo entre um paciente e seus cuidadores com permissões granulares.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Identificador único |
| `patient_id` | UUID (FK) | ✅ | Referência ao paciente |
| `caregiver_email` | TEXT | ✅ | E-mail do cuidador convidado |
| `caregiver_user_id` | UUID (FK, nullable) | ❌ | UUID do cuidador se ele tiver conta no sistema |
| `status` | ENUM | ✅ | `pending` / `active` / `revoked` |
| `can_view_reports` | BOOLEAN | ✅ | Pode ver relatórios de escovação? |
| `can_view_appointments` | BOOLEAN | ✅ | Pode ver a agenda de consultas? |
| `receive_alerts` | BOOLEAN | ✅ | Recebe alertas de falha de escovação? |
| `invited_at` | TIMESTAMPTZ | ✅ | Quando o convite foi enviado |
| `accepted_at` | TIMESTAMPTZ | ❌ | Quando o convite foi aceito |
| `revoked_at` | TIMESTAMPTZ | ❌ | Quando o acesso foi revogado |

> **Constraint:** `UNIQUE(patient_id, caregiver_email)` — Um e-mail só pode ser convidado uma vez por paciente.

---

### 4.9 `achievements`

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

### 4.10 `user_achievements`

Tabela de junção que registra quais conquistas cada usuário desbloqueou.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID (PK) | ✅ | Identificador único |
| `user_id` | UUID (FK) | ✅ | Referência ao usuário |
| `achievement_id` | UUID (FK) | ✅ | Referência à conquista |
| `earned_at` | TIMESTAMPTZ | ✅ | Quando foi desbloqueada |

> **Constraint:** `UNIQUE(user_id, achievement_id)` — Cada conquista é desbloqueada apenas uma vez por usuário.

---

### 4.11 `user_stats`

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
- **Quando dispara:** `AFTER INSERT OR UPDATE OF is_completed ON brushing_sessions`
- **O que faz:** Ao marcar uma sessão como `is_completed = TRUE`, recalcula e atualiza automaticamente em `user_stats`:
  - `total_brushings` (+1)
  - `total_points` (+5)
  - `current_streak_days` (incrementa ou reseta)
  - `longest_streak_days` (atualiza se novo recorde)
  - `last_brushing_date`
  - `level` e `level_name`

---

## 6. Segurança — Row Level Security (RLS)

Todas as tabelas possuem **RLS habilitado** no Supabase. Isso garante que cada usuário acessa **apenas seus próprios dados**, diretamente no nível do banco de dados.

| Tabela | Acesso do Próprio Usuário | Acesso do Cuidador |
|---|---|---|
| `users` | SELECT, UPDATE | SELECT (se vínculo ativo, qualquer permissão) |
| `health_profiles` | ALL (SELECT, INSERT, UPDATE, DELETE) | ❌ |
| `brushing_sessions` | ALL | SELECT (se `can_view_reports`) |
| `flossing_logs` | ALL | SELECT (se `can_view_reports`) |
| `appointments` | ALL | SELECT (se `can_view_appointments`) |
| `user_stats` | SELECT | SELECT (se `can_view_reports`) |
| `user_module_progress` | ALL | ❌ |
| `user_achievements` | SELECT | ❌ |
| `caregivers` | ALL (como `patient_id`) | SELECT (como `caregiver_user_id`) |
| `education_modules` | SELECT (público autenticado) | SELECT |
| `achievements` | SELECT (público autenticado) | SELECT |

> **Nota (v2):** Diferente da v1 desta documentação, o acesso do cuidador aos
> dados do paciente é garantido por **políticas de RLS** (função
> `is_active_caregiver()`, ver `database/007_caregiver_access.sql`), e não
> mediado pela `service_role` no FastAPI. O banco continua sendo a
> autoridade final de autorização: um bug de validação no backend não expõe
> prontuário de paciente nenhum, e revogar um cuidador corta o acesso
> instantaneamente, no próximo `SELECT`. O FastAPI nunca usa a `service_role`
> para leitura de dados de paciente — sempre opera com o JWT de quem está
> autenticado (paciente ou cuidador), deixando o RLS decidir o que é visível.
>
> O fluxo de convite (paciente convida por e-mail → cuidador aceita) também é
> resolvido no banco, por duas funções `SECURITY DEFINER`
> (`list_pending_caregiver_invitations()` e `accept_caregiver_invitation()`)
> que exigem e-mail confirmado no Supabase Auth como prova de identidade.

---

## 7. Diagrama de Relacionamento (Simplificado)

```
auth.users (Supabase)
    │ (1:1)
    ▼
users ─────────────────────────────────────────────────────────────┐
  │ (1:1)                                                           │ (como cuidador)
  ├──► health_profiles                                              │
  │                                                                 │
  │ (1:N)                                              caregivers ◄─┘
  ├──► brushing_sessions          patient_id ──────────► (N cuidadores por paciente)
  │                                                   caregiver_user_id ─────► users
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
- [x] **Fase 2 — Back-end (FastAPI)**: Criar as rotas de API (autenticação, usuários, escovação, consultas, cuidadores)
- [ ] **Fase 3 — Front-end (React + Vite)**: Criar estrutura PWA mobile-first, telas e componentes
- [ ] **Fase 4 — Integrações**: Notificações push (para lembretes e alertas de cuidadores); envio real de e-mail de convite de cuidador (hoje `LoggingEmailSender` apenas registra em log)
- [ ] **Fase 5 — Testes e Deploy**: Testes de integração e publicação
