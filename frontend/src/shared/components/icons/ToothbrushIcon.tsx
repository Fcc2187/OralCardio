import type { SVGProps } from "react";

export function ToothbrushIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Cabo longo anatômico */}
      <path d="m4 20 8.5-8.5" />
      <path d="M3 19a1.41 1.41 0 0 0 2 2l8.5-8.5" />

      {/* Dorso e cabeça plástica */}
      <path d="M13.5 12.5 19.5 6.5a1.5 1.5 0 0 0 0-2.1l-.9-.9a1.5 1.5 0 0 0-2.1 0L11 9" />

      {/* Cerdas da escova */}
      <path d="m11.5 7.5 2 2" />
      <path d="m13 6 2 2" />
      <path d="m14.5 4.5 2 2" />
      <path d="m16 3 2 2" />

      {/* Pasta de dente curvada no topo com a crista/ondinha característica */}
      <path d="M9.5 8.5C8.3 7.3 9 5.5 11 4.5c1.8-1 2.8-2.8 3.8-2.3.6.8 0 2.2-1 3.3" />
    </svg>
  );
}
