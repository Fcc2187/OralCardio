import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ModuleCompletionToast } from "./ModuleCompletionToast";

describe("ModuleCompletionToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza o toast com atributos de acessibilidade para leitor de tela", () => {
    render(<ModuleCompletionToast isVisible={true} onDismiss={vi.fn()} />);

    const toast = screen.getByRole("status");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Vídeo concluído — módulo concluído!")).toBeInTheDocument();
  });

  it("chama onDismiss ao clicar no botão fechar", () => {
    const onDismiss = vi.fn();
    render(<ModuleCompletionToast isVisible={true} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: /Fechar notificação/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("chama onDismiss automaticamente após 5 segundos", () => {
    const onDismiss = vi.fn();
    render(<ModuleCompletionToast isVisible={true} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
