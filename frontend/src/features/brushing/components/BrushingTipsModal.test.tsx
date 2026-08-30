import { fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { BrushingTipsModal } from "./BrushingTipsModal";

function ModalHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setIsOpen(true)}>
        Abrir dicas
      </button>
      <BrushingTipsModal isOpen={isOpen} onClose={() => setIsOpen(false)} triggerRef={triggerRef} />
    </>
  );
}

describe("BrushingTipsModal", () => {
  it("renderiza o modal quando isOpen é true e fecha com Escape", () => {
    const onClose = vi.fn();
    render(<BrushingTipsModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "Dicas de Escovação" })).toBeInTheDocument();
    expect(screen.getByText("Ângulo de 45º")).toBeInTheDocument();
    expect(screen.getByText("Movimentos Suaves")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("chama onClose ao clicar no botão Fechar ou Entendi", () => {
    const onClose = vi.fn();
    render(<BrushingTipsModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("mantém o foco no modal e o devolve ao botão que o abriu", () => {
    render(<ModalHarness />);

    const trigger = screen.getByRole("button", { name: "Abrir dicas" });
    fireEvent.click(trigger);

    const closeButton = screen.getByRole("button", { name: "Fechar" });
    const confirmButton = screen.getByRole("button", { name: "Entendi" });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(closeButton, { key: "Tab", shiftKey: true });
    expect(confirmButton).toHaveFocus();

    fireEvent.keyDown(confirmButton, { key: "Tab" });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveFocus();
  });

  it("não renderiza nada quando isOpen é false", () => {
    render(<BrushingTipsModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
