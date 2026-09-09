# Graph Report - cardio-care  (2026-09-09)

## Published provenance
- Source fingerprint: `56f1b3a59446d42aad7de2378f92b14780de0ccde42947932a2a39d00a8a77a2`
- Generated from Git commit: `7367c43af5f80984384950fa63a56c73605d816d`

## Corpus Check
- 389 files · ~100,220 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2326 nodes · 5515 edges · 206 communities (116 shown, 48 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 457 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8c812ca4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_request_limits.py
- education/types.ts
- NotificationService
- test_dashboard_service.py
- GamificationService
- BrushingTipsModal.tsx
- FakeAppointmentRepository
- AuthProvider.tsx
- pushSubscriptionManager.ts
- OralCardio Web Push Guide
- NotificationSubscriptionProvider.tsx
- endpoints/health.py
- HealthQuestionnairePage.tsx
- cn
- test_notification_service.py
- appointment_service.py
- EducationModuleRecord
- DashboardPage.test.tsx
- Database Backend Integrity
- records.py
- notification_service.py
- UUID
- queryKeys.ts
- authValidation.ts
- EntityNotFoundError
- deps.py
- AchievementEvaluationDispatchService
- AppointmentCard.tsx
- achievements.py
- Appointment
- httpClient.ts
- Frontend Dom
- devDependencies
- env.ts
- dateTimeLocal.ts
- ModuleCompletionCard.tsx
- Backend Production
- domain/test_notifications.py
- Database Notification Outbox
- httpClient
- UserRecord
- Incremental architecture graph update
- AchievementUnlockProvider.tsx
- NewAppointmentPage.tsx
- main.py
- Database Backend Hardening
- SignUpPage.tsx
- BrushingSessionRecord
- schemas/gamification.py
- AppointmentService
- AuthenticationError
- NotificationRepository
- Database Notifications Core
- dependencies
- get_background_job_dispatch_service
- .__call__
- AppointmentCursor
- AppointmentDetailPage.tsx
- useAuth
- appointment.py
- _RecordingQuery
- AppointmentStatus
- App.tsx
- BrushingTimerPage.test.tsx
- FlossingLogRecord
- repositories/gamification_repository.py
- SidebarNav.tsx
- AchievementRecord
- Database quality test job
- MouthQuadrantMap.tsx
- validate_vapid_configuration
- AppointmentRecord
- Frontend Build
- Frontend Frontend
- Ordered SQL migrations 001 through 029
- test_flossing_service.py
- UserStatsRecord
- Database Triggers
- Database Gamification Rpc
- Database Habit Scoring
- dependencies
- Frontend And
- Frontend Parseurl
- Database Schema
- Database Caregiver Access
- Projeto Fix Notification Job
- .update_appointment
- Backend Authentication
- Backend Health
- Database Delayed Achievement Reveals
- Projeto Fix Notification Delivery
- Frontend Check
- build_integrity
- Backend Achievement
- Database Notification Cron
- Database Push Revocation Tokens
- Frontend Mock
- Frontend Mock
- Frontend Mock
- Frontend Vercel
- list_appointments
- Backend Protected
- Frontend Education
- Frontend Notificationpushpayload
- Frontend Importmeta
- useBrushingSessionController.ts
- Backend Internal
- Backend Application
- Database Notifications
- 003_backend_hardening.sql
- Documentação Password
- dashboardApi.ts
- OralCardio monorepo architecture
- Frontend Testing
- AchievementConditionType
- Frontend Vite
- AppointmentForm.tsx
- Frontend Vitejs
- Frontend Workbox
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Projeto Public
- Backend Cardio
- Projeto Public
- Projeto Public
- Projeto Public
- Entrega Backend
- main.tsx
- HealthCheckPage.tsx
- NotificationSubscriptionProvider
- logging.py
- OralCardio
- Documentação Production
- buildAppointmentPayload.ts
- notificationApi.ts
- services/conftest.py
- DashboardQuickLinks.tsx
- ModuleCompletionToast.tsx
- Q: vou ir descansar agora, mas analisando como um desenvolvedor senior e analisando o output completo do graphify do projeto, oq vc percebe que o nosso projeto necessita de pontos de melhoria, seja de otimização, melhoria de codigo, limpeza, etc... solid... analise primeiro backend depois front depois o banco
- database-quality-workflow.test.mjs
- eslint-plugin-react-hooks
- typescript-eslint
- httpClient.test.ts
- vitest
- workbox-core
- Local database test execution
- ResetPasswordPage.test.tsx
- @testing-library/react
- vite-plugin-pwa

## God Nodes (most connected - your core abstractions)
1. `EntityNotFoundError` - 48 edges
2. `CurrentUser` - 47 edges
3. `BusinessRuleViolationError` - 45 edges
4. `cn()` - 41 edges
5. `UserStatsRecord` - 39 edges
6. `AppointmentService` - 39 edges
7. `GamificationService` - 37 edges
8. `SupabaseRepository` - 36 edges
9. `AppointmentRecord` - 35 edges
10. `BrushingSessionRecord` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Python Quality Gates` --semantically_similar_to--> `OralCardio Deployment Runbook`  [INFERRED] [semantically similar]
  .github/workflows/backend-quality.yml → docs/deployment.md
- `Ordered SQL migrations 001 through 029` --semantically_similar_to--> `Ordered database migration application`  [INFERRED] [semantically similar]
  database/README.md → .github/workflows/database-quality.yml
- `Frontend Production and Browser Checks` --semantically_similar_to--> `OralCardio Deployment Runbook`  [INFERRED] [semantically similar]
  .github/workflows/frontend-quality.yml → docs/deployment.md
- `Database Row Level Security` --semantically_similar_to--> `Patient Row Level Security policies`  [INFERRED] [semantically similar]
  README.md → database/README.md
- `Transactional Notification Architecture` --semantically_similar_to--> `Leased Web Push Delivery Pipeline`  [INFERRED] [semantically similar]
  documentacao_tecnica.md → docs/notificacoes-push.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Database production hardening sequence** — database_readme_backend_hardening, database_readme_backend_integrity, database_readme_direct_mutation_restriction, database_readme_function_execute_hardening [EXTRACTED 1.00]
- **Database quality execution pipeline** — github_workflows_database_quality_clean_supabase_database, github_workflows_database_quality_ordered_migration_application, github_workflows_database_quality_transactional_database_tests [EXTRACTED 1.00]
- **OralCardio monorepo layers** — readme_backend_layered_architecture, readme_frontend_feature_based_architecture, readme_database_row_level_security [EXTRACTED 1.00]
- **Published architecture artifacts** — docs_architecture_readme_canonical_architecture_graph, docs_architecture_readme_graph_overview, docs_architecture_readme_graph_report, docs_architecture_readme_architecture_overview_renderer [EXTRACTED 1.00]
- **Password Recovery Delivery** — docs_superpowers_specs_2026_09_01_password_recovery_design_password_recovery_design, docs_superpowers_plans_2026_09_01_password_recovery_password_recovery_implementation_plan, docs_deployment_password_recovery_operations [INFERRED 0.95]
- **Production Delivery and Operations** — docs_deployment_deployment_runbook, docs_deployment_vercel_render_supabase_topology, render_oralcardio_api_service, _github_workflows_frontend_quality_frontend_production_checks, _github_workflows_backend_quality_python_quality_gates [INFERRED 0.95]
- **Reliable and Private Push Pipeline** — docs_notificacoes_push_web_push_guide, docs_notificacoes_push_generic_payload_privacy, docs_notificacoes_push_offline_revocation_capability, docs_notificacoes_push_leased_delivery_pipeline, documentacao_tecnica_notification_architecture [INFERRED 0.95]

## Communities (206 total, 48 thin omitted)

### Community 0 - "test_request_limits.py"
Cohesion: 0.13
Nodes (9): client(), FakeHealthyRepository, fixture, TestClient, _HealthyRepository, _RevocationRepository, test_chunked_oversized_body_is_rejected_before_revocation_repository(), test_oversized_body_is_rejected_before_revocation_repository() (+1 more)

### Community 1 - "education/types.ts"
Cohesion: 0.06
Nodes (35): completeModule(), fetchModuleBySlug(), fetchModules(), startModule(), EDUCATION_CATEGORY_LABELS, ModuleCard(), ModuleCardProps, mockModule (+27 more)

### Community 2 - "NotificationService"
Cohesion: 0.10
Nodes (17): post, subscribe(), HabitNotificationType, _parse_time(), datetime, time, UUID, SupabaseNotificationRepository (+9 more)

### Community 3 - "test_dashboard_service.py"
Cohesion: 0.12
Nodes (27): _build_service(), date, datetime, parametrize, UUID, _StubAppointment, _StubAppointmentService, _StubEducationService (+19 more)

### Community 4 - "GamificationService"
Cohesion: 0.12
Nodes (19): get_dashboard_service(), BusinessClock, calculate_level(), Level, Retorna o nível correspondente ao total de pontos. Espelha a função…, DashboardService, DashboardSummary, UUID (+11 more)

### Community 5 - "BrushingTipsModal.tsx"
Cohesion: 0.33
Nodes (3): BrushingTipsModal(), BrushingTipsModalProps, TIPS

### Community 6 - "FakeAppointmentRepository"
Cohesion: 0.25
Nodes (5): FakeAppointmentRepository, AppointmentStatus, AppointmentType, datetime, UUID

### Community 7 - "AuthProvider.tsx"
Cohesion: 0.11
Nodes (15): setCurrentAccessToken(), AuthContext, AuthContextValue, SignUpParams, SignUpResult, AuthProvider(), bootstrapSession(), signOut() (+7 more)

### Community 8 - "pushSubscriptionManager.ts"
Cohesion: 0.25
Nodes (15): fetchVapidPublicKey(), registerPushSubscription(), decodeBase64Url(), enablePushSubscription(), encodeBase64Url(), getDeviceLabel(), getPushPermissionState(), isIosDevice() (+7 more)

### Community 9 - "OralCardio Web Push Guide"
Cohesion: 0.17
Nodes (13): Generic Notification Payload Privacy, Leased Web Push Delivery Pipeline, Official Web Push References, Offline Push Revocation Capability, Platform-Specific Push Consent, VAPID Configuration and Rotation, OralCardio Web Push Guide, Database as Authorization and Scoring Authority (+5 more)

### Community 10 - "NotificationSubscriptionProvider.tsx"
Cohesion: 0.29
Nodes (8): NotificationContext, NotificationContextValue, NotificationPreferences, PushPermissionState, isQuietTime(), VALID, toMinutes(), validateNotificationPreferences()

### Community 11 - "endpoints/health.py"
Cohesion: 0.15
Nodes (17): _check_health(), get_health(), get_health_repository(), get_liveness(), get_readiness(), get, Sonda de processo: não depende de rede, banco ou Supabase., Sonda de readiness: só fica saudável quando a dependência essencial responde. (+9 more)

### Community 12 - "HealthQuestionnairePage.tsx"
Cohesion: 0.15
Nodes (20): HealthQuestionnairePage, FIELD_CONTROL, FIELD_ERROR_MESSAGE, FIELD_HINT, FIELD_INPUT, FIELD_INPUT_ERROR, FIELD_INPUT_WITH_LEADING_ICON, FIELD_INPUT_WITH_TRAILING_ACTION (+12 more)

### Community 13 - "cn"
Cohesion: 0.11
Nodes (24): BrushingMetricsHeader(), BrushingMetricsHeaderProps, BrushingProgressCard(), BrushingProgressCardProps, BrushingZonePill(), BrushingZonePillProps, ZoneProgressIndicators(), EducationProgressSummary() (+16 more)

### Community 14 - "test_notification_service.py"
Cohesion: 0.15
Nodes (23): PushSendResult, NotificationType, PushDeliveryOutcome, StrEnum, SupabaseNotificationDispatchRepository, ClaimedNotificationDeliveryRecord, PushGateway, NotificationDispatchService (+15 more)

### Community 15 - "appointment_service.py"
Cohesion: 0.10
Nodes (17): get_business_clock(), InstantClock, date, datetime, Protocol, Relógio de negócio explícito para não depender do fuso do processo., sao_paulo_date(), SaoPauloBusinessClock (+9 more)

### Community 16 - "EducationModuleRecord"
Cohesion: 0.08
Nodes (32): complete_module(), get_module(), list_modules(), get, post, UUID, start_module(), ModuleWithProgress (+24 more)

### Community 17 - "DashboardPage.test.tsx"
Cohesion: 0.40
Nodes (3): SUMMARY_V2, useDashboardQuery, useNotifications

### Community 18 - "Database Backend Integrity"
Cohesion: 0.07
Nodes (17): notification_preferences_reconcile_deliveries, public.assert_idempotency_key(), public.cancel_ineligible_notification_deliveries(), public.complete_achievement_evaluation(), public.complete_notification_delivery(), public.create_appointment_v2(), public.skip_invalid_pending_notifications(), push_subscriptions_reconcile_deliveries (+9 more)

### Community 19 - "records.py"
Cohesion: 0.10
Nodes (26): get_health_profile(), get, put, submit_health_profile(), CardiacCondition, UUID, _to_record(), HealthProfileRecord (+18 more)

### Community 20 - "notification_service.py"
Cohesion: 0.10
Nodes (30): dispatch_notifications(), post, post, Endpoint sem JWT que aceita exclusivamente uma capability de revogação., revoke_with_device_token(), get_preferences(), get, put (+22 more)

### Community 21 - "UUID"
Cohesion: 0.12
Nodes (10): AppointmentRepository, BrushingRepository, HealthProfileRepository, AppointmentStatus, AppointmentType, BrushingZone, UUID, AchievementSnapshotBuilder (+2 more)

### Community 22 - "queryKeys.ts"
Cohesion: 0.17
Nodes (12): ProfilePage, fetchUserProfile(), updateUserProfile(), UserProfile, UserProfileUpdateInput, ProfileForm(), ProfilePage(), dashboardQueryKey (+4 more)

### Community 23 - "authValidation.ts"
Cohesion: 0.11
Nodes (22): checkPasswordRequirements(), COMMON_PASSWORDS, NewPasswordFieldErrors, NewPasswordFieldValues, PasswordRequirementsStatus, PasswordResetRequestFieldErrors, PasswordResetRequestFieldValues, SignInFieldErrors (+14 more)

### Community 24 - "EntityNotFoundError"
Cohesion: 0.11
Nodes (30): get_push_revocation_repository(), FastAPI, register_exception_handlers(), BusinessRuleViolationError, ConflictError, DomainError, EntityNotFoundError, PermissionDeniedError (+22 more)

### Community 25 - "deps.py"
Cohesion: 0.12
Nodes (29): get_appointment_service(), get_brushing_service(), get_education_service(), get_gamification_service(), get_health_profile_service(), get_notification_service(), Client, Ponto único de composição da injeção de dependências da API. Cada… (+21 more)

### Community 26 - "AchievementEvaluationDispatchService"
Cohesion: 0.23
Nodes (10): ClaimedAchievementEvaluationRecord, AchievementEvaluationDispatchService, evaluation(), FakeEvaluationRepository, FakeGamificationService, FixedClock, datetime, UUID (+2 more)

### Community 27 - "AppointmentCard.tsx"
Cohesion: 0.22
Nodes (12): APPOINTMENT_STATUS_LABELS, AppointmentCard(), notInformedOr(), MOCK_APPOINTMENT, BUSINESS_TIME_ZONE, calendarDayDelta(), dateLongFormatter, dateTimeLongFormatter (+4 more)

### Community 28 - "achievements.py"
Cohesion: 0.32
Nodes (12): Achievement, AchievementSnapshot, _check_all_modules_completed(), _check_appointment_scheduled(), _check_brushing_count(), _check_flossing_count(), _check_health_profile_completed(), _check_module_completed() (+4 more)

### Community 29 - "Appointment"
Cohesion: 0.09
Nodes (17): AppointmentCardProps, groupAppointments(), GroupedAppointments, NOW_MS, MOCK_APPOINTMENT, patchAppointment, useAppointmentQuery, AppointmentsListPage() (+9 more)

### Community 30 - "httpClient.ts"
Cohesion: 0.17
Nodes (13): env, getCurrentAccessToken(), supabaseClient, buildAuthHeader(), extractErrorMessage(), FastApiErrorBody, FastApiValidationErrorItem, HttpError (+5 more)

### Community 31 - "Frontend Dom"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+17 more)

### Community 32 - "devDependencies"
Cohesion: 0.09
Nodes (23): @axe-core/playwright, eslint, @eslint/js, eslint-plugin-react-refresh, devDependencies, @axe-core/playwright, eslint, @eslint/js (+15 more)

### Community 33 - "env.ts"
Cohesion: 0.38
Nodes (5): AppEnv, RawEnv, readRequiredEnvVar(), validProductionEnv, validateAppEnv()

### Community 34 - "dateTimeLocal.ts"
Cohesion: 0.23
Nodes (12): AppointmentForm(), asNumber(), asUtcMs(), businessCalendarDayDelta(), businessDateKey(), businessDateTimeLocalToIso(), businessDateTimeLocalValue(), businessDateTimeParts (+4 more)

### Community 36 - "Backend Production"
Cohesion: 0.12
Nodes (12): field_validator, model_validator, Única fonte de configuração da aplicação, lida de variáveis de ambiente., Mantém a documentação local e a fecha em produção por padrão., Settings, test_production_disables_api_docs(), test_production_rejects_incomplete_dispatcher_configuration(), test_production_rejects_lease_shorter_than_worst_case_batch() (+4 more)

### Community 37 - "domain/test_notifications.py"
Cohesion: 0.16
Nodes (21): _decode_base64url(), is_quiet_time(), time, Backoff exponencial com jitter determinístico e testável., retry_delay_seconds(), validate_notification_preferences(), validate_push_endpoint(), validate_push_subscription_keys() (+13 more)

### Community 38 - "Database Notification Outbox"
Cohesion: 0.13
Nodes (18): appointments_cancel_stale_notification_jobs, notification_deliveries_set_updated_at, notification_jobs_set_updated_at, public.cancel_stale_appointment_notification_jobs(), public.notification_appointment_delivery_time(), public.notification_deliveries, public.notification_jobs, public.request_test_notification() (+10 more)

### Community 39 - "httpClient"
Cohesion: 0.18
Nodes (13): submitHealthProfile(), buildHealthProfilePayload(), INITIAL_QUESTIONNAIRE_STATE, QuestionnaireFormState, splitCommaList(), toNullableString(), HealthQuestionnairePage(), handleSubmit() (+5 more)

### Community 40 - "UserRecord"
Cohesion: 0.13
Nodes (19): get_user_service(), get_my_profile(), get, patch, update_my_profile(), UserRepository, UserRecord, BaseModel (+11 more)

### Community 41 - "Incremental architecture graph update"
Cohesion: 0.22
Nodes (13): Dependency-free Python architecture overview renderer, Canonical local architecture graph, Known graph generation limitations, Architecture graph overview SVG, Full architecture graph report, Incremental architecture graph update, Semantic extraction for documentation and configuration, Architecture graph workflow (+5 more)

### Community 42 - "AchievementUnlockProvider.tsx"
Cohesion: 0.21
Nodes (15): AchievementToastStack(), AchievementToastStackProps, AchievementUnlockProvider(), SAO_PAULO_DATE_FORMATTER, saoPauloDateKey(), AchievementToast, FIRST, SECOND (+7 more)

### Community 43 - "NewAppointmentPage.tsx"
Cohesion: 0.13
Nodes (15): NewAppointmentPage, createAppointment(), NewAppointmentPage(), handleSubmit(), createAppointment, FlossingLog, logFlossing(), FlossingCard() (+7 more)

### Community 44 - "main.py"
Cohesion: 0.24
Nodes (7): FastAPI, Headers de segurança para as respostas da API. A CSP pertence ao host da PWA,…, register_http_security_headers(), lifespan(), FastAPI, Valida segredos operacionais antes de aceitar tráfego de produção., Exporta o contrato OpenAPI sem iniciar servidor ou tocar no Supabase.

### Community 45 - "Database Backend Hardening"
Cohesion: 0.11
Nodes (8): achievement_evaluation_requests_set_updated_at, public.achievement_evaluation_requests, public.decode_base64url_or_null(), public.enqueue_achievement_evaluation_from_change(), public, public.handle_updated_at, public.notification_jobs, public.users

### Community 46 - "SignUpPage.tsx"
Cohesion: 0.12
Nodes (25): translateAuthError(), EmailIcon(), EyeIcon(), EyeOffIcon(), IconProps, LockIcon(), OralCardioLogo(), UserIcon() (+17 more)

### Community 47 - "BrushingSessionRecord"
Cohesion: 0.05
Nodes (57): Any, list_brushing_sessions(), get, IdempotencyKey, patch, post, UUID, start_brushing_session() (+49 more)

### Community 48 - "schemas/gamification.py"
Cohesion: 0.16
Nodes (15): claim_achievement_reveals(), get_stats(), get, post, AchievementStatus, AchievementOutput, AchievementRevealAcknowledgeInput, AchievementRevealOutput (+7 more)

### Community 49 - "AppointmentService"
Cohesion: 0.28
Nodes (16): AppointmentType, AppointmentService, _create(), _FakeInstantClock, gamification_spy(), datetime, fixture, UUID (+8 more)

### Community 50 - "AuthenticationError"
Cohesion: 0.21
Nodes (12): AuthenticationError, Token ausente, inválido ou expirado., Client, Valida o token chamando o Supabase Auth (`auth.get_user`)., SupabaseTokenVerifier, _FakeAuth, Exception, test_auth_transport_failure_is_reported_as_service_unavailable() (+4 more)

### Community 51 - "NotificationRepository"
Cohesion: 0.14
Nodes (6): AchievementEvaluationDispatchRepository, NotificationDispatchRepository, NotificationRepository, NotificationRevocationRepository, datetime, Protocol

### Community 52 - "Database Notifications Core"
Cohesion: 0.13
Nodes (9): habit_notification_schedules_set_updated_at, on_user_notification_settings_created, public.habit_notification_schedules, public.notification_preferences, push_subscriptions_set_updated_at, public, public.handle_updated_at, public.users (+1 more)

### Community 53 - "dependencies"
Cohesion: 0.10
Nodes (21): @fontsource/eb-garamond, @fontsource-variable/inter, dependencies, @fontsource/eb-garamond, @fontsource-variable/inter, lucide-react, react, react-dom (+13 more)

### Community 54 - "get_background_job_dispatch_service"
Cohesion: 0.21
Nodes (14): get_background_job_dispatch_service(), require_notification_dispatch_token(), Environment, get_settings(), StrEnum, create_background_job_client(), create_user_scoped_client(), get_privileged_supabase_client() (+6 more)

### Community 55 - ".__call__"
Cohesion: 0.21
Nodes (9): ASGIApp, _build_error_response(), _BodyTooLarge, RequestLimitsMiddleware, HTTPException, JSONResponse, Receive, Scope (+1 more)

### Community 56 - "AppointmentCursor"
Cohesion: 0.47
Nodes (7): AppointmentCursor, decode_appointment_cursor(), encode_appointment_cursor(), Cursores opacos e validados para paginação ordenada por data e UUID., parametrize, test_appointment_cursor_rejects_invalid_values(), test_appointment_cursor_round_trip_preserves_ordering_fields()

### Community 57 - "AppointmentDetailPage.tsx"
Cohesion: 0.21
Nodes (18): AppointmentDetailPage, EditAppointmentPage, fetchAppointment(), listAppointments(), patchAppointment(), useAppointmentQuery(), useAppointmentsInfiniteQuery(), translateAppointmentError() (+10 more)

### Community 58 - "useAuth"
Cohesion: 0.09
Nodes (15): ForgotPasswordPage(), handleSubmit(), useAuthMock, SignInPage(), useAuthMock, SignUpPage(), useAuthMock, fetchHealthProfile() (+7 more)

### Community 59 - "appointment.py"
Cohesion: 0.23
Nodes (10): AppointmentInput, AppointmentPatchInput, BaseModel, datetime, field_validator, model_validator, test_appointment_normalizes_datetime_to_utc(), test_appointment_rejects_naive_datetime() (+2 more)

### Community 61 - "AppointmentStatus"
Cohesion: 0.38
Nodes (9): AppointmentStatus, Valida o ciclo de vida da consulta (seção 3.4 da documentação): scheduled ->…, validate_status_transition(), AppointmentStatus, AppointmentStatus, parametrize, test_invalid_transitions_raise(), test_repeating_current_status_is_idempotent() (+1 more)

### Community 62 - "App.tsx"
Cohesion: 0.07
Nodes (38): AchievementsPage, AppointmentsListPage, BrushingTimerPage, DashboardPage, EducationListPage, EducationModulePage, ForgotPasswordPage, NotificationSettingsPage (+30 more)

### Community 63 - "BrushingTimerPage.test.tsx"
Cohesion: 0.11
Nodes (13): BrushingTimerPage(), mockCompletedZones, mockFinish, mockPause, mockPersistZone, mockResumeFrom, mockResumeTimer, mockRetryFinish (+5 more)

### Community 64 - "FlossingLogRecord"
Cohesion: 0.14
Nodes (16): get_flossing_service(), create_flossing_log(), list_flossing_logs(), get, IdempotencyKey, post, UUID, SupabaseFlossingRepository (+8 more)

### Community 65 - "repositories/gamification_repository.py"
Cohesion: 0.12
Nodes (17): Client, datetime, UUID, SupabaseAchievementEvaluationDispatchRepository, SupabaseGamificationRepository, _to_stats_record(), parse_date(), parse_datetime() (+9 more)

### Community 66 - "SidebarNav.tsx"
Cohesion: 0.26
Nodes (6): ToothbrushIcon(), AppShell(), BottomNav(), NavDestination, NAVIGATION_DESTINATIONS, SidebarNav()

### Community 67 - "AchievementRecord"
Cohesion: 0.15
Nodes (7): _to_achievement_record(), GamificationRepository, AchievementRecord, UserAchievementRecord, FakeGamificationRepository, date, UUID

### Community 68 - "Database quality test job"
Cohesion: 0.24
Nodes (10): Database quality CI pipeline, Reviewed Supabase CLI version pinning, Clean Supabase database startup, Database quality change triggers, Database quality workflow, Ordered database migration application, Supabase CLI version pinning, Database quality test job (+2 more)

### Community 69 - "MouthQuadrantMap.tsx"
Cohesion: 0.15
Nodes (17): BRUSHING_ZONE_LABELS, BRUSHING_ZONE_ORDER, BRUSHING_ZONE_TIPS, SECONDS_PER_ZONE, TOTAL_BRUSHING_SECONDS, markerFor(), MouthQuadrantMap(), MouthQuadrantMapProps (+9 more)

### Community 70 - "validate_vapid_configuration"
Cohesion: 0.23
Nodes (13): _load_private_pem(), load_vapid_private_key(), Validação de par de chaves VAPID antes de iniciar o worker., Carrega uma chave privada VAPID P-256 de um PEM literal ou arquivo., Garante que a chave pública Web Push corresponde à chave privada PEM. Validar…, validate_vapid_configuration(), _key_pair(), test_invalid_private_key_does_not_leak_value_in_chained_error() (+5 more)

### Community 71 - "AppointmentRecord"
Cohesion: 0.29
Nodes (8): AppointmentStatus, AppointmentType, datetime, UUID, SupabaseAppointmentRepository, _to_record(), AppointmentRecord, test_next_scheduled_query_is_scoped_and_ordered()

### Community 72 - "Frontend Build"
Cohesion: 0.20
Nodes (10): scripts, build, build:production, check:production-env, dev, lint, preview, test (+2 more)

### Community 73 - "Frontend Frontend"
Cohesion: 0.22
Nodes (8): allowScripts, esbuild, engines, node, name, private, type, version

### Community 74 - "Ordered SQL migrations 001 through 029"
Cohesion: 0.15
Nodes (13): Backend mutation and delivery hardening, Atomic backend integrity RPCs, Appointment cursor pagination, Delayed achievement reveals, Authenticated direct mutation restriction, Database function EXECUTE privilege hardening, Habit scoring and gamification, Version 2.0.0 level thresholds (+5 more)

### Community 75 - "test_flossing_service.py"
Cohesion: 0.18
Nodes (12): FakeFlossingRepository, UUID, gamification_spy(), fixture, UUID, service(), _SpyGamificationService, test_every_flossing_log_triggers_achievement_evaluation() (+4 more)

### Community 76 - "UserStatsRecord"
Cohesion: 0.31
Nodes (15): UserStatsRecord, FakeBusinessClock, date, _brushing_achievement(), _build_service(), UUID, test_acknowledge_empty_reveal_list_is_idempotent(), test_claim_returns_all_due_achievements() (+7 more)

### Community 77 - "Database Triggers"
Cohesion: 0.25
Nodes (4): on_auth_user_created, set_updated_at, public.handle_updated_at, public.handle_new_user

### Community 78 - "Database Gamification Rpc"
Cohesion: 0.25
Nodes (4): on_flossing_log_created, public.unlock_achievement(), public.achievements, public.handle_new_flossing_log

### Community 79 - "Database Habit Scoring"
Cohesion: 0.25
Nodes (4): on_flossing_log_created, public.handle_new_brushing_session(), public.handle_new_flossing_log, public.user_stats

### Community 80 - "dependencies"
Cohesion: 0.33
Nodes (5): dependencies, tailwindcss, @tailwindcss/vite, tailwindcss, @tailwindcss/vite

### Community 81 - "Frontend And"
Cohesion: 0.29
Nodes (7): Claude Design Analysis, Cream Coral and Dark Surface Rhythm, Design Tokens and Component Variants, Responsive Layout and Touch System, Serif and Humanist Sans Typography Pairing, Warm Editorial Design System, OralCardio HTML App Shell

### Community 82 - "Frontend Parseurl"
Cohesion: 0.29
Nodes (5): apiUrl, forbiddenHosts, missing, requiredKeys, supabaseUrl

### Community 83 - "Database Schema"
Cohesion: 0.47
Nodes (5): public.brushing_sessions, public.health_profiles, public.users, auth.users, public

### Community 84 - "Database Caregiver Access"
Cohesion: 0.47
Nodes (5): public.accept_caregiver_invitation(), public.is_active_caregiver(), public.list_pending_caregiver_invitations(), auth.users, public.caregivers

### Community 85 - "Projeto Fix Notification Job"
Cohesion: 0.33
Nodes (5): public.enqueue_due_notification_jobs(), public.appointments, public.habit_notification_schedules, public.notification_preferences, public.user_stats

### Community 86 - ".update_appointment"
Cohesion: 0.27
Nodes (3): AppointmentStatus, AppointmentType, UUID

### Community 87 - "Backend Authentication"
Cohesion: 0.60
Nodes (4): TestClient, test_internal_dispatch_is_unavailable_without_configuration(), test_notification_preferences_require_authentication(), test_push_subscription_requires_authentication()

### Community 88 - "Backend Health"
Cohesion: 0.60
Nodes (4): TestClient, test_api_security_headers_are_present(), test_health_endpoint_returns_healthy_status(), test_liveness_does_not_depend_on_database()

### Community 90 - "Projeto Fix Notification Delivery"
Cohesion: 0.40
Nodes (4): public.cancel_ineligible_notification_deliveries(), public.notification_jobs, public.notification_preferences, public.push_subscriptions

### Community 91 - "Frontend Check"
Cohesion: 0.40
Nodes (4): document, [openApiPath], requiredOperations, schemaName

### Community 92 - "build_integrity"
Cohesion: 0.15
Nodes (15): build_integrity(), fingerprint_sources(), is_architecture_source(), tracked_sources(), category(), main(), render(), select_communities() (+7 more)

### Community 93 - "Backend Achievement"
Cohesion: 0.67
Nodes (3): TestClient, test_acknowledge_achievement_reveals_requires_authentication(), test_claim_achievement_reveals_requires_authentication()

### Community 96 - "Frontend Mock"
Cohesion: 0.50
Nodes (3): MOCK_BRUSHING_SESSION, MOCK_SESSION, MOCK_USER

### Community 97 - "Frontend Mock"
Cohesion: 0.50
Nodes (3): MOCK_DASHBOARD, MOCK_SESSION, MOCK_USER

### Community 98 - "Frontend Mock"
Cohesion: 0.50
Nodes (3): MOCK_MODULES, MOCK_SESSION, MOCK_USER

### Community 99 - "Frontend Vercel"
Cohesion: 0.50
Nodes (3): headers, rewrites, $schema

### Community 100 - "list_appointments"
Cohesion: 0.21
Nodes (13): AppointmentInput, create_appointment(), get_appointment(), list_appointments(), AppointmentStatus, get, IdempotencyKey, patch (+5 more)

### Community 105 - "useBrushingSessionController.ts"
Cohesion: 0.24
Nodes (11): completeBrushingSession(), markZoneCompleted(), startBrushingSession(), BrushingSession, patientMessage(), PersistenceTask, readRecovery(), shouldReconcileZones() (+3 more)

### Community 114 - "Documentação Password"
Cohesion: 0.17
Nodes (12): Password Recovery Production Operations, AuthProvider Password Recovery Extension, Password Recovery Implementation Plan, Password Recovery Routes, Test-Driven Password Recovery Task Sequence, AuthContext Authentication Facade, Enumeration-Resistant Recovery Response, Exact Recovery Redirect Allowlist (+4 more)

### Community 115 - "dashboardApi.ts"
Cohesion: 0.32
Nodes (10): DashboardSummary, fetchDashboard(), parseDashboardSummary(), requireFiniteNonNegativeNumber(), requireNonNegativeInteger(), requireNullableFiniteNonNegativeNumber(), requireNullableString(), requireString() (+2 more)

### Community 116 - "OralCardio monorepo architecture"
Cohesion: 0.40
Nodes (5): Patient Row Level Security policies, Backend layered architecture, Database Row Level Security, Frontend feature-based architecture, OralCardio monorepo architecture

### Community 118 - "AchievementConditionType"
Cohesion: 0.47
Nodes (12): AchievementEvaluator, Determina quais conquistas um usuário acabou de desbloquear. Cada tipo de…, AchievementConditionType, _achievement(), test_all_modules_completed_requires_every_active_module(), test_already_unlocked_achievements_are_never_returned_again(), test_appointment_scheduled_achievement(), test_brushing_count_achievement_unlocks_when_threshold_reached() (+4 more)

### Community 120 - "AppointmentForm.tsx"
Cohesion: 0.17
Nodes (15): AppointmentFormState, appointmentToFormState(), INITIAL_APPOINTMENT_FORM_STATE, APPOINTMENT_TYPE_LABELS, AppointmentAction, assertMaxLength(), buildAppointmentPatch(), optionalPatchValue() (+7 more)

### Community 182 - "Entrega Backend"
Cohesion: 0.20
Nodes (10): API Contract Pipeline, OpenAPI Contract Verification, Backend Quality Pipeline, Python Quality Gates, Backend Development Quality Dependencies, FastAPI and Supabase Runtime Stack, Backend Runtime Dependencies, Web Push and Cryptography Stack (+2 more)

### Community 183 - "main.tsx"
Cohesion: 0.20
Nodes (6): App(), queryClient, rootElement, AppErrorBoundary, AppErrorBoundaryProps, AppErrorBoundaryState

### Community 184 - "HealthCheckPage.tsx"
Cohesion: 0.43
Nodes (5): HealthCheckPage, fetchHealthStatus(), HealthStatus, HealthCheckPage(), LoadState

### Community 185 - "NotificationSubscriptionProvider"
Cohesion: 0.28
Nodes (13): revokePushSubscriptionWithDeviceToken(), errorMessage(), NotificationSubscriptionProvider(), reconcile(), createRevocationToken(), disablePushSubscription(), flushPendingPushRevocations(), forgetPendingPushRevocation() (+5 more)

### Community 186 - "logging.py"
Cohesion: 0.35
Nodes (9): configure_logging(), FastAPI, register_request_id_middleware(), _request_id_log_record_factory(), FastAPI, _test_app(), test_invalid_request_id_is_replaced(), test_request_id_is_propagated_to_response_and_logs() (+1 more)

### Community 187 - "OralCardio"
Cohesion: 0.22
Nodes (11): Backup before destructive migration 011, OralCardio Supabase database, Production database rollout order, Transactional final-state database test, Database behavioral invariants, Database integration tests, OralCardio architecture graph, Vercel, Render, and Supabase deployment topology (+3 more)

### Community 188 - "Documentação Production"
Cohesion: 0.25
Nodes (8): Frontend Production and Browser Checks, Frontend Quality Pipeline, Production Content Security Policy, OralCardio Deployment Runbook, Observability Backup and Rollback, Production Secret Isolation, Staging-First Release Policy, Vercel Render and Supabase Topology

### Community 189 - "buildAppointmentPayload.ts"
Cohesion: 0.33
Nodes (8): assertMaxLength(), buildAppointmentPayload(), futureLocalValue(), NOW_MS, validState(), toNullableString(), AppointmentInput, localDateTimeInputToIso()

### Community 190 - "notificationApi.ts"
Cohesion: 0.22
Nodes (9): requestTestNotification(), updateNotificationPreferences(), NotificationSettingsForm(), handleSubmit(), toggleLead(), update(), permissionDescription(), shortTime() (+1 more)

### Community 191 - "services/conftest.py"
Cohesion: 0.70
Nodes (4): empty_stats(), fixture, UUID, user_id()

### Community 192 - "DashboardQuickLinks.tsx"
Cohesion: 0.67
Nodes (3): DashboardQuickLinks(), DashboardQuickLinksProps, formatNextAppointment()

### Community 194 - "Q: vou ir descansar agora, mas analisando como um desenvolvedor senior e analisando o output completo do graphify do projeto, oq vc percebe que o nosso projeto necessita de pontos de melhoria, seja de otimização, melhoria de codigo, limpeza, etc... solid... analise primeiro backend depois front depois o banco"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: vou ir descansar agora, mas analisando como um desenvolvedor senior e analisando o output completo do graphify do projeto, oq vc percebe que o nosso projeto necessita de pontos de melhoria, seja de otimização, melhoria de codigo, limpeza, etc... solid... analise primeiro backend depois front depois o banco, Source Nodes

### Community 204 - "Local database test execution"
Cohesion: 0.50
Nodes (4): Administrative fixture setup, Authenticated RLS assertions, Local database test execution, Transactional test rollback

### Community 205 - "ResetPasswordPage.test.tsx"
Cohesion: 0.33
Nodes (3): ResetPasswordPage(), handleSubmit(), useAuthMock

## Knowledge Gaps
- **274 isolated node(s):** `MOCK_USER`, `MOCK_SESSION`, `MOCK_DASHBOARD`, `BrushingSummaryCardProps`, `EducationModuleMedia` (+269 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 668 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CurrentUser` connect `deps.py` to `FlossingLogRecord`, `NotificationService`, `list_appointments`, `UserRecord`, `BrushingSessionRecord`, `EducationModuleRecord`, `schemas/gamification.py`, `AuthenticationError`, `records.py`, `notification_service.py`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `SupabaseRepository` connect `EntityNotFoundError` to `FlossingLogRecord`, `repositories/gamification_repository.py`, `NotificationService`, `AppointmentRecord`, `test_notification_service.py`, `BrushingSessionRecord`, `EducationModuleRecord`, `records.py`, `deps.py`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `UserStatsRecord` connect `UserStatsRecord` to `repositories/gamification_repository.py`, `AchievementRecord`, `GamificationService`, `test_dashboard_service.py`, `schemas/gamification.py`, `records.py`, `UUID`, `services/conftest.py`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 15 inferred relationships involving `EntityNotFoundError` (e.g. with `SupabaseAppointmentRepository` and `SupabaseRepository`) actually correct?**
  _`EntityNotFoundError` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `CurrentUser` (e.g. with `require_completed_health_profile()` and `create_appointment()`) actually correct?**
  _`CurrentUser` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `BusinessRuleViolationError` (e.g. with `SupabaseRepository` and `AppointmentService`) actually correct?**
  _`BusinessRuleViolationError` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `UserStatsRecord` (e.g. with `SupabaseGamificationRepository` and `GamificationRepository`) actually correct?**
  _`UserStatsRecord` has 16 INFERRED edges - model-reasoned connections that need verification._
