# Graph Report - cardio-care  (2026-09-09)

## Published provenance
- Source fingerprint: `a11dcce11815051d05bbfb0ab559763e9fb062afb7b17c118384db109bb3cdbe`
- Generated from Git commit: `0b2cd882ed9e576a41217aab6e36cd883bb1dffc`

## Corpus Check
- 388 files · ~100,064 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2324 nodes · 5511 edges · 197 communities (110 shown, 45 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 457 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- test_request_limits.py
- EducationModulePage.tsx
- NotificationService
- AchievementRecord
- deps.py
- ResetPasswordPage.tsx
- FakeAppointmentRepository
- endpoints/health_profile.py
- pushSubscriptionManager.ts
- OralCardio Web Push Guide
- repositories/interfaces.py
- endpoints/health.py
- HealthQuestionnairePage.tsx
- cn
- test_notification_service.py
- sao_paulo_date
- EducationModuleRecord
- DashboardPage.tsx
- Database Backend Integrity
- records.py
- notification.py
- UserStatsRecord
- NotificationSettingsPage.tsx
- authValidation.ts
- EntityNotFoundError
- test_dashboard_service.py
- UUID
- AppointmentDetailPage.tsx
- notificationApi.ts
- appointments/types.ts
- httpClient.ts
- Frontend Dom
- devDependencies
- GamificationRepository
- NewAppointmentPage.tsx
- dashboardApi.ts
- Backend Production
- domain/test_notifications.py
- Database Notification Outbox
- httpClient
- UserRecord
- Incremental architecture graph update
- AchievementUnlockProvider.tsx
- FlossingCard.tsx
- logging.py
- Database Backend Hardening
- SignUpPage.tsx
- enums.py
- schemas/gamification.py
- test_appointment_service.py
- internal/notifications.py
- notification_service.py
- Database Notifications Core
- dependencies
- get_settings
- .__call__
- endpoints/appointments.py
- EditAppointmentPage.tsx
- UUID
- appointment.py
- _RecordingQuery
- AppointmentStatus
- App.tsx
- BrushingTimerPage.test.tsx
- CurrentUser
- appointmentStatusActions.ts
- SidebarNav.tsx
- AchievementConditionType
- Database quality test job
- MouthQuadrantMap.tsx
- validate_vapid_configuration
- AppointmentRecord
- Frontend Build
- Frontend Frontend
- Ordered SQL migrations 001 through 029
- services/conftest.py
- Database Triggers
- Database Gamification Rpc
- Database Habit Scoring
- dependencies
- Frontend And
- Frontend Parseurl
- Database Schema
- Database Caregiver Access
- Projeto Fix Notification Job
- AppointmentService
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
- buildAppointmentPatch.ts
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
- OralCardio monorepo architecture
- Frontend Testing
- Frontend Vite
- repositories/user_repository.py
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
- main.py
- HealthCheckPage.tsx
- businessClock.ts
- OralCardio
- Documentação Production
- Q: vou ir descansar agora, mas analisando como um desenvolvedor senior e analisando o output completo do graphify do projeto, oq vc percebe que o nosso projeto necessita de pontos de melhoria, seja de otimização, melhoria de codigo, limpeza, etc... solid... analise primeiro backend depois front depois o banco
- database-quality-workflow.test.mjs
- eslint-plugin-react-hooks
- typescript-eslint
- calculate_level
- vitest
- workbox-core
- BrushingTipsModal.tsx
- Local database test execution
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

## Communities (197 total, 45 thin omitted)

### Community 0 - "test_request_limits.py"
Cohesion: 0.13
Nodes (9): client(), FakeHealthyRepository, fixture, TestClient, _HealthyRepository, _RevocationRepository, test_chunked_oversized_body_is_rejected_before_revocation_repository(), test_oversized_body_is_rejected_before_revocation_repository() (+1 more)

### Community 1 - "EducationModulePage.tsx"
Cohesion: 0.05
Nodes (49): EducationListPage, completeModule(), fetchModuleBySlug(), fetchModules(), startModule(), EDUCATION_CATEGORY_LABELS, EducationProgressSummary(), EducationProgressSummaryProps (+41 more)

### Community 2 - "NotificationService"
Cohesion: 0.09
Nodes (19): post, subscribe(), HabitNotificationType, NotificationRepository, _parse_time(), datetime, time, UUID (+11 more)

### Community 3 - "AchievementRecord"
Cohesion: 0.13
Nodes (14): Client, datetime, UUID, SupabaseAchievementEvaluationDispatchRepository, SupabaseGamificationRepository, _to_achievement_record(), _to_stats_record(), parse_date() (+6 more)

### Community 4 - "deps.py"
Cohesion: 0.15
Nodes (26): get_background_job_dispatch_service(), get_brushing_service(), get_business_clock(), get_dashboard_service(), get_education_service(), get_flossing_service(), get_gamification_service(), get_health_profile_service() (+18 more)

### Community 5 - "ResetPasswordPage.tsx"
Cohesion: 0.16
Nodes (13): ResetPasswordPage(), handleSubmit(), useAuthMock, Button, ButtonProps, buildButtonClasses(), BuildButtonClassesOptions, ButtonVariant (+5 more)

### Community 6 - "FakeAppointmentRepository"
Cohesion: 0.25
Nodes (5): FakeAppointmentRepository, AppointmentStatus, AppointmentType, datetime, UUID

### Community 7 - "endpoints/health_profile.py"
Cohesion: 0.23
Nodes (10): get_health_profile(), get, put, submit_health_profile(), HealthProfileInput, HealthProfileOutput, BaseModel, field_validator (+2 more)

### Community 8 - "pushSubscriptionManager.ts"
Cohesion: 0.11
Nodes (38): fetchVapidPublicKey(), registerPushSubscription(), revokePushSubscriptionWithDeviceToken(), NotificationContext, NotificationContextValue, errorMessage(), NotificationSubscriptionProvider(), reconcile() (+30 more)

### Community 9 - "OralCardio Web Push Guide"
Cohesion: 0.17
Nodes (13): Generic Notification Payload Privacy, Leased Web Push Delivery Pipeline, Official Web Push References, Offline Push Revocation Capability, Platform-Specific Push Consent, VAPID Configuration and Rotation, OralCardio Web Push Guide, Database as Authorization and Scoring Authority (+5 more)

### Community 10 - "repositories/interfaces.py"
Cohesion: 0.10
Nodes (21): UUID, SupabaseFlossingRepository, _to_record(), FlossingRepository, NotificationRevocationRepository, Protocol, FlossingLogRecord, FlossingService (+13 more)

### Community 11 - "endpoints/health.py"
Cohesion: 0.15
Nodes (17): _check_health(), get_health(), get_health_repository(), get_liveness(), get_readiness(), get, Sonda de processo: não depende de rede, banco ou Supabase., Sonda de readiness: só fica saudável quando a dependência essencial responde. (+9 more)

### Community 12 - "HealthQuestionnairePage.tsx"
Cohesion: 0.14
Nodes (22): HealthQuestionnairePage, Checkbox(), CheckboxProps, FIELD_CONTROL, FIELD_ERROR_MESSAGE, FIELD_HINT, FIELD_INPUT, FIELD_INPUT_ERROR (+14 more)

### Community 13 - "cn"
Cohesion: 0.14
Nodes (20): AchievementsPage, BrushingMetricsHeader(), BrushingMetricsHeaderProps, BrushingProgressCard(), BrushingProgressCardProps, BrushingZonePill(), BrushingZonePillProps, ZoneProgressIndicators() (+12 more)

### Community 14 - "test_notification_service.py"
Cohesion: 0.15
Nodes (23): PushSendResult, NotificationType, PushDeliveryOutcome, StrEnum, NotificationDispatchRepository, SupabaseNotificationDispatchRepository, ClaimedNotificationDeliveryRecord, NotificationDispatchService (+15 more)

### Community 15 - "sao_paulo_date"
Cohesion: 0.39
Nodes (5): date, sao_paulo_date(), test_business_date_rejects_naive_datetime(), test_utc_time_at_sao_paulo_midnight_belongs_to_new_day(), test_utc_time_before_sao_paulo_midnight_belongs_to_previous_day()

### Community 16 - "EducationModuleRecord"
Cohesion: 0.08
Nodes (32): complete_module(), get_module(), list_modules(), get, post, UUID, start_module(), ModuleWithProgress (+24 more)

### Community 17 - "DashboardPage.tsx"
Cohesion: 0.13
Nodes (14): DashboardPage, BrushingSummaryCard(), BrushingSummaryCardProps, DashboardQuickLinks(), DashboardQuickLinksProps, formatNextAppointment(), LEVEL_IMAGE_BY_NAME, LevelProgressCard() (+6 more)

### Community 18 - "Database Backend Integrity"
Cohesion: 0.07
Nodes (17): notification_preferences_reconcile_deliveries, public.assert_idempotency_key(), public.cancel_ineligible_notification_deliveries(), public.complete_achievement_evaluation(), public.complete_notification_delivery(), public.create_appointment_v2(), public.skip_invalid_pending_notifications(), push_subscriptions_reconcile_deliveries (+9 more)

### Community 19 - "records.py"
Cohesion: 0.14
Nodes (16): CardiacCondition, UUID, _to_record(), HealthProfileRecord, Representações internas das linhas do banco, desacopladas dos DTOs da API.…, UUID, FakeHealthProfileRepository, UUID (+8 more)

### Community 20 - "notification.py"
Cohesion: 0.13
Nodes (25): post, Endpoint sem JWT que aceita exclusivamente uma capability de revogação., revoke_with_device_token(), get_preferences(), get_vapid_public_key(), delete, get, put (+17 more)

### Community 21 - "UserStatsRecord"
Cohesion: 0.25
Nodes (16): UserStatsRecord, FakeBusinessClock, date, _StubGamificationService, _brushing_achievement(), _build_service(), UUID, test_acknowledge_empty_reveal_list_is_idempotent() (+8 more)

### Community 22 - "NotificationSettingsPage.tsx"
Cohesion: 0.10
Nodes (22): NotificationSettingsPage, ProfilePage, fetchNotificationPreferences(), APPOINTMENT_LEADS, NotificationSettingsPage(), fetchUserProfile(), updateUserProfile(), UserProfile (+14 more)

### Community 23 - "authValidation.ts"
Cohesion: 0.10
Nodes (23): checkPasswordRequirements(), COMMON_PASSWORDS, NewPasswordFieldErrors, NewPasswordFieldValues, PasswordRequirementsStatus, PasswordResetRequestFieldValues, SignInFieldErrors, SignInFieldValues (+15 more)

### Community 24 - "EntityNotFoundError"
Cohesion: 0.11
Nodes (30): get_push_revocation_repository(), FastAPI, register_exception_handlers(), BusinessRuleViolationError, ConflictError, DomainError, EntityNotFoundError, PermissionDeniedError (+22 more)

### Community 25 - "test_dashboard_service.py"
Cohesion: 0.14
Nodes (26): _build_service(), date, datetime, parametrize, UUID, _StubAppointment, _StubAppointmentService, _StubEducationService (+18 more)

### Community 26 - "UUID"
Cohesion: 0.12
Nodes (7): AppointmentRepository, BrushingRepository, AppointmentStatus, AppointmentType, BrushingZone, datetime, UUID

### Community 27 - "AppointmentDetailPage.tsx"
Cohesion: 0.21
Nodes (13): APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS, AppointmentCard(), notInformedOr(), MOCK_APPOINTMENT, VISIBLE_ACTION_TARGETS, calendarDayDelta(), dateLongFormatter (+5 more)

### Community 28 - "notificationApi.ts"
Cohesion: 0.24
Nodes (8): requestTestNotification(), updateNotificationPreferences(), NotificationSettingsForm(), handleSubmit(), toggleLead(), update(), permissionDescription(), shortTime()

### Community 29 - "appointments/types.ts"
Cohesion: 0.09
Nodes (21): AppointmentsListPage, AppointmentCardProps, groupAppointments(), GroupedAppointments, NOW_MS, MOCK_APPOINTMENT, patchAppointment, useAppointmentQuery (+13 more)

### Community 30 - "httpClient.ts"
Cohesion: 0.16
Nodes (12): getCurrentAccessToken(), buildAuthHeader(), extractErrorMessage(), FastApiErrorBody, FastApiValidationErrorItem, HttpError, HttpTimeoutError, isFastApiErrorBody() (+4 more)

### Community 31 - "Frontend Dom"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+17 more)

### Community 32 - "devDependencies"
Cohesion: 0.09
Nodes (23): @axe-core/playwright, eslint, @eslint/js, eslint-plugin-react-refresh, devDependencies, @axe-core/playwright, eslint, @eslint/js (+15 more)

### Community 33 - "GamificationRepository"
Cohesion: 0.18
Nodes (5): GamificationRepository, UserAchievementRecord, FakeGamificationRepository, date, UUID

### Community 34 - "NewAppointmentPage.tsx"
Cohesion: 0.14
Nodes (21): NewAppointmentPage, createAppointment(), AppointmentFormState, INITIAL_APPOINTMENT_FORM_STATE, assertMaxLength(), buildAppointmentPayload(), futureLocalValue(), NOW_MS (+13 more)

### Community 35 - "dashboardApi.ts"
Cohesion: 0.28
Nodes (11): DashboardSummary, fetchDashboard(), parseDashboardSummary(), requireFiniteNonNegativeNumber(), requireNonNegativeInteger(), requireNullableFiniteNonNegativeNumber(), requireNullableString(), requireString() (+3 more)

### Community 36 - "Backend Production"
Cohesion: 0.12
Nodes (12): field_validator, model_validator, Única fonte de configuração da aplicação, lida de variáveis de ambiente., Mantém a documentação local e a fecha em produção por padrão., Settings, test_production_disables_api_docs(), test_production_rejects_incomplete_dispatcher_configuration(), test_production_rejects_lease_shorter_than_worst_case_batch() (+4 more)

### Community 37 - "domain/test_notifications.py"
Cohesion: 0.15
Nodes (22): _decode_base64url(), is_quiet_time(), NotificationPreferencesUpdate, time, Backoff exponencial com jitter determinístico e testável., retry_delay_seconds(), validate_notification_preferences(), validate_push_endpoint() (+14 more)

### Community 38 - "Database Notification Outbox"
Cohesion: 0.13
Nodes (18): appointments_cancel_stale_notification_jobs, notification_deliveries_set_updated_at, notification_jobs_set_updated_at, public.cancel_stale_appointment_notification_jobs(), public.notification_appointment_delivery_time(), public.notification_deliveries, public.notification_jobs, public.request_test_notification() (+10 more)

### Community 39 - "httpClient"
Cohesion: 0.19
Nodes (13): submitHealthProfile(), buildHealthProfilePayload(), INITIAL_QUESTIONNAIRE_STATE, QuestionnaireFormState, splitCommaList(), toNullableString(), HealthQuestionnairePage(), handleSubmit() (+5 more)

### Community 40 - "UserRecord"
Cohesion: 0.13
Nodes (19): get_user_service(), get_my_profile(), get, patch, update_my_profile(), UserRepository, UserRecord, BaseModel (+11 more)

### Community 41 - "Incremental architecture graph update"
Cohesion: 0.22
Nodes (13): Dependency-free Python architecture overview renderer, Canonical local architecture graph, Known graph generation limitations, Architecture graph overview SVG, Full architecture graph report, Incremental architecture graph update, Semantic extraction for documentation and configuration, Architecture graph workflow (+5 more)

### Community 42 - "AchievementUnlockProvider.tsx"
Cohesion: 0.05
Nodes (43): App(), AppEnv, env, RawEnv, readRequiredEnvVar(), validProductionEnv, validateAppEnv(), setCurrentAccessToken() (+35 more)

### Community 43 - "FlossingCard.tsx"
Cohesion: 0.23
Nodes (9): FlossingLog, logFlossing(), FlossingCard(), FlossingCardProps, safeDailyCount(), logFlossing, createIdempotencyKey(), HttpRequestOptions (+1 more)

### Community 44 - "logging.py"
Cohesion: 0.35
Nodes (9): configure_logging(), FastAPI, register_request_id_middleware(), _request_id_log_record_factory(), FastAPI, _test_app(), test_invalid_request_id_is_replaced(), test_request_id_is_propagated_to_response_and_logs() (+1 more)

### Community 45 - "Database Backend Hardening"
Cohesion: 0.11
Nodes (8): achievement_evaluation_requests_set_updated_at, public.achievement_evaluation_requests, public.decode_base64url_or_null(), public.enqueue_achievement_evaluation_from_change(), public, public.handle_updated_at, public.notification_jobs, public.users

### Community 46 - "SignUpPage.tsx"
Cohesion: 0.09
Nodes (24): ForgotPasswordPage, translateAuthError(), PasswordResetRequestFieldErrors, EmailIcon(), EyeIcon(), EyeOffIcon(), IconProps, LockIcon() (+16 more)

### Community 47 - "enums.py"
Cohesion: 0.05
Nodes (57): Any, list_brushing_sessions(), get, IdempotencyKey, patch, post, UUID, start_brushing_session() (+49 more)

### Community 48 - "schemas/gamification.py"
Cohesion: 0.16
Nodes (16): claim_achievement_reveals(), get_stats(), list_achievements(), get, post, AchievementStatus, AchievementOutput, AchievementRevealAcknowledgeInput (+8 more)

### Community 49 - "test_appointment_service.py"
Cohesion: 0.26
Nodes (15): AppointmentType, _create(), _FakeInstantClock, gamification_spy(), datetime, fixture, UUID, service() (+7 more)

### Community 50 - "internal/notifications.py"
Cohesion: 0.18
Nodes (13): require_notification_dispatch_token(), AuthenticationError, Token ausente, inválido ou expirado., Client, Valida o token chamando o Supabase Auth (`auth.get_user`)., SupabaseTokenVerifier, _FakeAuth, Exception (+5 more)

### Community 51 - "notification_service.py"
Cohesion: 0.14
Nodes (13): dispatch_notifications(), post, AchievementEvaluationDispatchSummary, BackgroundDispatchSummary, DispatchSummary, BackgroundDispatchOutput, AchievementEvaluationService, PostMutationAchievementEvaluator (+5 more)

### Community 52 - "Database Notifications Core"
Cohesion: 0.13
Nodes (9): habit_notification_schedules_set_updated_at, on_user_notification_settings_created, public.habit_notification_schedules, public.notification_preferences, push_subscriptions_set_updated_at, public, public.handle_updated_at, public.users (+1 more)

### Community 53 - "dependencies"
Cohesion: 0.10
Nodes (21): @fontsource/eb-garamond, @fontsource-variable/inter, dependencies, @fontsource/eb-garamond, @fontsource-variable/inter, lucide-react, react, react-dom (+13 more)

### Community 54 - "get_settings"
Cohesion: 0.23
Nodes (12): Environment, get_settings(), StrEnum, create_background_job_client(), create_user_scoped_client(), get_privileged_supabase_client(), get_supabase_client(), Client (+4 more)

### Community 55 - ".__call__"
Cohesion: 0.21
Nodes (9): ASGIApp, _build_error_response(), _BodyTooLarge, RequestLimitsMiddleware, HTTPException, JSONResponse, Receive, Scope (+1 more)

### Community 56 - "endpoints/appointments.py"
Cohesion: 0.16
Nodes (22): AppointmentInput, create_appointment(), delete_appointment(), get_appointment(), list_appointments(), AppointmentStatus, delete, get (+14 more)

### Community 57 - "EditAppointmentPage.tsx"
Cohesion: 0.31
Nodes (11): fetchAppointment(), listAppointments(), patchAppointment(), useAppointmentQuery(), useAppointmentsInfiniteQuery(), translateAppointmentError(), appointmentToFormState(), AppointmentDetailPage() (+3 more)

### Community 58 - "UUID"
Cohesion: 0.22
Nodes (5): AchievementStatus, UUID, Expira apenas a visualização do streak; o histórico não é reescrito., Reavalia todas as conquistas do usuário e persiste as recém-obtidas. Chamado…, Tenta a avaliação síncrona; o trigger transacional garante o retry. A atividade…

### Community 59 - "appointment.py"
Cohesion: 0.23
Nodes (10): AppointmentInput, AppointmentPatchInput, BaseModel, datetime, field_validator, model_validator, test_appointment_normalizes_datetime_to_utc(), test_appointment_rejects_naive_datetime() (+2 more)

### Community 61 - "AppointmentStatus"
Cohesion: 0.36
Nodes (9): AppointmentStatus, Valida o ciclo de vida da consulta (seção 3.4 da documentação): scheduled ->…, validate_status_transition(), AppointmentStatus, AppointmentStatus, parametrize, test_invalid_transitions_raise(), test_repeating_current_status_is_idempotent() (+1 more)

### Community 62 - "App.tsx"
Cohesion: 0.13
Nodes (16): AppointmentDetailPage, BrushingTimerPage, EditAppointmentPage, EducationModulePage, ResetPasswordPage, SignInPage, SignUpPage, fetchHealthProfile() (+8 more)

### Community 63 - "BrushingTimerPage.test.tsx"
Cohesion: 0.11
Nodes (13): BrushingTimerPage(), mockCompletedZones, mockFinish, mockPause, mockPersistZone, mockResumeFrom, mockResumeTimer, mockRetryFinish (+5 more)

### Community 64 - "CurrentUser"
Cohesion: 0.14
Nodes (19): get_dashboard(), get, create_flossing_log(), list_flossing_logs(), get, IdempotencyKey, post, DashboardSummary (+11 more)

### Community 65 - "appointmentStatusActions.ts"
Cohesion: 0.36
Nodes (7): ACTION_LABELS, ALLOWED_TRANSITIONS, AppointmentAction, availableStatusActions(), canEdit(), isTerminal(), AppointmentStatus

### Community 66 - "SidebarNav.tsx"
Cohesion: 0.23
Nodes (7): OralCardioLogo(), ToothbrushIcon(), AppShell(), BottomNav(), NavDestination, NAVIGATION_DESTINATIONS, SidebarNav()

### Community 67 - "AchievementConditionType"
Cohesion: 0.11
Nodes (35): Achievement, AchievementEvaluator, AchievementSnapshot, _check_all_modules_completed(), _check_appointment_scheduled(), _check_brushing_count(), _check_flossing_count(), _check_health_profile_completed() (+27 more)

### Community 68 - "Database quality test job"
Cohesion: 0.24
Nodes (10): Database quality CI pipeline, Reviewed Supabase CLI version pinning, Clean Supabase database startup, Database quality change triggers, Database quality workflow, Ordered database migration application, Supabase CLI version pinning, Database quality test job (+2 more)

### Community 69 - "MouthQuadrantMap.tsx"
Cohesion: 0.13
Nodes (18): BRUSHING_ZONE_LABELS, BRUSHING_ZONE_ORDER, BRUSHING_ZONE_TIPS, SECONDS_PER_ZONE, TOTAL_BRUSHING_SECONDS, markerFor(), MouthQuadrantMap(), MouthQuadrantMapProps (+10 more)

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

### Community 75 - "services/conftest.py"
Cohesion: 0.70
Nodes (4): empty_stats(), fixture, UUID, user_id()

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

### Community 86 - "AppointmentService"
Cohesion: 0.18
Nodes (9): get_appointment_service(), InstantClock, datetime, Protocol, UtcClock, AppointmentService, AppointmentStatus, AppointmentType (+1 more)

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

### Community 100 - "buildAppointmentPatch.ts"
Cohesion: 0.36
Nodes (6): assertMaxLength(), buildAppointmentPatch(), optionalPatchValue(), NOW_MS, ORIGINAL, handleSubmit()

### Community 105 - "useBrushingSessionController.ts"
Cohesion: 0.32
Nodes (10): completeBrushingSession(), markZoneCompleted(), startBrushingSession(), BrushingSession, patientMessage(), PersistenceTask, readRecovery(), shouldReconcileZones() (+2 more)

### Community 114 - "Documentação Password"
Cohesion: 0.17
Nodes (12): Password Recovery Production Operations, AuthProvider Password Recovery Extension, Password Recovery Implementation Plan, Password Recovery Routes, Test-Driven Password Recovery Task Sequence, AuthContext Authentication Facade, Enumeration-Resistant Recovery Response, Exact Recovery Redirect Allowlist (+4 more)

### Community 116 - "OralCardio monorepo architecture"
Cohesion: 0.40
Nodes (5): Patient Row Level Security policies, Backend layered architecture, Database Row Level Security, Frontend feature-based architecture, OralCardio monorepo architecture

### Community 120 - "repositories/user_repository.py"
Cohesion: 0.35
Nodes (5): UUID, SupabaseUserRepository, _to_record(), _ClientThatMustNotBeCalled, test_list_by_ids_returns_empty_without_touching_client_for_empty_input()

### Community 182 - "Entrega Backend"
Cohesion: 0.20
Nodes (10): API Contract Pipeline, OpenAPI Contract Verification, Backend Quality Pipeline, Python Quality Gates, Backend Development Quality Dependencies, FastAPI and Supabase Runtime Stack, Backend Runtime Dependencies, Web Push and Cryptography Stack (+2 more)

### Community 183 - "main.py"
Cohesion: 0.24
Nodes (7): FastAPI, Headers de segurança para as respostas da API. A CSP pertence ao host da PWA,…, register_http_security_headers(), lifespan(), FastAPI, Valida segredos operacionais antes de aceitar tráfego de produção., Exporta o contrato OpenAPI sem iniciar servidor ou tocar no Supabase.

### Community 184 - "HealthCheckPage.tsx"
Cohesion: 0.43
Nodes (5): HealthCheckPage, fetchHealthStatus(), HealthStatus, HealthCheckPage(), LoadState

### Community 186 - "businessClock.ts"
Cohesion: 0.31
Nodes (8): asNumber(), asUtcMs(), BUSINESS_TIME_ZONE, businessCalendarDayDelta(), businessDateKey(), businessDateTimeLocalToIso(), businessDateTimeParts, PARTS_FORMATTER

### Community 187 - "OralCardio"
Cohesion: 0.22
Nodes (11): Backup before destructive migration 011, OralCardio Supabase database, Production database rollout order, Transactional final-state database test, Database behavioral invariants, Database integration tests, OralCardio architecture graph, Vercel, Render, and Supabase deployment topology (+3 more)

### Community 188 - "Documentação Production"
Cohesion: 0.25
Nodes (8): Frontend Production and Browser Checks, Frontend Quality Pipeline, Production Content Security Policy, OralCardio Deployment Runbook, Observability Backup and Rollback, Production Secret Isolation, Staging-First Release Policy, Vercel Render and Supabase Topology

### Community 194 - "Q: vou ir descansar agora, mas analisando como um desenvolvedor senior e analisando o output completo do graphify do projeto, oq vc percebe que o nosso projeto necessita de pontos de melhoria, seja de otimização, melhoria de codigo, limpeza, etc... solid... analise primeiro backend depois front depois o banco"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: vou ir descansar agora, mas analisando como um desenvolvedor senior e analisando o output completo do graphify do projeto, oq vc percebe que o nosso projeto necessita de pontos de melhoria, seja de otimização, melhoria de codigo, limpeza, etc... solid... analise primeiro backend depois front depois o banco, Source Nodes

### Community 199 - "calculate_level"
Cohesion: 0.27
Nodes (7): calculate_level(), Level, Retorna o nível correspondente ao total de pontos. Espelha a função…, DashboardSummary, UUID, parametrize, test_calculate_level_boundaries()

### Community 202 - "BrushingTipsModal.tsx"
Cohesion: 0.33
Nodes (3): BrushingTipsModal(), BrushingTipsModalProps, TIPS

### Community 204 - "Local database test execution"
Cohesion: 0.50
Nodes (4): Administrative fixture setup, Authenticated RLS assertions, Local database test execution, Transactional test rollback

## Knowledge Gaps
- **274 isolated node(s):** `cardio-care-backend`, `claimed_deliveries`, `claimed_evaluations`, `MOCK_USER`, `MOCK_SESSION` (+269 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 668 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `_RecordingQuery` connect `_RecordingQuery` to `AppointmentRecord`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `UserStatsRecord` connect `UserStatsRecord` to `GamificationRepository`, `AchievementRecord`, `deps.py`, `repositories/interfaces.py`, `services/conftest.py`, `schemas/gamification.py`, `records.py`, `test_dashboard_service.py`, `UUID`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `BrushingSessionRecord` connect `enums.py` to `records.py`, `repositories/interfaces.py`, `UUID`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 15 inferred relationships involving `EntityNotFoundError` (e.g. with `SupabaseAppointmentRepository` and `SupabaseRepository`) actually correct?**
  _`EntityNotFoundError` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `CurrentUser` (e.g. with `require_completed_health_profile()` and `create_appointment()`) actually correct?**
  _`CurrentUser` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `BusinessRuleViolationError` (e.g. with `SupabaseRepository` and `AppointmentService`) actually correct?**
  _`BusinessRuleViolationError` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `UserStatsRecord` (e.g. with `SupabaseGamificationRepository` and `GamificationRepository`) actually correct?**
  _`UserStatsRecord` has 16 INFERRED edges - model-reasoned connections that need verification._
