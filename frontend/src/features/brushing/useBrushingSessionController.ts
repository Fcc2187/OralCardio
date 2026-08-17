import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";

import {
  completeBrushingSession,
  markZoneCompleted,
  startBrushingSession,
} from "./api/brushingApi";
import type { BrushingZone } from "./types";

type PersistenceTask<T> = () => Promise<T>;

function patientMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível salvar sua escovação.";
}

export function useBrushingSessionController() {
  const queryClient = useQueryClient();
  const sessionIdRef = useRef<string | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const failedZonesRef = useRef(new Set<BrushingZone>());
  const lastZonesRef = useRef<readonly BrushingZone[]>([]);

  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const enqueue = useCallback(<T,>(task: PersistenceTask<T>): Promise<T> => {
    const next = queueRef.current.then(task, task);
    queueRef.current = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }, []);

  const start = useCallback(async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      const session = await startBrushingSession();
      sessionIdRef.current = session.id;
      return session;
    } catch (error) {
      setStartError(patientMessage(error));
      throw error;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const persistZone = useCallback(
    (zone: BrushingZone) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;

      void enqueue(() => markZoneCompleted(sessionId, zone))
        .then(() => failedZonesRef.current.delete(zone))
        .catch((error: unknown) => {
          failedZonesRef.current.add(zone);
          setSaveError(patientMessage(error));
        });
    },
    [enqueue],
  );

  const retryPendingZones = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    setSaveError(null);
    try {
      for (const zone of [...failedZonesRef.current]) {
        await enqueue(() => markZoneCompleted(sessionId, zone));
        failedZonesRef.current.delete(zone);
      }
    } catch (error) {
      setSaveError(patientMessage(error));
    }
  }, [enqueue]);

  const finish = useCallback(
    async (zones: readonly BrushingZone[]) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      lastZonesRef.current = zones;
      setIsSaving(true);
      setSaveError(null);

      try {
        await enqueue(async () => {
          try {
            return await completeBrushingSession(sessionId);
          } catch {
            for (const zone of zones) {
              await markZoneCompleted(sessionId, zone);
            }
            return completeBrushingSession(sessionId);
          }
        });
        failedZonesRef.current.clear();
        setIsComplete(true);
        invalidateGamifiedQueries(queryClient);
      } catch (error) {
        setSaveError(patientMessage(error));
      } finally {
        setIsSaving(false);
      }
    },
    [enqueue, queryClient],
  );

  const retryFinish = useCallback(
    () => finish(lastZonesRef.current),
    [finish],
  );

  return {
    isStarting,
    isSaving,
    isComplete,
    startError,
    saveError,
    start,
    persistZone,
    retryPendingZones,
    finish,
    retryFinish,
  };
}
