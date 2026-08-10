import { Route, Routes } from "react-router-dom";

import { HealthCheckPage } from "@/features/health/pages/HealthCheckPage";
import { AppShell } from "@/shared/components/layout/AppShell";

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HealthCheckPage />} />
      </Routes>
    </AppShell>
  );
}
