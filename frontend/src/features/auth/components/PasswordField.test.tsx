import { fireEvent, render, screen } from "@testing-library/react";

import { PasswordField } from "./PasswordField";

describe("PasswordField", () => {
  it("toggles the password visibility with an accessible control", () => {
    render(<PasswordField label="Senha" value="segredo" onChange={() => undefined} />);

    const input = screen.getByLabelText("Senha");
    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));

    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar senha" })).toBeInTheDocument();
  });
});
