import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { BrushingSummaryCard } from "./BrushingSummaryCard";

describe("BrushingSummaryCard", () => {
  it("mantém uma variante ultracompacta para telas abaixo de 320 px", () => {
    const { container } = render(
      <MemoryRouter>
        <BrushingSummaryCard brushingsToday={0} streakDays={0} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Ainda não escovou").parentElement).toHaveClass(
      "max-w-[10.5rem]",
      "max-[319px]:max-w-none",
      "min-[360px]:max-w-[11.5rem]",
    );
    expect(container.querySelector('img[src="/images/home/brushing-hero.webp"]')).toHaveClass(
      "h-36",
      "max-[319px]:h-32",
    );
  });
});
