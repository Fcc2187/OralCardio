-- =============================================================================
-- CardioCare Connect — 001: Extensions & Enums
-- Aplicar no SQL Editor do Supabase, nesta ordem (001 -> 005).
-- =============================================================================

create extension if not exists "pgcrypto";

-- Condição cardíaca do paciente (health_profiles.cardiac_condition)
create type cardiac_condition as enum (
  'valve_disease',
  'congenital_heart',
  'heart_failure',
  'arrhythmia',
  'coronary_artery',
  'endocarditis_history',
  'other'
);

-- Tipo de consulta odontológica (appointments.appointment_type)
create type appointment_type as enum (
  'routine_checkup',
  'cleaning',
  'emergency',
  'follow_up',
  'procedure'
);

-- Status do ciclo de vida da consulta (appointments.status)
create type appointment_status as enum (
  'scheduled',
  'completed',
  'cancelled',
  'rescheduled'
);

-- Status do vínculo de cuidador (caregivers.status)
create type caregiver_status as enum (
  'pending',
  'active',
  'revoked'
);

-- Categoria de conteúdo educacional (education_modules.category)
create type education_category as enum (
  'mouth_heart_connection',
  'bacteremia',
  'endocarditis',
  'gingivitis',
  'oral_hygiene_techniques',
  'medication_interactions'
);

-- Tipo de condição para desbloquear uma conquista (achievements.condition_type)
create type achievement_condition_type as enum (
  'brushing_count',
  'streak_days',
  'module_completed',
  'all_modules_completed',
  'appointment_scheduled',
  'health_profile_completed',
  'flossing_count'
);