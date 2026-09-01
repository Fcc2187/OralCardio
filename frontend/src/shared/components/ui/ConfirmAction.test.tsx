import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmAction } from "./ConfirmAction";

describe("ConfirmAction", () => {
  it("move o foco para a confirmação visível", async () => {
    render(
      <ConfirmAction
        label="Cancelar consulta"
        question="Tem certeza?"
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar consulta" }));

    const confirmButton = screen.getByRole("button", { name: "Sim" });
    await waitFor(() => expect(document.activeElement).toBe(confirmButton));
  });
});
