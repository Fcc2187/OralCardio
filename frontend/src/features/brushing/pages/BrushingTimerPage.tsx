import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Info, Lightbulb, RotateCcw, CheckCircle2, Sparkles } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { cn } from "@/shared/utils/cn";
import { useAuth } from "@/shared/auth/authContext";

import {
  BRUSHING_ZONE_LABELS,
  BRUSHING_ZONE_ORDER,
  BRUSHING_ZONE_TIPS,
} from "../brushingZones";
import { MouthQuadrantMap } from "../components/MouthQuadrantMap";
import { BrushingMetricsHeader } from "../components/BrushingMetricsHeader";
import { BrushingZonePill } from "../components/BrushingZonePill";
import { BrushingProgressCard } from "../components/BrushingProgressCard";
import { BrushingTipsModal } from "../components/BrushingTipsModal";
import { useBrushingSessionController } from "../useBrushingSessionController";
import { useBrushingTimer } from "../useBrushingTimer";

function ZoneProgressIndicators({
  currentZone,
  completedZones,
}: {
  currentZone: (typeof BRUSHING_ZONE_ORDER)[number] | null;
  completedZones: readonly (typeof BRUSHING_ZONE_ORDER)[number][];
}) {
  return (
    <div className="flex items-center gap-2.5" role="list" aria-label="Progresso por zona">
      {BRUSHING_ZONE_ORDER.map((zone, index) => {
        const isCompleted = completedZones.includes(zone);
        const isCurrent = currentZone === zone;
        const isDone = isCompleted || isCurrent;
        return (
          <span
            key={zone}
            role="listitem"
            aria-label={`${BRUSHING_ZONE_LABELS[zone]}: ${
              isCompleted ? "concluída" : isCurrent ? "em andamento" : "pendente"
            }`}
            className={cn(
              "flex size-8 items-center justify-center rounded-full font-body text-caption font-semibold transition-all duration-300",
              isDone
                ? "bg-primary-action text-white shadow-2xs"
                : "bg-[#fbf6f2] text-muted border border-[#eddcd0]/60",
            )}
          >
            {index + 1}
          </span>
        );
      })}
    </div>
  );
}

