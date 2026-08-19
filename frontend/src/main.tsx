import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { App } from "@/App";
import { AchievementUnlockProvider } from "@/shared/achievements/AchievementUnlockProvider";
import { AuthProvider } from "@/shared/auth/AuthProvider";
import { NotificationSubscriptionProvider } from "@/features/notifications/NotificationSubscriptionProvider";
import "@/styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Elemento #root não encontrado em index.html");
}

const queryClient = new QueryClient();

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationSubscriptionProvider>
            <AchievementUnlockProvider>
              <App />
            </AchievementUnlockProvider>
          </NotificationSubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
