import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AchievementReveal } from "@/shared/types/gamification";

import { useAchievementUnlockToasts } from "./useAchievementUnlockToasts";

const FIRST: AchievementReveal = {
  id: "first",
  name: "Primeira",
  description: "Descrição",
  icon: "🏆",
  points_reward: 10,
};
const SECOND = { ...FIRST, id: "second", name: "Segunda" };

afterEach(() => vi.useRealTimers());

describe("useAchievementUnlockToasts", () => {
  it("mantém a fila vazia quando não há revelações", () => {
    const { result } = renderHook(() => useAchievementUnlockToasts(vi.fn()));
    act(() => result.current.announce([]));
    expect(result.current.toasts).toEqual([]);
  });

  it("mostra apenas a primeira conquista da fila", () => {
    const { result } = renderHook(() => useAchievementUnlockToasts(vi.fn()));
    act(() => result.current.announce([FIRST, SECOND]));
    expect(result.current.toasts.map((toast) => toast.achievement.id)).toEqual(["first"]);
  });

  it("avança a fila e confirma a conquista dispensada", () => {
    const dismissed = vi.fn();
    const { result } = renderHook(() => useAchievementUnlockToasts(dismissed));
    act(() => result.current.announce([FIRST, SECOND]));
    act(() => result.current.dismiss(result.current.toasts[0].toastId));

    expect(dismissed).toHaveBeenCalledWith(FIRST);
    expect(result.current.toasts[0].achievement).toEqual(SECOND);
  });

  it("dispensa automaticamente somente a conquista ativa", () => {
    vi.useFakeTimers();
    const dismissed = vi.fn();
    const { result } = renderHook(() => useAchievementUnlockToasts(dismissed));
    act(() => result.current.announce([FIRST, SECOND]));
    act(() => vi.advanceTimersByTime(6_000));

    expect(dismissed).toHaveBeenCalledTimes(1);
    expect(result.current.toasts[0].achievement).toEqual(SECOND);
  });
});
