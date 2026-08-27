export const FIELD_WRAPPER = "flex w-full flex-col gap-1.5";

export const FIELD_LABEL = "font-body text-body-sm font-medium text-body-strong";

export const FIELD_CONTROL = "relative flex items-center";

export const FIELD_LEADING_ICON =
  "pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-primary-action";

export const FIELD_TRAILING_ACTION = "absolute inset-y-0 right-1 flex items-center";

const FIELD_INPUT_BASE =
  "h-11 rounded-lg border border-hairline bg-white px-3.5 font-body text-body-sm text-ink placeholder:text-[#9C948D] outline-none transition-colors focus-visible:border-primary-action focus-visible:ring-2 focus-visible:ring-primary-action/20 disabled:cursor-not-allowed disabled:opacity-60";

export const FIELD_INPUT = `w-full ${FIELD_INPUT_BASE}`;

export const FIELD_INPUT_WITH_LEADING_ICON = "pl-10";

export const FIELD_INPUT_WITH_TRAILING_ACTION = "pr-10";

export const FIELD_TEXTAREA = `min-h-24 resize-y py-2.5 ${FIELD_INPUT_BASE}`;

export const FIELD_INPUT_ERROR = "border-error focus-visible:border-error focus-visible:ring-error/20";

export const FIELD_ERROR_MESSAGE = "text-body-sm text-error";

export const FIELD_HINT = "text-body-sm text-muted";
