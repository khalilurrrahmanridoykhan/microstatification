import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MONTH_COLUMNS,
  MONTH_LABELS,
  type MonthColumn,
  getDhakaMonth,
  getDhakaYear,
  getMonthTotal,
} from "@/lib/monthUtils";
import { RefreshCw, Save } from "lucide-react";
import {
  fetchLocalRecords,
  updateLocalRecord,
  type LocalRecord,
  type LocalRecordUpdate,
} from "@/lib/api";

type CellStatus = "RED" | "YELLOW" | "GREEN";
type LocalEditableField = keyof LocalRecordUpdate;

const itnColumns = ["itn_2023", "itn_2024", "itn_2025"] as const;

function buildUpdatePayload(row: LocalRecord): LocalRecordUpdate {
  return {
    hh: row.hh,
    population: row.population,
    itn_2023: row.itn_2023,
    itn_2024: row.itn_2024,
    itn_2025: row.itn_2025,
    jan_cases: row.jan_cases,
    feb_cases: row.feb_cases,
    mar_cases: row.mar_cases,
    apr_cases: row.apr_cases,
    may_cases: row.may_cases,
    jun_cases: row.jun_cases,
    jul_cases: row.jul_cases,
    aug_cases: row.aug_cases,
    sep_cases: row.sep_cases,
    oct_cases: row.oct_cases,
    nov_cases: row.nov_cases,
    dec_cases: row.dec_cases,
  };
}

const LocalRecordsGrid = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "admin";
  const currentMonth = getDhakaMonth(); // 1..12
  const currentYear = getDhakaYear();

  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<LocalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  // ---- Color logic (no DB changes) ----
  // RED: value = 0
  // YELLOW: value > 0 AND (current month + current year) AND non-admin
  // GREEN: value > 0 otherwise
  const getMonthStatus = (value: number, monthIndex: number): CellStatus => {
    if (!value || value === 0) return "RED";
    const monthNumber = monthIndex + 1;

    if (!isAdmin && year === currentYear && monthNumber === currentMonth) {
      return "YELLOW";
    }
    return "GREEN";
  };

  const getMonthBg = (status: CellStatus) => {
    // subtle but clear
    switch (status) {
      case "GREEN":
        return "bg-green-50 border-green-200";
      case "YELLOW":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-red-50 border-red-200";
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchLocalRecords(year);
      setRows(isAdmin ? data : data.filter((row) => row.sk_user_id === user.id));
      setDirtyIds(new Set());
    } catch (error) {
      toast({
        title: "Load error",
        description: error instanceof Error ? error.message : "Failed to load records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, year, isAdmin, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleCellChange = (rowId: string, field: LocalEditableField, value: string) => {
    const num = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: num } : r)));
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(rowId);
      return next;
    });
  };

  const handleSave = async () => {
    if (dirtyIds.size === 0) return;
    setSaving(true);
    try {
      const dirty = rows.filter((r) => dirtyIds.has(r.id));

      for (const r of dirty) {
        await updateLocalRecord(r.id, buildUpdatePayload(r));
      }

      setDirtyIds(new Set());
      toast({ title: "Saved successfully" });
    } catch (error) {
      toast({
        title: "Save error",
        description: error instanceof Error ? error.message : "Failed to save records.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isMonthEditable = (monthIndex: number) => {
    if (isAdmin) return true;
    if (year !== currentYear) return false;
    return monthIndex + 1 === currentMonth;
  };

  const isITNEditable = isAdmin;
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-1" /> Reload
        </Button>

        <Button size="sm" onClick={handleSave} disabled={saving || dirtyIds.size === 0}>
          <Save className="h-4 w-4 mr-1" /> Save {dirtyIds.size > 0 && `(${dirtyIds.size})`}
        </Button>

        {/* Optional legend (helps users understand colors) */}
        <div className="flex items-center gap-2 ml-auto text-[11px] text-gray-600">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-200 border border-red-300" />
            Not submitted
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-yellow-200 border border-yellow-300" />
            Pending approval
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-green-200 border border-green-300" />
            Approved
          </span>
        </div>
      </div>

      <div className="border rounded-md overflow-auto max-h-[calc(100vh-220px)] bg-white">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-50 border-b">
            <tr>
              <th className="grid-th min-w-[100px] sticky left-0 bg-gray-50 z-20">District</th>
              <th className="grid-th min-w-[100px]">Upazila</th>
              <th className="grid-th min-w-[90px]">Union</th>
              <th className="grid-th min-w-[90px]">Village</th>
              <th className="grid-th min-w-[60px]">Ward</th>
              <th className="grid-th min-w-[60px]">H/H</th>
              <th className="grid-th min-w-[70px]">Pop.</th>
              <th className="grid-th min-w-[65px]">ITN'23</th>
              <th className="grid-th min-w-[65px]">ITN'24</th>
              <th className="grid-th min-w-[65px]">ITN'25</th>
              {MONTH_LABELS.map((m) => (
                <th key={m} className="grid-th min-w-[55px]">
                  {m}
                </th>
              ))}
              <th className="grid-th min-w-[60px] font-bold">Total</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={23} className="text-center py-8 text-muted-foreground">
                  No records for {year}
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="grid-td sticky left-0 bg-white z-[5] font-medium">
                  {row.district_name}
                </td>
                <td className="grid-td">{row.upazila_name}</td>
                <td className="grid-td">{row.union_name}</td>
                <td className="grid-td">{row.village_name}</td>
                <td className="grid-td">{row.ward_no || ""}</td>

                <td className="grid-td p-0">
                  <input
                    type="number"
                    min={0}
                    className="grid-input"
                    value={row.hh}
                    onChange={(e) => handleCellChange(row.id, "hh", e.target.value)}
                  />
                </td>

                <td className="grid-td p-0">
                  <input
                    type="number"
                    min={0}
                    className="grid-input"
                    value={row.population}
                    onChange={(e) => handleCellChange(row.id, "population", e.target.value)}
                  />
                </td>

                {itnColumns.map((itnCol) => (
                  <td key={itnCol} className="grid-td p-0">
                    <input
                      type="number"
                      min={0}
                      className={`grid-input ${isITNEditable ? "" : "bg-muted/30 text-muted-foreground"}`}
                      value={row[itnCol]}
                      onChange={(e) => handleCellChange(row.id, itnCol, e.target.value)}
                      disabled={!isITNEditable}
                    />
                  </td>
                ))}

                {MONTH_COLUMNS.map((col, idx) => {
                  const value = row[col as MonthColumn];
                  const status = getMonthStatus(value, idx);
                  const editable = isMonthEditable(idx);

                  return (
                    <td
                      key={col}
                      className={`grid-td p-0 border ${getMonthBg(status)} ${
                        editable ? "" : "opacity-80"
                      }`}
                      title={
                        status === "GREEN"
                          ? "Approved"
                          : status === "YELLOW"
                          ? "Waiting for approval"
                          : "Not submitted"
                      }
                    >
                      <input
                        type="number"
                        min={0}
                        className={`grid-input bg-transparent ${
                          editable ? "" : "text-muted-foreground"
                        }`}
                        value={value}
                        onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                        disabled={!editable}
                      />
                    </td>
                  );
                })}

                <td className="grid-td font-bold text-center bg-gray-50">
                  {getMonthTotal(row)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LocalRecordsGrid;
