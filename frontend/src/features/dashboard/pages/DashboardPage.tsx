import { Bell } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { useNotifications } from "@/features/notifications/notificationContext";
import { FlossingCard } from "@/features/flossing/components/FlossingCard";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { RetryButton } from "@/shared/components/ui/RetryButton";

import { useDashboardQuery } from "../api/useDashboardQuery";
import { BrushingSummaryCard } from "../components/BrushingSummaryCard";
import { DashboardQuickLinks } from "../components/DashboardQuickLinks";
import { LevelProgressCard } from "../components/LevelProgressCard";

export function DashboardPage() {
  const { data, isPending, isError, refetch } = useDashboardQuery();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { permission, hasSubscription, error: notifError } = useNotifications();

  const showNotificationDot =
    permission !== "granted" || !hasSubscription || Boolean(notifError);

  useEffect(() => {
    document.title = "Início — OralCardio";
  }, []);

  useEffect(() => {
    if (!isPending && !isError) {
      headingRef.current?.focus();
    }
  }, [isPending, isError]);

  if (isPending) {
    return <LoadingFeedback message="Carregando seu painel…" />;
  }

  if (isError) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 min-[1024px]:px-10 min-[1024px]:py-10">
        <ErrorFeedback message="Não foi possível carregar seu painel. Tente novamente em instantes." />
        <RetryButton onRetry={() => refetch()} />
      </main>
    );
  }

  const firstName = data.full_name.split(" ")[0] || data.full_name;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 min-[1024px]:px-10 min-[1024px]:py-10">
      {/* Top Header Row */}
      <header className="flex items-start justify-between">
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-[1.85rem] font-normal leading-tight text-ink outline-none min-[1024px]:text-[2.2rem]"
          >
            Olá, {firstName}
          </h1>
          <p className="mt-1 font-body text-body-sm text-muted">
            Vamos cuidar do seu sorriso hoje? ♡
          </p>
        </div>

        <Link
          to="/perfil/notificacoes"
          aria-label="Configurar notificações"
          className="relative flex size-11 items-center justify-center rounded-full bg-white shadow-xs border border-hairline-soft text-ink transition-colors hover:bg-surface-soft min-h-tap-target-min"
        >
          <Bell aria-hidden="true" className="size-5" />
          {showNotificationDot ? (
            <span
              aria-hidden="true"
              className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary-action ring-2 ring-white"
            />
          ) : null}
        </Link>
      </header>

      {/* Main Grid: Hero Brushing on Left, Flossing & Level on Right */}
      <div className="grid grid-cols-1 gap-4 min-[1024px]:grid-cols-2 min-[1024px]:gap-6">
        <BrushingSummaryCard
          brushingsToday={data.brushings_today}
          streakDays={data.current_streak_days}
        />

        <div className="flex flex-col gap-4 min-[1024px]:gap-6">
          <FlossingCard flossingsToday={data.flossings_today} />
          <LevelProgressCard
            levelName={data.level_name}
            totalPoints={data.total_points}
            currentLevelMinPoints={data.current_level_min_points}
            nextLevelName={data.next_level_name}
            nextLevelMinPoints={data.next_level_min_points}
          />
        </div>
      </div>

      {/* Quick Links Row (3 cards) */}
      <DashboardQuickLinks
        completedEducationModules={data.completed_education_modules}
        totalEducationModules={data.total_education_modules}
        nextAppointmentAt={data.next_appointment_at}
      />
    </main>
  );
}
