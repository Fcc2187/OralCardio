import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";
import { useAnnounceAchievements } from "@/shared/achievements/AchievementUnlockProvider";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { Screen } from "@/shared/components/layout/Screen";
import { cn } from "@/shared/utils/cn";

import { completeBrushingSession, markZoneCompleted, startBrushingSession } from "../api/brushingApi";
import { BRUSHING_ZONE_LABELS, BRUSHING_ZONE_ORDER } from "../brushingZones";
import type { BrushingZone } from "../types";
import { useBrushingTimer } from "../useBrushingTimer";

export function BrushingTimerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const announce = useAnnounceAchievements();

  const [sessionId, setSessionId] = useState<string | null>(null);

  const startMutation = useMutation({
    mutationFn: startBrushingSession,
    onSuccess: (session) => {
      setSessionId(session.id);
      timer.start();
    },
  });

  const zoneMutation = useMutation({
    mutationFn: ({ sessionId: id, zone }: { sessionId: string; zone: BrushingZone }) =>
      markZoneCompleted(id, zone),
  });

  const completeMutation = useMutation({
    mutationFn: completeBrushingSession,
    onSuccess: (result) => {
      invalidateGamifiedQueries(queryClient);
      announce(result.unlocked_achievements);
    },
  });

  const timer = useBrushingTimer({
    onZoneComplete: (zone) => {
      if (sessionId) {
        zoneMutation.mutate({ sessionId, zone });
      }
    },
    onAllZonesComplete: () => {
      if (sessionId) {
        completeMutation.mutate(sessionId);
      }
    },
  });

  if (timer.status === "idle") {
    return (
      <Screen title="Hora de escovar" subtitle="2 minutos, 5 zonas da boca">
        <Card variant="canvas">
          <p className="font-body text-body-md text-body">
            Vamos guiar você por cada zona da boca por 24 segundos. Mantenha o app aberto durante
            a escovação.
          </p>
        </Card>
        {startMutation.isError ? (
          <ErrorFeedback message="Não foi possível iniciar a sessão. Tente novamente." />
        ) : null}
        <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
          {startMutation.isPending ? "Iniciando…" : "Começar"}
        </Button>
      </Screen>
    );
  }

  if (timer.status === "finished") {
    return (
      <Screen title="Escovação concluída!">
        {completeMutation.isPending ? (
          <Card variant="canvas">
            <p className="font-body text-body-md text-body">Salvando sua sessão…</p>
          </Card>
        ) : null}

        {completeMutation.isError ? (
          <>
            <ErrorFeedback message="Não foi possível salvar sua sessão. Seus dados de escovação não foram perdidos — tente novamente." />
            <Button onClick={() => sessionId && completeMutation.mutate(sessionId)}>
              Tentar novamente
            </Button>
          </>
        ) : null}

        {completeMutation.isSuccess ? (
          <>
            <Card variant="coral">
              <p className="text-display-sm">Muito bem!</p>
              <p className="mt-xs font-body text-body-md">Você completou as 5 zonas da boca.</p>
            </Card>
            <Button onClick={() => navigate("/", { replace: true })}>Voltar ao início</Button>
          </>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen title="Escovando">
      <div className="flex flex-col items-center gap-lg">
        <p className="font-body text-title-md text-body-strong">
          {BRUSHING_ZONE_LABELS[timer.currentZone!]}
        </p>

        <p className="font-display text-[4rem] tabular-nums leading-none text-primary-action">
          {timer.secondsRemainingInZone}
        </p>

        <div className="flex gap-sm" role="list" aria-label="Progresso por zona">
          {BRUSHING_ZONE_ORDER.map((zone) => {
            const isCompleted = timer.completedZones.includes(zone);
            const isCurrent = timer.currentZone === zone;
            return (
              <span
                key={zone}
                role="listitem"
                aria-label={`${BRUSHING_ZONE_LABELS[zone]}: ${isCompleted ? "concluída" : isCurrent ? "em andamento" : "pendente"}`}
                className={cn(
                  "size-4 rounded-pill",
                  isCompleted && "bg-success",
                  isCurrent && !isCompleted && "bg-primary-action",
                  !isCompleted && !isCurrent && "bg-hairline",
                )}
              />
            );
          })}
        </div>

        <Button
          variant="secondary"
          onClick={timer.status === "running" ? timer.pause : timer.resume}
        >
          {timer.status === "running" ? "Pausar" : "Continuar"}
        </Button>
      </div>
    </Screen>
  );
}
