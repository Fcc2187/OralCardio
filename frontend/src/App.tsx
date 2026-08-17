import { Route, Routes } from "react-router-dom";

import { SignInPage } from "@/features/auth/pages/SignInPage";
import { SignUpPage } from "@/features/auth/pages/SignUpPage";
import { AppointmentDetailPage } from "@/features/appointments/pages/AppointmentDetailPage";
import { AppointmentsListPage } from "@/features/appointments/pages/AppointmentsListPage";
import { EditAppointmentPage } from "@/features/appointments/pages/EditAppointmentPage";
import { NewAppointmentPage } from "@/features/appointments/pages/NewAppointmentPage";
import { BrushingTimerPage } from "@/features/brushing/pages/BrushingTimerPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { EducationListPage } from "@/features/education/pages/EducationListPage";
import { EducationModulePage } from "@/features/education/pages/EducationModulePage";
import { AchievementsPage } from "@/features/gamification/pages/AchievementsPage";
import { HealthCheckPage } from "@/features/health/pages/HealthCheckPage";
import { HealthQuestionnairePage } from "@/features/onboarding/pages/HealthQuestionnairePage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { NotFoundPage } from "@/shared/components/layout/NotFoundPage";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute";
import { RedirectIfAuthenticated } from "@/shared/auth/RedirectIfAuthenticated";

export function App() {
  return (
    <Routes>
      <Route path="/diagnostico" element={<HealthCheckPage />} />

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
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
