import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FlossingCard } from "./FlossingCard";

const logFlossing = vi.hoisted(() => vi.fn());
vi.mock("../api/flossingApi", () => ({ logFlossing }));

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  logFlossing.mockResolvedValue({ id: "log-1" });
});

describe("FlossingCard", () => {
  it("mantém o registro disponível depois de um uso anterior", () => {
    render(<FlossingCard flossingsToday={2} />, { wrapper });
    expect(screen.getByText("2 usos de fio dental hoje ✓")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar novamente" })).toBeEnabled();
  });

  it("incrementa a contagem local a cada novo registro", async () => {
    render(<FlossingCard flossingsToday={0} />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: "Registrar uso" }));
    await waitFor(() => expect(screen.getByText("1 uso de fio dental hoje ✓")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Registrar novamente" }));
    await waitFor(() => expect(screen.getByText("2 usos de fio dental hoje ✓")).toBeInTheDocument());
    expect(logFlossing).toHaveBeenCalledTimes(2);
  });

  it("recupera valores inválidos vindos de um cache antigo", () => {
    render(<FlossingCard flossingsToday={Number.NaN} />, { wrapper });

    expect(screen.getByText("Já usou fio dental hoje?")).toBeInTheDocument();
    expect(screen.queryByText(/NaN|undefined/)).not.toBeInTheDocument();
  });
});
