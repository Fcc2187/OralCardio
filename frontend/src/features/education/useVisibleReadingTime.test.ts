import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useVisibleReadingTime } from "./useVisibleReadingTime";

const useReadingTimeForSlug = useVisibleReadingTime as unknown as (
  isReading: boolean,
  slug: string,
) => () => number;

describe("useVisibleReadingTime", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reinicia o tempo acumulado ao trocar de módulo", () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);

    const { result, rerender } = renderHook(
      ({ slug }) => useReadingTimeForSlug(true, slug),
      { initialProps: { slug: "conexao-boca-coracao" } },
    );

    now = 4_000;
    expect(result.current()).toBe(4);

    rerender({ slug: "o-que-e-bacteremia" });
    now = 5_000;
    expect(result.current()).toBe(1);
  });
});
