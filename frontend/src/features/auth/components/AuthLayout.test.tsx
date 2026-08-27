import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { AuthLayout } from "./AuthLayout";

describe("AuthLayout", () => {
  it("renders the sign-up back link and the supplied illustration", () => {
    render(
      <MemoryRouter>
        <AuthLayout mode="sign-up" title="Criar conta" subtitle="Comece hoje" footer={null}>
          <button type="button">Criar conta</button>
        </AuthLayout>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Voltar/ })).toHaveAttribute("href", "/entrar");
    expect(screen.getByRole("img", { name: "OralCardio" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Criar conta" })).toBeInTheDocument();
  });
});
