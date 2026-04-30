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
    return 26;
  }
  if (typeof document === "undefined") {
    return 26;
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return 26;
  }
  context.font = MONTH_HEADER_FONT;
  let maxChar = 0;
  for (const ch of monthLabel) {
    maxChar = Math.max(maxChar, context.measureText(ch).width);
  }
  return Math.ceil(Math.max(maxChar + 12, 26));
}

/** Min width when that month column shows value + A/R (admin + pending). */
export function estimateMonthColumnWithActionsWidth(monthLabel: string): number {
  const verticalHeader = estimateVerticalMonthHeaderWidth(monthLabel);
  const twoButtons = 16 + 16 + 2 + 4;
  const narrowInput = 26;
  return Math.max(verticalHeader, twoButtons + narrowInput);
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