export function BrushingTimerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const session = useBrushingSessionController(user?.id);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tipsTriggerRef = useRef<HTMLButtonElement>(null);
  const resumeAfterTipsRef = useRef(false);

  const timer = useBrushingTimer({
    onZoneComplete: (zone) => {
      session.persistZone(zone);
    },
    onAllZonesComplete: () => {
      void session.finish(BRUSHING_ZONE_ORDER);
    },
  });

  const pageTitle = timer.status === "idle"
    ? "Hora de escovar"
    : timer.status === "finished"
      ? "Escovação concluída!"
      : "Escovando";

  useEffect(() => {
    document.title = `${pageTitle} — OralCardio`;
    headingRef.current?.focus();
  }, [pageTitle]);

  async function handleStart() {
    try {
      await session.start();
      timer.start();
    } catch {
      // O controller já expõe uma mensagem segura para a tela.
    }
  }

  function handleResume() {
    const recoverableSession = session.resume();
    if (recoverableSession) timer.resumeFrom(recoverableSession.zones_completed);
  }

  function handleOpenTips() {
    resumeAfterTipsRef.current = timer.status === "running";
    if (resumeAfterTipsRef.current) timer.pause();
    setIsTipsOpen(true);
  }

  function handleCloseTips() {
    setIsTipsOpen(false);
    if (resumeAfterTipsRef.current) {
      resumeAfterTipsRef.current = false;
      timer.resume();
    }
  }

  // --- ESTADO INICIAL (IDLE) ---
  if (timer.status === "idle") {
    return (
      <main className="mx-auto flex w-full max-w-[860px] flex-col gap-6 px-4 py-6 min-[640px]:px-8 min-[1024px]:px-10">
        <header className="flex flex-col gap-1.5">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-[2rem] font-medium leading-tight text-ink min-[640px]:text-[2.4rem] outline-none">
            Hora de escovar
          </h1>
          <p className="font-body text-body-md text-muted flex items-center gap-1.5">
            <Clock className="size-4 text-primary-action shrink-0" aria-hidden="true" />
            <span>2 minutos, 5 zonas da boca</span>
          </p>
        </header>

        <div className="flex flex-col gap-5">
          {/* Card 1: Instrução */}
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-hairline-soft/80 min-[640px]:p-6">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#fbf5f0] border border-[#eddcd0] text-primary-action shadow-2xs"
              aria-hidden="true"
            >
              <Sparkles className="size-6 stroke-[1.8]" />
            </div>
            <p className="font-body text-body-md text-body leading-relaxed">
              Vamos guiar você por cada zona da boca por 24 segundos. Mantenha o app aberto durante a escovação.
            </p>
          </div>

          {session.startError ? (
            <ErrorFeedback message={session.startError} />
          ) : null}

          {/* Card 2: Sessão recuperável */}
          {session.recoverableSession ? (
            <div className="flex flex-col gap-4 rounded-2xl bg-[#fbf6f2] p-5 border border-[#eddcd0] min-[640px]:p-6">
              <div className="flex items-center gap-4">
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white border border-[#eddcd0] text-primary-action shadow-2xs"
                  aria-hidden="true"
                >
                  <RotateCcw className="size-6 stroke-[1.8]" />
                </div>
                <p className="font-body text-body-md font-medium text-ink leading-relaxed">
                  Encontramos uma escovação não concluída neste dispositivo.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleResume}
                className="w-full min-[640px]:w-fit bg-white hover:bg-surface-card rounded-xl border border-[#eddcd0] text-primary-action font-semibold h-12"
              >
                Retomar escovação
              </Button>
            </div>
          ) : null}

          {/* Botão Começar */}
          <div className="pt-2">
            <Button
              onClick={() => void handleStart()}
              disabled={session.isStarting}
              className="h-14 w-full rounded-2xl font-semibold text-[1.1rem] shadow-sm"
            >
              {session.isStarting ? "Iniciando…" : "Começar"}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // --- ESTADO CONCLUÍDO (FINISHED) ---
  if (timer.status === "finished") {
    return (
      <main className="mx-auto flex w-full max-w-[860px] flex-col gap-6 px-4 py-6 min-[640px]:px-8 min-[1024px]:px-10">
        <header className="flex flex-col gap-1">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-[1.85rem] font-medium leading-tight text-ink min-[640px]:text-[2.2rem] outline-none">
            Escovação concluída!
          </h1>
          <p className="font-body text-body-md text-muted">
            Parabéns por cuidar do seu sorriso
          </p>
        </header>

        {session.isSaving ? (
          <Card variant="canvas">
            <p className="font-body text-body-md text-body">Salvando sua sessão…</p>
          </Card>
        ) : null}

        {session.saveError && !session.isSaving ? (
          <div className="flex flex-col gap-4">
            <ErrorFeedback message={`${session.saveError} Seu progresso foi preservado.`} />
            <Button onClick={() => void session.retryFinish()} className="w-fit">
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {session.isComplete ? (
          <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-hairline-soft/80 min-[640px]:p-8">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-success/15 text-success">
                <CheckCircle2 className="size-8 stroke-[2]" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-display text-[1.5rem] font-semibold text-ink">
                  Muito bem!
                </h2>
                <p className="font-body text-body-md text-muted">
                  Você completou as 5 regiões da boca com sucesso.
                </p>
              </div>
            </div>

            <BrushingProgressCard progressPercent={100} />

            <div className="pt-2">
              <Button onClick={() => navigate("/", { replace: true })} className="h-12 w-full min-[640px]:w-auto min-[640px]:px-10">
                Voltar ao início
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    );
  }

  // --- ESTADO EM ANDAMENTO (RUNNING / PAUSED) ---
  const currentZone = timer.currentZone!;
  const currentZoneLabel = BRUSHING_ZONE_LABELS[currentZone];
  const currentZoneTip = BRUSHING_ZONE_TIPS[currentZone];

  return (
    <main className="mx-auto flex w-full max-w-[860px] flex-col gap-5 px-4 py-6 min-[640px]:px-8 min-[1024px]:px-10">
      {/* Cabeçalho da Página */}
      <header className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-[1.85rem] font-medium leading-tight text-ink min-[640px]:text-[2.2rem] outline-none">
            Escovando
          </h1>
          <p className="font-body text-body-md text-muted flex items-center gap-1">
            Cuide do seu sorriso <span aria-hidden="true" className="text-primary-action/80">♡</span>
          </p>
        </div>

        <button
          ref={tipsTriggerRef}
          type="button"
          onClick={handleOpenTips}
          className="inline-flex min-h-tap-target-min min-w-tap-target-min items-center justify-center gap-1.5 rounded-xl border border-[#eddcd0] bg-white px-3.5 py-1.5 font-body text-caption font-semibold text-body shadow-2xs transition-colors hover:bg-[#fbf6f2] hover:text-ink active:scale-95"
        >
          <Lightbulb className="size-4 text-primary-action stroke-[2]" aria-hidden="true" />
          <span>Dicas</span>
        </button>
      </header>

      {/* Barra de Métricas em 2 Cards */}
      <BrushingMetricsHeader
        completedCount={timer.completedZones.length}
        totalZones={5}
        totalDuration="2:00"
      />

      {/* Card Principal da Sessão */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-hairline-soft/80 min-[1024px]:p-8">
        <div className="grid grid-cols-1 items-center gap-8 min-[1024px]:grid-cols-2 min-[1024px]:gap-10">
          {/* Coluna Esquerda (Mobile: Topo / Desktop: Esquerda) */}
          <div className="flex flex-col items-center text-center min-[1024px]:items-start min-[1024px]:text-left">
            <span className="font-display text-[1.35rem] font-semibold text-ink min-[1024px]:text-[1.5rem]">
              {currentZoneLabel}
            </span>

            <span className="mt-2 font-display text-[4.4rem] font-medium leading-none tabular-nums text-primary-action min-[1024px]:text-[5rem]">
              {timer.formattedSecondsRemainingInZone}
            </span>

            <div className="mt-4">
              <BrushingZonePill
                tip={currentZoneTip}
                angle={currentZone !== "tongue" ? "45°" : undefined}
              />
            </div>

            <div className="mt-5 flex w-full flex-col items-center gap-4 min-[1024px]:items-start">
              <Button
                variant="secondary"
                onClick={timer.status === "running" ? timer.pause : timer.resume}
                className="w-full min-[640px]:w-auto min-[640px]:px-10 rounded-xl border border-primary-action text-primary-action bg-white hover:bg-[#fbf6f2]"
              >
                {timer.status === "running" ? "Pausar" : "Continuar"}
              </Button>

              <div className="hidden min-[1024px]:flex min-[1024px]:flex-col min-[1024px]:gap-3 min-[1024px]:pt-2">
                <div className="flex items-center gap-1.5 text-muted text-caption">
                  <Info className="size-3.5 text-muted shrink-0" aria-hidden="true" />
                  <span>Direita e esquerda consideram a sua perspectiva.</span>
                </div>

                <ZoneProgressIndicators currentZone={timer.currentZone} completedZones={timer.completedZones} />
              </div>
            </div>
          </div>

          {/* Coluna Direita: Mapa da Boca */}
          <div className="flex flex-col items-center justify-center">
            <MouthQuadrantMap
              currentZone={timer.currentZone}
              completedZones={timer.completedZones}
              showLegend={false}
              className="max-w-[15rem] min-[640px]:max-w-[18rem] min-[1024px]:max-w-[20rem]"
            />

            {/* Marcadores e legenda no Mobile */}
            <div className="mt-4 flex flex-col items-center gap-3 min-[1024px]:hidden">
              <div className="flex items-center gap-1.5 text-center text-muted text-caption">
                <Info className="size-3.5 text-muted shrink-0" aria-hidden="true" />
                <span>Direita e esquerda consideram a sua perspectiva.</span>
              </div>

              <ZoneProgressIndicators currentZone={timer.currentZone} completedZones={timer.completedZones} />
            </div>
          </div>
        </div>

        {session.saveError ? (
          <div className="mt-6 w-full pt-4 border-t border-hairline-soft/60">
            <ErrorFeedback message="A sincronização foi interrompida, mas o timer continua preservado." />
            <Button
              variant="secondary"
              onClick={() => void session.retryPendingZones()}
              className="mt-2"
            >
              Tentar sincronizar
            </Button>
          </div>
        ) : null}
      </div>

      {/* Card de Progresso: Escovação Completa */}
      <BrushingProgressCard progressPercent={timer.progressPercent} />

      {/* Modal de Dicas */}
      <BrushingTipsModal isOpen={isTipsOpen} onClose={handleCloseTips} triggerRef={tipsTriggerRef} />
    </main>
  );
}
