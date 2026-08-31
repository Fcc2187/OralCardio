import { useCallback, useEffect, useRef } from "react";

/** Acumula apenas o tempo em que o módulo está carregado e visível ao paciente. */
export function useVisibleReadingTime(isReading: boolean, resetKey: string): () => number {
  const elapsedMsRef = useRef(0);
  const visibleSinceRef = useRef<number | null>(null);

  useEffect(() => {
    elapsedMsRef.current = 0;
    visibleSinceRef.current = null;
    if (!isReading) return undefined;

    const begin = () => {
      if (document.visibilityState === "visible" && visibleSinceRef.current === null) {
        visibleSinceRef.current = performance.now();
      }
    };
    const pause = () => {
      if (visibleSinceRef.current !== null) {
        elapsedMsRef.current += performance.now() - visibleSinceRef.current;
        visibleSinceRef.current = null;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") begin();
      else pause();
    };

    begin();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      pause();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isReading, resetKey]);

  return useCallback(() => {
    const activeMs = visibleSinceRef.current === null ? 0 : performance.now() - visibleSinceRef.current;
    return Math.max(1, Math.round((elapsedMsRef.current + activeMs) / 1000));
  }, []);
}
