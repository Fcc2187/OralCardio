import type { BrushingZone } from "../types";
import { BRUSHING_ZONE_LABELS, BRUSHING_ZONE_ORDER } from "../brushingZones";

interface MouthQuadrantMapProps {
  currentZone: BrushingZone | null;
  completedZones: readonly BrushingZone[];
}

type ZoneState = "pending" | "current" | "completed";

const STATE_CLASSES: Record<ZoneState, string> = {
  pending: "fill-transparent stroke-white/80",
  current: "fill-primary/15 stroke-primary-action",
  completed: "fill-success/15 stroke-success",
};

const ZONE_MARKERS: ReadonlyArray<{ zone: BrushingZone; x: number; y: number }> = [
  { zone: "upper_right", x: 100, y: 109 },
  { zone: "upper_left", x: 220, y: 109 },
  { zone: "lower_right", x: 78, y: 363 },
  { zone: "lower_left", x: 242, y: 363 },
  { zone: "tongue", x: 160, y: 323 },
];

function stateFor(
  zone: BrushingZone,
  currentZone: BrushingZone | null,
  completedZones: readonly BrushingZone[],
): ZoneState {
  if (completedZones.includes(zone)) return "completed";
  if (currentZone === zone) return "current";
  return "pending";
}

function markerFor(state: ZoneState, index: number): string {
  if (state === "completed") return "✓";
  if (state === "current") return "●";
  return String(index + 1);
}

/** Diagrama não interativo. Direita/esquerda são sempre as do paciente:
 * por isso o lado direito da boca aparece à esquerda para quem olha a tela. */
export function MouthQuadrantMap({ currentZone, completedZones }: MouthQuadrantMapProps) {
  const states = Object.fromEntries(
    BRUSHING_ZONE_ORDER.map((zone) => [zone, stateFor(zone, currentZone, completedZones)]),
  ) as Record<BrushingZone, ZoneState>;

  const marker = (zone: BrushingZone) =>
    markerFor(states[zone], BRUSHING_ZONE_ORDER.indexOf(zone));

  return (
    <figure className="m-0 w-full max-w-[15rem]">
      <svg
        viewBox="0 0 320 480"
        role="img"
        aria-labelledby="mouth-map-title mouth-map-description"
        className="h-auto w-full drop-shadow-sm"
      >
        <title id="mouth-map-title">Mapa dos quadrantes da boca</title>
        <desc id="mouth-map-description">
          A boca está dividida em superior direito, superior esquerdo, inferior direito,
          inferior esquerdo e língua. O lado direito é o lado direito do paciente.
        </desc>

        <image
          href="/images/brushing-mouth.png"
          width="320"
          height="480"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        />

        <path
          data-zone="upper_right"
          d="M35 171C37 94 77 56 154 62L154 143C105 136 68 148 35 171Z"
          className={STATE_CLASSES[states.upper_right]}
          strokeWidth="5"
          strokeDasharray={states.upper_right === "pending" ? "8 8" : undefined}
        />
        <path
          data-zone="upper_left"
          d="M166 62C243 56 283 94 285 171C252 148 215 136 166 143Z"
          className={STATE_CLASSES[states.upper_left]}
          strokeWidth="5"
          strokeDasharray={states.upper_left === "pending" ? "8 8" : undefined}
        />
        <path
          data-zone="lower_right"
          d="M34 278C52 309 47 369 96 407C113 420 133 426 154 427L154 452C98 448 58 421 37 383C25 352 23 309 34 278Z"
          className={STATE_CLASSES[states.lower_right]}
          strokeWidth="5"
          strokeDasharray={states.lower_right === "pending" ? "8 8" : undefined}
        />
        <path
          data-zone="lower_left"
          d="M286 278C268 309 273 369 224 407C207 420 187 426 166 427L166 452C222 448 262 421 283 383C295 352 297 309 286 278Z"
          className={STATE_CLASSES[states.lower_left]}
          strokeWidth="5"
          strokeDasharray={states.lower_left === "pending" ? "8 8" : undefined}
        />
        <ellipse
          data-zone="tongue"
          cx="160"
          cy="323"
          rx="101"
          ry="91"
          className={STATE_CLASSES[states.tongue]}
          strokeWidth="5"
          strokeDasharray={states.tongue === "pending" ? "8 8" : undefined}
        />

        <g className="fill-body-strong font-body text-[18px] font-semibold" textAnchor="middle">
          {ZONE_MARKERS.map(({ zone, x, y }) => (
            <g key={zone}>
              <circle
                cx={x}
                cy={y}
                r="17"
                className="fill-surface-card/95 stroke-body-strong"
                strokeWidth="2"
              />
              <text x={x} y={Number(y) + 6}>
                {marker(zone)}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <figcaption className="sr-only" aria-live="polite">
        {currentZone
          ? `Região atual: ${BRUSHING_ZONE_LABELS[currentZone]}. ${completedZones.length} de 5 concluídas.`
          : "As cinco regiões foram concluídas."}
      </figcaption>
      <p className="mt-xs text-center font-body text-caption text-muted">
        Direita e esquerda consideram a sua perspectiva.
      </p>
    </figure>
  );
}
