export const MONTH_COLUMNS = [
  "jan_cases", "feb_cases", "mar_cases", "apr_cases",
  "may_cases", "jun_cases", "jul_cases", "aug_cases",
  "sep_cases", "oct_cases", "nov_cases", "dec_cases",
] as const;

export type MonthColumn = (typeof MONTH_COLUMNS)[number];

export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_HEADER_FONT = "600 9px Inter, ui-sans-serif, system-ui, sans-serif";

/** Horizontal width for a vertical month header (writing-mode vertical-rl ≈ one glyph advance + padding). */
export function estimateVerticalMonthHeaderWidth(monthLabel: string): number {
  if (!monthLabel) {
    return 30;
  }
  if (typeof document === "undefined") {
    return 30;
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return 30;
  }
  context.font = MONTH_HEADER_FONT;
  let maxChar = 0;
  for (const ch of monthLabel) {
    maxChar = Math.max(maxChar, context.measureText(ch).width);
  }
  return Math.ceil(Math.max(maxChar + 14, 30));
}

/** One width for every month col (Jan…Dec): matches the widest vertical header so columns stay even like Jun/Jul. */
export function getUniformMonthColumnWidth(): number {
  let w = 30;
  for (const label of MONTH_LABELS) {
    w = Math.max(w, estimateVerticalMonthHeaderWidth(label));
  }
  return w;
}

/** Width for a month col when admin has ≥1 pending A/R in that month (value + A/R on one row, no ellipsis). */
export function estimateMonthColumnWithActionsWidth(monthLabel: string): number {
  const verticalHeader = estimateVerticalMonthHeaderWidth(monthLabel);
  // Two 16px buttons + small gap + short number field + cell padding in one row under table-fixed.
  const floorViablePendingPx = 94;
  return Math.max(verticalHeader, floorViablePendingPx);
}

export function getDhakaMonth(): number {
  const now = new Date();
  const dhaka = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    month: "numeric",
  }).format(now);
  return parseInt(dhaka, 10);
}

export function getDhakaYear(): number {
  const now = new Date();
  const dhaka = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
  }).format(now);
  return parseInt(dhaka, 10);
}

export function getMonthTotal(record: Partial<Record<MonthColumn, number>>): number {
  return MONTH_COLUMNS.reduce((sum, col) => sum + (Number(record[col]) || 0), 0);
}
