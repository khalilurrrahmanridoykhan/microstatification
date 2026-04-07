export const MONTH_COLUMNS = [
  "jan_cases", "feb_cases", "mar_cases", "apr_cases",
  "may_cases", "jun_cases", "jul_cases", "aug_cases",
  "sep_cases", "oct_cases", "nov_cases", "dec_cases",
] as const;

export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

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

export function getMonthTotal(record: Record<string, any>): number {
  return MONTH_COLUMNS.reduce((sum, col) => sum + (Number(record[col]) || 0), 0);
}
