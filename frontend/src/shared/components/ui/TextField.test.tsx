import { render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";

import { TextField } from "./TextField";

type EnhancedTextFieldProps = ComponentProps<typeof TextField> & {
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
};

const EnhancedTextField = TextField as unknown as (props: EnhancedTextFieldProps) => ReactNode;

describe("TextField", () => {
  it("keeps the password hint associated when validation also reports an error", () => {
    render(
      <TextField
        id="password"
        label="Senha"
        hint="Mínimo de 6 caracteres"
        error="A senha precisa ter pelo menos 6 caracteres."
      />,
    );

    const input = screen.getByLabelText("Senha");

    expect(input).toHaveAttribute("aria-describedby", "password-hint password-error");
    expect(screen.getByText("Mínimo de 6 caracteres")).toBeInTheDocument();
    expect(screen.getByText("A senha precisa ter pelo menos 6 caracteres.")).toBeInTheDocument();
  });

  it("renders an accessible trailing action inside the field", () => {
    render(
      <EnhancedTextField
        label="Senha"
        type="password"
        trailingAction={<button type="button" aria-label="Mostrar senha">Mostrar</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Mostrar senha" })).toBeInTheDocument();
  });
});
