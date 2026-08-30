import { useCallback, useEffect, useRef, useState } from "react";

import { BRUSHING_ZONE_ORDER, SECONDS_PER_ZONE, TOTAL_BRUSHING_SECONDS } from "./brushingZones";
import type { BrushingZone } from "./types";

export type BrushingTimerStatus = "idle" | "running" | "paused" | "finished";

interface UseBrushingTimerOptions {
  onZoneComplete?: (zone: BrushingZone) => void;
  onAllZonesComplete?: () => void;
}

export interface UseBrushingTimerResult {
  status: BrushingTimerStatus;
  currentZone: BrushingZone | null;
  secondsElapsedInZone: number;
  secondsRemainingInZone: number;
  formattedSecondsRemainingInZone: string;
  totalElapsedSeconds: number;
  progressPercent: number;
  completedZones: BrushingZone[];
  start: () => void;
  resumeFrom: (completedZones: readonly BrushingZone[]) => void;
  pause: () => void;
  resume: () => void;
}

/** Avança pelas 5 zonas da escovação, 24s cada, disparando callbacks nos
 * marcos relevantes. Puro e sem I/O — quem chama decide o que fazer com a
 * rede (persistir zona concluída, finalizar sessão); isso mantém o hook
 * testável com temporizadores falsos, sem precisar mockar HTTP. */
export function useBrushingTimer(options: UseBrushingTimerOptions = {}): UseBrushingTimerResult {
  const [status, setStatus] = useState<BrushingTimerStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedZones, setCompletedZones] = useState<BrushingZone[]>([]);
  const elapsedBeforeRunningRef = useRef(0);
  const runningSinceRef = useRef<number | null>(null);
  const announcedZoneCountRef = useRef(0);

  const onZoneCompleteRef = useRef(options.onZoneComplete);
  onZoneCompleteRef.current = options.onZoneComplete;
  const onAllZonesCompleteRef = useRef(options.onAllZonesComplete);
  onAllZonesCompleteRef.current = options.onAllZonesComplete;

  useEffect(() => {
    if (status !== "running") return undefined;

    const syncElapsed = () => {
      const runningSince = runningSinceRef.current;
      if (runningSince === null) return;
      setElapsedSeconds(elapsedBeforeRunningRef.current + Math.floor((performance.now() - runningSince) / 1000));
    };
    syncElapsed();
    const intervalId = setInterval(syncElapsed, 250);

    return () => clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    if (status !== "running") return;
    const completedCount = Math.min(
      Math.floor(elapsedSeconds / SECONDS_PER_ZONE),
      BRUSHING_ZONE_ORDER.length,
    );
    while (announcedZoneCountRef.current < completedCount) {
      const zone = BRUSHING_ZONE_ORDER[announcedZoneCountRef.current];
      onZoneCompleteRef.current?.(zone);
      announcedZoneCountRef.current += 1;
    }
    setCompletedZones(BRUSHING_ZONE_ORDER.slice(0, completedCount));

    if (completedCount >= BRUSHING_ZONE_ORDER.length) {
      elapsedBeforeRunningRef.current = BRUSHING_ZONE_ORDER.length * SECONDS_PER_ZONE;
      runningSinceRef.current = null;
      setStatus("finished");
      onAllZonesCompleteRef.current?.();
    }
  }, [elapsedSeconds, status]);

  const start = useCallback(() => {
    elapsedBeforeRunningRef.current = 0;
    runningSinceRef.current = performance.now();
    announcedZoneCountRef.current = 0;
    setElapsedSeconds(0);
    setCompletedZones([]);
    setStatus("running");
  }, []);
  const resumeFrom = useCallback((completedZones: readonly BrushingZone[]) => {
    const completedCount = BRUSHING_ZONE_ORDER.findIndex(
      (zone, index) => completedZones[index] !== zone,
    );
    const safeCompletedCount = completedCount === -1
      ? Math.min(completedZones.length, BRUSHING_ZONE_ORDER.length)
      : completedCount;
    const elapsed = safeCompletedCount * SECONDS_PER_ZONE;
    elapsedBeforeRunningRef.current = elapsed;
    runningSinceRef.current = performance.now();
    announcedZoneCountRef.current = safeCompletedCount;
    setElapsedSeconds(elapsed);
    setCompletedZones(BRUSHING_ZONE_ORDER.slice(0, safeCompletedCount));
    // Mesmo com cinco zonas persistidas, deixa o efeito concluir a sessão no
    // backend antes de expor a tela final ao paciente.
    setStatus("running");
  }, []);
  const pause = useCallback(
    () => {
      if (runningSinceRef.current !== null) {
        elapsedBeforeRunningRef.current += Math.floor((performance.now() - runningSinceRef.current) / 1000);
        runningSinceRef.current = null;
        setElapsedSeconds(elapsedBeforeRunningRef.current);
      }
      setStatus((current) => (current === "running" ? "paused" : current));
    },
    [],
  );
  const resume = useCallback(
    () => {
      setStatus((current) => {
        if (current !== "paused") return current;
        runningSinceRef.current = performance.now();
        return "running";
      });
    },
    [],
  );

  const zoneIndex = Math.min(Math.floor(elapsedSeconds / SECONDS_PER_ZONE), BRUSHING_ZONE_ORDER.length - 1);
  const secondsElapsedInZone = status === "finished" ? SECONDS_PER_ZONE : elapsedSeconds % SECONDS_PER_ZONE;
  const secondsRemainingInZone = status === "finished" ? 0 : Math.max(0, SECONDS_PER_ZONE - secondsElapsedInZone);
  const minutes = Math.floor(secondsRemainingInZone / 60);
  const seconds = secondsRemainingInZone % 60;
  const formattedSecondsRemainingInZone = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const totalElapsed = status === "finished" ? TOTAL_BRUSHING_SECONDS : Math.min(TOTAL_BRUSHING_SECONDS, elapsedSeconds);
  const progressPercent = Math.min(100, Math.floor((totalElapsed / TOTAL_BRUSHING_SECONDS) * 100));

  return {
    status,
    currentZone: status === "finished" ? null : BRUSHING_ZONE_ORDER[zoneIndex],
    secondsElapsedInZone,
    secondsRemainingInZone,
    formattedSecondsRemainingInZone,
    totalElapsedSeconds: totalElapsed,
    progressPercent,
    completedZones,
    start,
    resumeFrom,
    pause,
    resume,
  };
}
