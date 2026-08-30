import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SECONDS_PER_ZONE } from "./brushingZones";
import { useBrushingTimer } from "./useBrushingTimer";

function advanceSeconds(seconds: number) {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000);
  });
}

describe("useBrushingTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle on the first zone without ticking", () => {
    const { result } = renderHook(() => useBrushingTimer());

    expect(result.current.status).toBe("idle");
    expect(result.current.currentZone).toBe("upper_right");
    expect(result.current.secondsElapsedInZone).toBe(0);
  });

  it("advances to the next zone and reports completion after each zone's duration", () => {
    const onZoneComplete = vi.fn();
    const { result } = renderHook(() => useBrushingTimer({ onZoneComplete }));

    act(() => result.current.start());
    advanceSeconds(SECONDS_PER_ZONE);

    expect(onZoneComplete).toHaveBeenCalledOnce();
    expect(onZoneComplete).toHaveBeenCalledWith("upper_right");
    expect(result.current.currentZone).toBe("upper_left");
    expect(result.current.completedZones).toEqual(["upper_right"]);
    expect(result.current.secondsElapsedInZone).toBe(0);
  });

  it("finishes only after all five zones are completed, in order", () => {
    const onZoneComplete = vi.fn();
    const onAllZonesComplete = vi.fn();
    const { result } = renderHook(() =>
      useBrushingTimer({ onZoneComplete, onAllZonesComplete }),
    );

    act(() => result.current.start());

    // Avança zona por zona (como o setInterval real faria, um tick de cada
    // vez) em vez de um único salto de 4 zonas: com fake timers, várias
    // travessias de fronteira dentro do mesmo `advanceTimersByTime` colapsam
    // num único flush de render do React, o que não reflete o comportamento
    // real (cada tick de 1s é sempre um macrotask separado no browser).
    for (let zonesCompleted = 0; zonesCompleted < 4; zonesCompleted += 1) {
      advanceSeconds(SECONDS_PER_ZONE);
    }
    expect(result.current.status).toBe("running");
    expect(onAllZonesComplete).not.toHaveBeenCalled();

    advanceSeconds(SECONDS_PER_ZONE);
    expect(result.current.status).toBe("finished");
    expect(result.current.currentZone).toBeNull();
    expect(onAllZonesComplete).toHaveBeenCalledOnce();
    expect(onZoneComplete.mock.calls.map(([zone]) => zone)).toEqual([
      "upper_right",
      "upper_left",
      "lower_right",
      "lower_left",
      "tongue",
    ]);
  });

  it("stops advancing while paused and resumes from where it left off", () => {
    const onZoneComplete = vi.fn();
    const { result } = renderHook(() => useBrushingTimer({ onZoneComplete }));

    act(() => result.current.start());
    advanceSeconds(10);
    act(() => result.current.pause());
    advanceSeconds(SECONDS_PER_ZONE);

    expect(result.current.status).toBe("paused");
    expect(result.current.secondsElapsedInZone).toBe(10);
    expect(onZoneComplete).not.toHaveBeenCalled();

    act(() => result.current.resume());
    advanceSeconds(SECONDS_PER_ZONE - 10);

    expect(onZoneComplete).toHaveBeenCalledOnce();
    expect(onZoneComplete).toHaveBeenCalledWith("upper_right");
    expect(result.current.currentZone).toBe("upper_left");
  });

  it("calcula corretamente a formatação mm:ss, tempo decorrido e percentual contínuo", () => {
    const { result } = renderHook(() => useBrushingTimer());

    expect(result.current.formattedSecondsRemainingInZone).toBe("0:24");
    expect(result.current.totalElapsedSeconds).toBe(0);
    expect(result.current.progressPercent).toBe(0);

    act(() => result.current.start());
    advanceSeconds(12);

    expect(result.current.formattedSecondsRemainingInZone).toBe("0:12");
    expect(result.current.totalElapsedSeconds).toBe(12);
    expect(result.current.progressPercent).toBe(10); // 12 / 120 = 10%

    advanceSeconds(12); // completa zona 1 (24s)
    expect(result.current.formattedSecondsRemainingInZone).toBe("0:24");
    expect(result.current.totalElapsedSeconds).toBe(24);
    expect(result.current.progressPercent).toBe(20); // 24 / 120 = 20%
  });
});
