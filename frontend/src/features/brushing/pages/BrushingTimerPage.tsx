import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { Screen } from "@/shared/components/layout/Screen";
import { cn } from "@/shared/utils/cn";

import { BRUSHING_ZONE_LABELS, BRUSHING_ZONE_ORDER } from "../brushingZones";
import { MouthQuadrantMap } from "../components/MouthQuadrantMap";
import { useBrushingSessionController } from "../useBrushingSessionController";
import { useBrushingTimer } from "../useBrushingTimer";

export function BrushingTimerPage() {
  const navigate = useNavigate();
  const session = useBrushingSessionController();

  const timer = useBrushingTimer({
    onZoneComplete: (zone) => {
      session.persistZone(zone);
    },
    onAllZonesComplete: () => {
      void session.finish(BRUSHING_ZONE_ORDER);
    },
  });

  async function handleStart() {
    try {
      await session.start();
      timer.start();
    } catch {
      // O controller já expõe uma mensagem segura para a tela.
    }
  }

  if (timer.status === "idle") {
    return (
      <Screen title="Hora de escovar" subtitle="2 minutos, 5 zonas da boca">
        <Card variant="canvas">
          <p className="font-body text-body-md text-body">
            Vamos guiar você por cada zona da boca por 24 segundos. Mantenha o app aberto durante
            a escovação.
          </p>
        </Card>
        {session.startError ? (
          <ErrorFeedback message={session.startError} />
        ) : null}
        <Button onClick={() => void handleStart()} disabled={session.isStarting}>
          {session.isStarting ? "Iniciando…" : "Começar"}
        </Button>
      </Screen>
    );
  }

  if (timer.status === "finished") {
    return (
      <Screen title="Escovação concluída!">
        {session.isSaving ? (
          <Card variant="canvas">
            <p className="font-body text-body-md text-body">Salvando sua sessão…</p>
          </Card>
        ) : null}

        {session.saveError && !session.isSaving ? (
          <>
            <ErrorFeedback message={`${session.saveError} Seu progresso foi preservado.`} />
            <Button onClick={() => void session.retryFinish()}>
              Tentar novamente
            </Button>
          </>
        ) : null}

        {session.isComplete ? (
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

        <MouthQuadrantMap
          currentZone={timer.currentZone}
          completedZones={timer.completedZones}
        />

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

        {session.saveError ? (
          <div className="w-full">
            <ErrorFeedback message="A sincronização foi interrompida, mas o timer continua preservado." />
            <Button variant="secondary" onClick={() => void session.retryPendingZones()}>
              Tentar sincronizar
            </Button>
          </div>
        ) : null}

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
