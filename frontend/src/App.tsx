import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { NotFoundPage } from "@/shared/components/layout/NotFoundPage";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute";
import { RedirectIfAuthenticated } from "@/shared/auth/RedirectIfAuthenticated";

const SignInPage = lazy(async () => ({ default: (await import("@/features/auth/pages/SignInPage")).SignInPage }));
const SignUpPage = lazy(async () => ({ default: (await import("@/features/auth/pages/SignUpPage")).SignUpPage }));
const OAuthCallbackPage = lazy(async () => ({ default: (await import("@/features/auth/pages/OAuthCallbackPage")).OAuthCallbackPage }));
const AppointmentDetailPage = lazy(async () => ({ default: (await import("@/features/appointments/pages/AppointmentDetailPage")).AppointmentDetailPage }));
const AppointmentsListPage = lazy(async () => ({ default: (await import("@/features/appointments/pages/AppointmentsListPage")).AppointmentsListPage }));
const EditAppointmentPage = lazy(async () => ({ default: (await import("@/features/appointments/pages/EditAppointmentPage")).EditAppointmentPage }));
const NewAppointmentPage = lazy(async () => ({ default: (await import("@/features/appointments/pages/NewAppointmentPage")).NewAppointmentPage }));
const BrushingTimerPage = lazy(async () => ({ default: (await import("@/features/brushing/pages/BrushingTimerPage")).BrushingTimerPage }));
const DashboardPage = lazy(async () => ({ default: (await import("@/features/dashboard/pages/DashboardPage")).DashboardPage }));
const EducationListPage = lazy(async () => ({ default: (await import("@/features/education/pages/EducationListPage")).EducationListPage }));
const EducationModulePage = lazy(async () => ({ default: (await import("@/features/education/pages/EducationModulePage")).EducationModulePage }));
const AchievementsPage = lazy(async () => ({ default: (await import("@/features/gamification/pages/AchievementsPage")).AchievementsPage }));
const HealthCheckPage = lazy(async () => ({ default: (await import("@/features/health/pages/HealthCheckPage")).HealthCheckPage }));
const HealthQuestionnairePage = lazy(async () => ({ default: (await import("@/features/onboarding/pages/HealthQuestionnairePage")).HealthQuestionnairePage }));
const ProfilePage = lazy(async () => ({ default: (await import("@/features/profile/pages/ProfilePage")).ProfilePage }));
const NotificationSettingsPage = lazy(async () => ({ default: (await import("@/features/notifications/pages/NotificationSettingsPage")).NotificationSettingsPage }));

function RouteLoadingFallback() {
  return (
    <main aria-live="polite" className="mx-auto flex min-h-dvh w-full max-w-[28rem] items-center justify-center px-lg">
      <p className="font-body text-body-md text-muted">Carregando…</p>
    </main>
  );
}

export function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
      {import.meta.env.DEV ? <Route path="/diagnostico" element={<HealthCheckPage />} /> : null}

      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/entrar" element={<SignInPage />} />
        <Route path="/criar-conta" element={<SignUpPage />} />
      </Route>

      <Route element={<ProtectedRoute requireCompletedProfile={false} />}>
        <Route path="/questionario" element={<HealthQuestionnairePage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/escovar" element={<BrushingTimerPage />} />
          <Route path="/conquistas" element={<AchievementsPage />} />
          <Route path="/educacao" element={<EducationListPage />} />
          <Route path="/educacao/:slug" element={<EducationModulePage />} />
          <Route path="/agenda" element={<AppointmentsListPage />} />
          <Route path="/agenda/nova" element={<NewAppointmentPage />} />
          <Route path="/agenda/:id" element={<AppointmentDetailPage />} />
          <Route path="/agenda/:id/editar" element={<EditAppointmentPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/perfil/notificacoes" element={<NotificationSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
