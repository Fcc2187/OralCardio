import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BRUSHING_ZONE_ORDER } from "./brushingZones";
import { useBrushingSessionController } from "./useBrushingSessionController";

const api = vi.hoisted(() => ({
  start: vi.fn(),
  mark: vi.fn(),
  complete: vi.fn(),
}));

vi.mock("./api/brushingApi", () => ({
  startBrushingSession: api.start,
  markZoneCompleted: api.mark,
  completeBrushingSession: api.complete,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  api.start.mockResolvedValue({ id: "session-1" });
  api.mark.mockResolvedValue({ id: "session-1" });
  api.complete.mockResolvedValue({ id: "session-1", is_completed: true });
});

describe("useBrushingSessionController", () => {
  it("inicia a sessão e libera a persistência das zonas", async () => {
    const { result } = renderHook(useBrushingSessionController, { wrapper });
    await act(() => result.current.start());
    act(() => result.current.persistZone("upper_right"));

    await waitFor(() => expect(api.mark).toHaveBeenCalledWith("session-1", "upper_right"));
  });

  it("serializa as atualizações na ordem recebida", async () => {
    const { result } = renderHook(useBrushingSessionController, { wrapper });
    await act(() => result.current.start());
    act(() => {
      result.current.persistZone("upper_right");
      result.current.persistZone("upper_left");
    });

    await waitFor(() => expect(api.mark).toHaveBeenCalledTimes(2));
    expect(api.mark.mock.calls.map((call) => call[1])).toEqual(["upper_right", "upper_left"]);
  });

  it("conclui diretamente quando todas as zonas já foram salvas", async () => {
    const { result } = renderHook(useBrushingSessionController, { wrapper });
    await act(() => result.current.start());
    await act(() => result.current.finish(BRUSHING_ZONE_ORDER));

    expect(api.complete).toHaveBeenCalledTimes(1);
    expect(result.current.isComplete).toBe(true);
  });

  it("reconcilia todas as zonas quando a primeira conclusão falha", async () => {
    api.complete.mockRejectedValueOnce(new Error("zonas ausentes"));
    const { result } = renderHook(useBrushingSessionController, { wrapper });
    await act(() => result.current.start());
    await act(() => result.current.finish(BRUSHING_ZONE_ORDER));

    expect(api.mark.mock.calls.map((call) => call[1])).toEqual(BRUSHING_ZONE_ORDER);
    expect(api.complete).toHaveBeenCalledTimes(2);
    expect(result.current.isComplete).toBe(true);
  });
});
