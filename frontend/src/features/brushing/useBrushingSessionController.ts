import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";
import { createIdempotencyKey, HttpError } from "@/shared/api/httpClient";

import {
  completeBrushingSession,
  markZoneCompleted,
  startBrushingSession,
} from "./api/brushingApi";
import type { BrushingSession, BrushingZone } from "./types";

type PersistenceTask<T> = () => Promise<T>;
const RECOVERY_STORAGE_KEY = "oralcardio.brushing-recovery.v1";

function patientMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível salvar sua escovação.";
}

function readRecovery(userId: string | undefined): BrushingSession | null {
  if (!userId) return null;
  try {
    const raw = window.localStorage.getItem(RECOVERY_STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      typeof value !== "object" ||
      value === null ||
      !("id" in value) ||
      !("user_id" in value) ||
      !("zones_completed" in value) ||
      typeof value.id !== "string" ||
      value.user_id !== userId ||
      !Array.isArray(value.zones_completed)
    ) {
      window.localStorage.removeItem(RECOVERY_STORAGE_KEY);
      return null;
    }
    return value as BrushingSession;
  } catch {
    return null;
  }
}

function writeRecovery(session: BrushingSession | null): void {
  try {
    if (session) window.localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(RECOVERY_STORAGE_KEY);
  } catch {
    // Storage indisponível não pode impedir um hábito válido.
  }
}

function shouldReconcileZones(error: unknown): boolean {
  return error instanceof HttpError && error.status === 422;
}

export function useBrushingSessionController(userId?: string) {
  const queryClient = useQueryClient();
  const sessionIdRef = useRef<string | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const failedZonesRef = useRef(new Set<BrushingZone>());
  const lastZonesRef = useRef<readonly BrushingZone[]>([]);
  const startIdempotencyKeyRef = useRef<string | null>(null);

  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recoverableSession, setRecoverableSession] = useState<BrushingSession | null>(() =>
    readRecovery(userId),
  );

  useEffect(() => setRecoverableSession(readRecovery(userId)), [userId]);

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
      startIdempotencyKeyRef.current ??= createIdempotencyKey();
      const session = await startBrushingSession({ idempotencyKey: startIdempotencyKeyRef.current });
      startIdempotencyKeyRef.current = null;
      sessionIdRef.current = session.id;
      writeRecovery(session);
      setRecoverableSession(session);
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
        .then((session) => {
          failedZonesRef.current.delete(zone);
          writeRecovery(session);
          setRecoverableSession(session);
        })
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
        const session = await enqueue(() => markZoneCompleted(sessionId, zone));
        failedZonesRef.current.delete(zone);
        writeRecovery(session);
        setRecoverableSession(session);
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
          } catch (error) {
            if (!shouldReconcileZones(error)) throw error;
            for (const zone of zones) {
              await markZoneCompleted(sessionId, zone);
            }
            return completeBrushingSession(sessionId);
          }
        });
        failedZonesRef.current.clear();
        writeRecovery(null);
        setRecoverableSession(null);
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

  const resume = useCallback(() => {
    const session = readRecovery(userId);
    if (!session) return null;
    sessionIdRef.current = session.id;
    setRecoverableSession(session);
    return session;
  }, [userId]);

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
    recoverableSession,
    resume,
  };
}
