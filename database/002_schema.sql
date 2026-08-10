-- =============================================================================
-- CardioCare Connect — 002: Schema (tabelas)
-- Depende de 001_extensions_and_enums.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- users: extensão pública de auth.users
-- -----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  phone text,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- health_profiles: 1:1 com users
-- -----------------------------------------------------------------------------
create table public.health_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  cardiac_condition cardiac_condition not null,
  cardiac_condition_detail text,
  has_pacemaker boolean not null default false,
  has_prosthetic_valve boolean not null default false,
  medications text[],
  allergies text[],
  last_dental_visit date,
  brushing_frequency_before smallint,
  dentist_name text,
  dentist_phone text,
  cardiologist_name text,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- brushing_sessions
-- -----------------------------------------------------------------------------
create table public.brushing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds smallint,
  target_duration smallint not null default 120,
  zones_completed text[] not null default '{}',
  is_completed boolean not null default false,
  technique_tip_shown text,
  notes text,
  created_at timestamptz not null default now(),
  constraint brushing_sessions_zones_valid check (
    zones_completed <@ array['upper_right', 'upper_left', 'lower_right', 'lower_left', 'tongue']::text[]
  )
);

create index brushing_sessions_user_id_idx on public.brushing_sessions (user_id);
create index brushing_sessions_started_at_idx on public.brushing_sessions (started_at desc);

-- -----------------------------------------------------------------------------
-- flossing_logs
-- -----------------------------------------------------------------------------
create table public.flossing_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  logged_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index flossing_logs_user_id_idx on public.flossing_logs (user_id);

-- -----------------------------------------------------------------------------
-- education_modules: catálogo administrativo, leitura pública autenticada
-- -----------------------------------------------------------------------------
create table public.education_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  content jsonb not null,
  category education_category not null,
  order_index smallint not null default 0,
  estimated_minutes smallint not null,
  thumbnail_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- user_module_progress: junção users <-> education_modules
-- -----------------------------------------------------------------------------
create table public.user_module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  module_id uuid not null references public.education_modules (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  is_completed boolean not null default false,
  read_time_seconds int,
  constraint user_module_progress_unique unique (user_id, module_id)
);

-- -----------------------------------------------------------------------------
-- appointments
-- -----------------------------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  scheduled_at timestamptz not null,
  appointment_type appointment_type not null,
  dentist_name text not null,
  clinic_name text,
  clinic_address text,
  clinic_phone text,
  notes text,
  status appointment_status not null default 'scheduled',
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointments_user_id_idx on public.appointments (user_id);
create index appointments_scheduled_at_idx on public.appointments (scheduled_at desc);
create index appointments_status_idx on public.appointments (status);

-- -----------------------------------------------------------------------------
-- caregivers: vínculo paciente <-> cuidador
-- -----------------------------------------------------------------------------
create table public.caregivers (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users (id) on delete cascade,
  caregiver_email text not null,
  caregiver_user_id uuid references public.users (id) on delete set null,
  status caregiver_status not null default 'pending',
  can_view_reports boolean not null default true,
  can_view_appointments boolean not null default true,
  receive_alerts boolean not null default true,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  constraint caregivers_unique_invite unique (patient_id, caregiver_email)
);

create index caregivers_patient_id_idx on public.caregivers (patient_id);
create index caregivers_caregiver_user_id_idx on public.caregivers (caregiver_user_id);

-- -----------------------------------------------------------------------------
-- achievements: catálogo administrativo
-- -----------------------------------------------------------------------------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  icon text not null,
  condition_type achievement_condition_type not null,
  condition_value int not null,
  points_reward smallint not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- user_achievements: junção users <-> achievements
-- -----------------------------------------------------------------------------
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  constraint user_achievements_unique unique (user_id, achievement_id)
);

-- -----------------------------------------------------------------------------
-- user_stats: agregação de gamificação, 1:1 com users
-- -----------------------------------------------------------------------------
create table public.user_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  total_points int not null default 0,
  level smallint not null default 1,
  level_name text not null default 'Semente',
  current_streak_days smallint not null default 0,
  longest_streak_days smallint not null default 0,
  total_brushings int not null default 0,
  total_flossings int not null default 0,
  last_brushing_date date,
  last_flossing_date date,
  updated_at timestamptz not null default now()
);