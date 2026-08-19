import { Badge } from "@/shared/components/ui/Badge";
import { Card } from "@/shared/components/ui/Card";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import { Screen } from "@/shared/components/layout/Screen";
import { RetryButton } from "@/shared/components/ui/RetryButton";
import { FlossingCard } from "@/features/flossing/components/FlossingCard";

import { useDashboardQuery } from "../api/useDashboardQuery";

export function DashboardPage() {
  const { data, isPending, isError, refetch } = useDashboardQuery();

  if (isPending) {
    return <LoadingFeedback message="Carregando seu painel…" />;
  }

  if (isError) {
    return (
      <Screen>
        <ErrorFeedback message="Não foi possível carregar seu painel. Tente novamente em instantes." />
        <RetryButton onRetry={() => refetch()} />
      </Screen>
    );
  }

  const firstName = data.full_name.split(" ")[0] || data.full_name;
  const brushingsToday =
    Number.isFinite(data.brushings_today) && data.brushings_today >= 0
      ? Math.trunc(data.brushings_today)
      : Number(Boolean(data.brushed_today));
  const flossingsToday =
    Number.isFinite(data.flossings_today) && data.flossings_today >= 0
      ? Math.trunc(data.flossings_today)
      : Number(Boolean(data.flossed_today));

  return (
    <Screen title={`Olá, ${firstName}`}>
      <Card variant={data.brushed_today ? "cream" : "coral"}>
        <p className="font-body text-body-sm font-medium">
          {brushingsToday === 0
            ? "Ainda não escovou hoje"
            : `${brushingsToday} ${brushingsToday === 1 ? "escovação" : "escovações"} hoje`}
        </p>
        <p className="mt-xs text-display-sm">
          {data.current_streak_days} {data.current_streak_days === 1 ? "dia" : "dias"} seguidos
        </p>
        <LinkButton to="/escovar" className="mt-md">
          {brushingsToday === 0 ? "Escovar agora" : "Escovar novamente"}
        </LinkButton>
      </Card>

      <FlossingCard flossingsToday={flossingsToday} />

      <Card variant="canvas">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-body-sm text-muted">Nível</p>
            <p className="text-title-lg font-display">{data.level_name}</p>
          </div>
          <Badge variant="coral">{data.total_points} pontos</Badge>
        </div>
      </Card>

      <LinkButton to="/educacao" variant="secondary">
        Módulos educacionais
      </LinkButton>
      <LinkButton to="/agenda" variant="secondary">
        Agenda de consultas
      </LinkButton>
      <LinkButton to="/conquistas" variant="secondary">
        Ver conquistas
      </LinkButton>
    </Screen>
  );
}
