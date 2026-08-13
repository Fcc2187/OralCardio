import { Badge } from "@/shared/components/ui/Badge";
import { Card } from "@/shared/components/ui/Card";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import { Screen } from "@/shared/components/layout/Screen";
import { FlossingCard } from "@/features/flossing/components/FlossingCard";

import { useDashboardQuery } from "../api/useDashboardQuery";

export function DashboardPage() {
  const { data, isPending, isError } = useDashboardQuery();

  if (isPending) {
    return <LoadingFeedback message="Carregando seu painel…" />;
  }

  if (isError) {
    return (
      <Screen>
        <ErrorFeedback message="Não foi possível carregar seu painel. Tente novamente em instantes." />
      </Screen>
    );
  }

  const firstName = data.full_name.split(" ")[0] || data.full_name;

  return (
    <Screen title={`Olá, ${firstName}`}>
      <Card variant={data.brushed_today ? "cream" : "coral"}>
        <p className="font-body text-body-sm font-medium">
          {data.brushed_today ? "Você já escovou hoje" : "Ainda não escovou hoje"}
        </p>
        <p className="mt-xs text-display-sm">
          {data.current_streak_days} {data.current_streak_days === 1 ? "dia" : "dias"} seguidos
        </p>
        {!data.brushed_today ? (
          <LinkButton to="/escovar" className="mt-md">
            Escovar agora
          </LinkButton>
        ) : null}
      </Card>

      <FlossingCard flossedToday={data.flossed_today} />

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
