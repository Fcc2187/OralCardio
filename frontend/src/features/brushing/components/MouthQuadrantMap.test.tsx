import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MouthQuadrantMap } from "./MouthQuadrantMap";

describe("MouthQuadrantMap", () => {
  it("descreve as cinco regiões para tecnologia assistiva", () => {
    render(<MouthQuadrantMap currentZone="upper_right" completedZones={[]} />);

    expect(screen.getByRole("img", { name: /mapa dos quadrantes/i })).toBeInTheDocument();
    expect(screen.getByText(/região atual: Superior direito/i)).toBeInTheDocument();
    expect(document.querySelector("image")).toHaveAttribute(
      "href",
      "/images/brushing-mouth.png",
    );
  });

  it("destaca o quadrante atual", () => {
    const { container } = render(
      <MouthQuadrantMap currentZone="upper_right" completedZones={[]} />,
    );

    expect(container.querySelector('[data-zone="upper_right"]')).toHaveClass("stroke-primary-action");
  });

  it("marca quadrantes concluídos com estado de sucesso", () => {
    const { container } = render(
      <MouthQuadrantMap currentZone="upper_left" completedZones={["upper_right"]} />,
    );

    expect(container.querySelector('[data-zone="upper_right"]')).toHaveClass("stroke-success");
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("renderiza a língua como a quinta região", () => {
    const { container } = render(<MouthQuadrantMap currentZone="tongue" completedZones={[]} />);

    expect(container.querySelector('[data-zone="tongue"]')).toHaveClass("stroke-primary-action");
    expect(screen.getByText(/região atual: Língua/i)).toBeInTheDocument();
  });

  it("informa quando todas as regiões terminaram", () => {
    render(
      <MouthQuadrantMap
        currentZone={null}
        completedZones={["upper_right", "upper_left", "lower_right", "lower_left", "tongue"]}
      />,
    );

    expect(screen.getByText("As cinco regiões foram concluídas.")).toBeInTheDocument();
  });
});
