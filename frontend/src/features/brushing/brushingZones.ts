import type { BrushingZone } from "./types";

export const BRUSHING_ZONE_ORDER: readonly BrushingZone[] = [
  "upper_right",
  "upper_left",
  "lower_right",
  "lower_left",
  "tongue",
];

export const BRUSHING_ZONE_LABELS: Record<BrushingZone, string> = {
  upper_right: "Superior direito",
  upper_left: "Superior esquerdo",
  lower_right: "Inferior direito",
  lower_left: "Inferior esquerdo",
  tongue: "Língua",
};

export const SECONDS_PER_ZONE = 24;
export const TOTAL_BRUSHING_SECONDS = BRUSHING_ZONE_ORDER.length * SECONDS_PER_ZONE;

export const BRUSHING_ZONE_TIPS: Record<BrushingZone, string> = {
  upper_right: "Movimentos suaves e circulares",
  upper_left: "Movimentos suaves e circulares",
  lower_right: "Varra suavemente da gengiva para a ponta",
  lower_left: "Varra suavemente da gengiva para a ponta",
  tongue: "Escove suavemente de trás para a frente",
};
