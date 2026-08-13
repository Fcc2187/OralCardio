export const FIELD_WRAPPER = "flex w-full flex-col gap-xs";

export const FIELD_LABEL = "font-body text-body-sm font-medium text-body-strong";

const FIELD_INPUT_BASE =
  "rounded-md border border-hairline bg-canvas px-md py-sm font-body text-body-md text-ink outline-none focus-visible:border-primary-action focus-visible:ring-[3px] focus-visible:ring-primary-action/15 disabled:cursor-not-allowed disabled:opacity-60";

export const FIELD_INPUT = `min-h-tap-target-min ${FIELD_INPUT_BASE}`;

export const FIELD_TEXTAREA = `min-h-24 resize-y ${FIELD_INPUT_BASE}`;

export const FIELD_INPUT_ERROR = "border-error";

export const FIELD_ERROR_MESSAGE = "text-body-sm text-error";

export const FIELD_HINT = "text-body-sm text-muted";
