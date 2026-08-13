import type { ComponentProps } from "react";
import { Link } from "react-router-dom";

import { buildButtonClasses, type ButtonVariant } from "./buttonStyles";

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

/** Link com aparência de botão. Existe porque `<Link><Button/></Link>`
 * renderiza `<a><button></a>` — HTML inválido que faz leitor de tela
 * anunciar link e botão aninhados, e o foco de teclado parar nos dois. */
export function LinkButton({
  variant = "primary",
  fullWidth = true,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link className={buildButtonClasses({ variant, fullWidth, className })} {...rest}>
      {children}
    </Link>
  );
}
