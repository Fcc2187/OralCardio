import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrushingMetricsHeader } from "./BrushingMetricsHeader";

describe("BrushingMetricsHeader", () => {
  it("renderiza o tempo total e a contagem de regiões completadas", () => {
    render(<BrushingMetricsHeader completedCount={2} totalZones={5} totalDuration="2:00" />);

    expect(screen.getByText("2:00")).toBeInTheDocument();
    expect(screen.getByText("Tempo total")).toBeInTheDocument();
    expect(screen.getByText("2/5")).toBeInTheDocument();
    expect(screen.getByText("Regiões")).toBeInTheDocument();
  });
});
