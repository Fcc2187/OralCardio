import { cn } from "@/shared/utils/cn";

import { checkPasswordRequirements } from "../authValidation";

interface PasswordRequirementsProps {
  password: string;
  id?: string;
  className?: string;
}
export function PasswordRequirements({
  password,
  id = "password-requirements",
  className,
}: PasswordRequirementsProps) {
  const status = checkPasswordRequirements(password);

  const requirements = [
    { label: "8+ caracteres", met: status.hasMinLength },
    { label: "Maiúscula e minúscula", met: status.hasUpperAndLower },
    { label: "Um número", met: status.hasNumber },
    { label: "Um caractere especial", met: status.hasSpecialChar },
  ];

  return (
    <div id={id} aria-live="polite" className={cn("flex flex-col gap-2 pt-1", className)}>
      <p className="font-body text-caption font-semibold text-body">
        Sua senha precisa ter:
      </p>
      <ul aria-label="Requisitos da senha" className="flex flex-col gap-1.5">
        {requirements.map(({ label, met }) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2.5 font-body text-caption transition-colors duration-150",
              met ? "text-body font-medium" : "text-muted",
            )}
          >
            {met ? (
              <span
                className="flex size-4 shrink-0 items-center justify-center rounded-full border border-success text-success"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="size-2.5 fill-none stroke-current stroke-[2.5]"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3.5 8.5 6.5 11.5 12.5 5" />
                </svg>
              </span>
            ) : (
              <span
                className="size-4 shrink-0 rounded-full border border-muted-soft/80"
                aria-hidden="true"
              />
            )}
            <span>{label}</span>
            <span className="sr-only">{met ? "(atendido)" : "(não atendido)"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-0.5 font-body text-[0.8125rem] text-muted leading-tight">
        Senhas muito comuns não são aceitas.
      </p>
    </div>
  );
}
