import { useCallback, useEffect, useRef, useState } from "react";

import { BRUSHING_ZONE_ORDER, SECONDS_PER_ZONE } from "./brushingZones";
import type { BrushingZone } from "./types";

export type BrushingTimerStatus = "idle" | "running" | "paused" | "finished";

interface UseBrushingTimerOptions {
  onZoneComplete?: (zone: BrushingZone) => void;
  onAllZonesComplete?: () => void;
}

interface UseBrushingTimerResult {
  status: BrushingTimerStatus;
  currentZone: BrushingZone | null;
  secondsElapsedInZone: number;
  secondsRemainingInZone: number;
  completedZones: BrushingZone[];
  start: () => void;
  pause: () => void;
  resume: () => void;
}

/** Avança pelas 5 zonas da escovação, 24s cada, disparando callbacks nos
 * marcos relevantes. Puro e sem I/O — quem chama decide o que fazer com a
 * rede (persistir zona concluída, finalizar sessão); isso mantém o hook
 * testável com temporizadores falsos, sem precisar mockar HTTP. */
export function useBrushingTimer(options: UseBrushingTimerOptions = {}): UseBrushingTimerResult {
  const [status, setStatus] = useState<BrushingTimerStatus>("idle");
  const [zoneIndex, setZoneIndex] = useState(0);
  const [secondsElapsedInZone, setSecondsElapsedInZone] = useState(0);
  const [completedZones, setCompletedZones] = useState<BrushingZone[]>([]);

  const onZoneCompleteRef = useRef(options.onZoneComplete);
  onZoneCompleteRef.current = options.onZoneComplete;
  const onAllZonesCompleteRef = useRef(options.onAllZonesComplete);
  onAllZonesCompleteRef.current = options.onAllZonesComplete;

  useEffect(() => {
    if (status !== "running") return undefined;

    const intervalId = setInterval(() => {
      setSecondsElapsedInZone((current) => current + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    if (status !== "running" || secondsElapsedInZone < SECONDS_PER_ZONE) return;

    const finishedZone = BRUSHING_ZONE_ORDER[zoneIndex];
    onZoneCompleteRef.current?.(finishedZone);
    setCompletedZones((current) => [...current, finishedZone]);

    const nextIndex = zoneIndex + 1;
    if (nextIndex >= BRUSHING_ZONE_ORDER.length) {
      setStatus("finished");
      onAllZonesCompleteRef.current?.();
    } else {
      setZoneIndex(nextIndex);
      setSecondsElapsedInZone(0);
    }
  }, [secondsElapsedInZone, status, zoneIndex]);

  const start = useCallback(() => setStatus("running"), []);
  const pause = useCallback(
    () => setStatus((current) => (current === "running" ? "paused" : current)),
    [],
  );
  const resume = useCallback(
    () => setStatus((current) => (current === "paused" ? "running" : current)),
    [],
  );

  return {
    status,
    currentZone: status === "finished" ? null : BRUSHING_ZONE_ORDER[zoneIndex],
    secondsElapsedInZone,
    secondsRemainingInZone: Math.max(0, SECONDS_PER_ZONE - secondsElapsedInZone),
    completedZones,
    start,
    pause,
    resume,
  };
}
