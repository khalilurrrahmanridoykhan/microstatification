import { MONTH_COLUMNS } from "@/lib/monthUtils";

export interface MonthAccessRow {
  id?: string | number | null;
  reporting_year: number;
  month: number;
  is_open: boolean;
  close_date?: string | null;
}

export interface MonthAccessEntry {
  id: string | null;
  reporting_year: number;
  month: number;
  is_open: boolean;
  close_date: string;
  is_currently_open: boolean;
}

export type MonthAccessLookup = Record<number, boolean>;

export const FULL_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const padDatePart = (value: number) => String(value).padStart(2, "0");

export const buildMonthStartDateString = (reportingYear: number, monthNumber: number) =>
  `${reportingYear}-${padDatePart(monthNumber)}-01`;

export const buildDefaultMonthCloseDateString = (reportingYear: number, monthNumber: number) =>
  new Date(Date.UTC(reportingYear, monthNumber, 0)).toISOString().slice(0, 10);

export const isMonthOpenForDate = (
  reportingYear: number,
  monthNumber: number,
  closeDate: string,
  todayDateString: string,
) => {
  const monthStart = buildMonthStartDateString(reportingYear, monthNumber);
  return todayDateString >= monthStart && todayDateString <= closeDate;
};

export const buildDefaultMonthAccessLookup = (
  reportingYear: number,
  todayDateString: string,
): MonthAccessLookup =>
  Object.fromEntries(
    MONTH_COLUMNS.map((_, index) => [
      index + 1,
      isMonthOpenForDate(
        reportingYear,
        index + 1,
        buildDefaultMonthCloseDateString(reportingYear, index + 1),
        todayDateString,
      ),
    ]),
  ) as MonthAccessLookup;

export const buildMonthAccessLookup = (
  rows: MonthAccessRow[],
  reportingYear: number,
  todayDateString: string,
): MonthAccessLookup => {
  const lookup = buildDefaultMonthAccessLookup(reportingYear, todayDateString);

  rows.forEach((row) => {
    const monthNumber = Number(row.month);
    if (monthNumber >= 1 && monthNumber <= MONTH_COLUMNS.length) {
      lookup[monthNumber] = isMonthOpenForDate(
        reportingYear,
        monthNumber,
        row.close_date || buildDefaultMonthCloseDateString(reportingYear, monthNumber),
        todayDateString,
      );
    }
  });

  return lookup;
};

export const buildMonthAccessEntries = (
  rows: MonthAccessRow[],
  reportingYear: number,
  todayDateString: string,
): MonthAccessEntry[] => {
  const byMonth = new Map<number, MonthAccessRow>();
  rows.forEach((row) => {
    const monthNumber = Number(row.month);
    if (monthNumber >= 1 && monthNumber <= MONTH_COLUMNS.length) {
      byMonth.set(monthNumber, row);
    }
  });

  return MONTH_COLUMNS.map((_, index) => {
    const monthNumber = index + 1;
    const existing = byMonth.get(monthNumber);

    return {
      id: existing?.id != null ? String(existing.id) : null,
      reporting_year: reportingYear,
      month: monthNumber,
      is_open: true,
      close_date:
        existing?.close_date || buildDefaultMonthCloseDateString(reportingYear, monthNumber),
      is_currently_open: isMonthOpenForDate(
        reportingYear,
        monthNumber,
        existing?.close_date || buildDefaultMonthCloseDateString(reportingYear, monthNumber),
        todayDateString,
      ),
    };
  });
};
