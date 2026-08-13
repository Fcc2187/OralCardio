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
