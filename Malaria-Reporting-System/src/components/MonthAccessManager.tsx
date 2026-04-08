import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Lock, Unlock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getDhakaDateString, getDhakaMonth, getDhakaYear } from "@/lib/monthUtils";
import {
  buildDefaultMonthCloseDateString,
  buildMonthAccessEntries,
  FULL_MONTH_NAMES,
  isMonthOpenForDate,
  type MonthAccessEntry,
  type MonthAccessRow,
} from "@/lib/monthAccess";

const MonthAccessManager = () => {
  const { toast } = useToast();
  const currentYear = getDhakaYear();
  const currentMonth = getDhakaMonth();
  const todayDateString = getDhakaDateString();

  const [year, setYear] = useState(currentYear);
  const [entries, setEntries] = useState<MonthAccessEntry[]>(() =>
    buildMonthAccessEntries([], currentYear, todayDateString),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("month_access_settings")
        .select("id,reporting_year,month,is_open,close_date")
        .eq("reporting_year", year)
        .order("month");

      if (error) throw error;

      setEntries(
        buildMonthAccessEntries(
          ((data || []) as MonthAccessRow[]),
          year,
          todayDateString,
        ),
      );
      setDirty(false);
    } catch (err: any) {
      toast({
        title: "Month access load error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, todayDateString, year]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const years = Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);
  const openCount = useMemo(
    () => entries.filter((entry) => entry.is_currently_open).length,
    [entries],
  );

  const handleCloseDateChange = (month: number, closeDate: string) => {
    const nextCloseDate = closeDate || buildDefaultMonthCloseDateString(year, month);
    setEntries((prev) =>
      prev.map((entry) =>
        entry.month === month
          ? {
              ...entry,
              close_date: nextCloseDate,
              is_currently_open: isMonthOpenForDate(
                year,
                month,
                nextCloseDate,
                todayDateString,
              ),
            }
          : entry,
      ),
    );
    setDirty(true);
  };

  const handleCloseDateBlur = (month: number, closeDate: string) => {
    const nextCloseDate = closeDate || buildDefaultMonthCloseDateString(year, month);
    setSaving(true);
    void supabase
      .from("month_access_settings")
      .upsert({
        reporting_year: year,
        month,
        is_open: true,
        close_date: nextCloseDate,
      })
      .then(async (result) => {
        if (result.error) {
          throw result.error;
        }
        toast({ title: "Month access updated" });
        setDirty(false);
        await loadEntries();
      })
      .catch((err: any) => {
        toast({
          title: "Month access save error",
          description: err.message,
          variant: "destructive",
        });
        setDirty(true);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const results = await Promise.all(
        entries.map((entry) =>
          supabase.from("month_access_settings").upsert({
            reporting_year: year,
            month: entry.month,
            is_open: true,
            close_date: entry.close_date,
          }),
        ),
      );

      const failed = results.find((result) => result.error);
      if (failed?.error) {
        throw failed.error;
      }

      toast({ title: "Month access saved" });
      await loadEntries();
    } catch (err: any) {
      toast({
        title: "Month access save error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => void loadEntries()}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload
          </Button>

          <Button
            size="sm"
            className="h-9"
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
            {openCount} open
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
            {entries.length - openCount} closed
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-xs text-muted-foreground">
        By default, each month stays open until the end of that month. Admin can extend or shorten the close date here for all `SK/SHW` users in both Local and Non-Local tables. Changes save after you leave the date field, and admin users can still edit all months.
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry, index) => {
          const monthName = FULL_MONTH_NAMES[index] || `Month ${entry.month}`;
          const isCurrentMonth = year === currentYear && entry.month === currentMonth;

          return (
            <div
              key={entry.month}
              className="rounded-[1.35rem] border border-border/70 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{monthName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isCurrentMonth
                      ? "Current month stays open until the selected close date."
                      : "This month opens on its first day and closes on the selected date."}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    entry.is_currently_open
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {entry.is_currently_open ? (
                    <Unlock className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  {entry.is_currently_open ? "Open now" : "Closed now"}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-border/60 px-3 py-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Close on</p>
                  <p className="text-[11px] text-muted-foreground">
                    Default closes on {buildDefaultMonthCloseDateString(year, entry.month)}. Set a later date to keep this month open after month end.
                  </p>
                </div>
                <input
                  type="date"
                  value={entry.close_date}
                  onChange={(event) => handleCloseDateChange(entry.month, event.target.value)}
                  onBlur={(event) => handleCloseDateBlur(entry.month, event.target.value)}
                  disabled={loading || saving}
                  className="mt-3 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthAccessManager;
