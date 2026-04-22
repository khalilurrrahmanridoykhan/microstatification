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
import { Plus, Trash2, RefreshCw, Save } from "lucide-react";
import {
  createNonLocalRecord,
  deleteNonLocalRecord,
  fetchNonLocalRecords,
  updateNonLocalRecord,
  type NonLocalRecord,
  type NonLocalRecordPayload,
} from "@/lib/api";

interface NonLocalRow extends NonLocalRecord {
  _isNew?: boolean;
}

type CellStatus = "RED" | "YELLOW" | "GREEN";
type NonLocalEditableField =
  | "country"
  | "district_or_state"
  | "upazila_or_township"
  | "union_name"
  | "village_name"
  | MonthColumn;

const COUNTRIES = ["Bangladesh", "India", "Myanmar"];

function isMonthField(field: NonLocalEditableField): field is MonthColumn {
  return MONTH_COLUMNS.includes(field as MonthColumn);
}

function buildPayload(row: NonLocalRow): NonLocalRecordPayload {
  return {
    sk_user_id: row.sk_user_id,
    reporting_year: row.reporting_year,
    country: row.country,
    district_or_state: row.district_or_state,
    upazila_or_township: row.upazila_or_township,
    union_name: row.union_name,
    village_name: row.village_name,
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

const NonLocalRecordsGrid = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "admin";
  const currentMonth = getDhakaMonth();
  const currentYear = getDhakaYear();

  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<NonLocalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // -------- Color Logic (No DB Change) --------
  const getMonthStatus = (value: number, monthIndex: number): CellStatus => {
    if (!value || value === 0) return "RED";
    const monthNumber = monthIndex + 1;

    if (!isAdmin && year === currentYear && monthNumber === currentMonth) {
      return "YELLOW";
    }
    return "GREEN";
  };

  const getMonthBg = (status: CellStatus) => {
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
      const data = await fetchNonLocalRecords(year);
      setRows(isAdmin ? data : data.filter((row) => row.sk_user_id === user.id));
      setDirtyIds(new Set());
      setDeletedIds([]);
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

  const addRow = () => {
    if (!user) return;
    const newRow: NonLocalRow = {
      id: crypto.randomUUID(),
      sk_user_id: user.id,
      reporting_year: year,
      country: "Bangladesh",
      district_or_state: "",
      upazila_or_township: "",
      union_name: "",
      village_name: "",
      jan_cases: 0,
      feb_cases: 0,
      mar_cases: 0,
      apr_cases: 0,
      may_cases: 0,
      jun_cases: 0,
      jul_cases: 0,
      aug_cases: 0,
      sep_cases: 0,
      oct_cases: 0,
      nov_cases: 0,
      dec_cases: 0,
      _isNew: true,
    };

    setRows((prev) => [...prev, newRow]);
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(newRow.id);
      return next;
    });
  };

  const deleteRow = (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    if (!row._isNew) {
      setDeletedIds((prev) => [...prev, id]);
    }

    setRows((prev) => prev.filter((r) => r.id !== id));
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleCellChange = (
    rowId: string,
    field: NonLocalEditableField,
    value: string,
  ) => {
    if (isMonthField(field)) {
      const num = value === "" ? 0 : parseInt(value, 10);
      if (isNaN(num) || num < 0) return;

      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, [field]: num } : r)),
      );
    } else {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
      );
    }

    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(rowId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete removed
      for (const id of deletedIds) {
        await deleteNonLocalRecord(id);
      }

      const dirty = rows.filter((r) => dirtyIds.has(r.id));

      for (const r of dirty) {
        if (r._isNew) {
          await createNonLocalRecord(buildPayload(r));
        } else {
          await updateNonLocalRecord(r.id, buildPayload(r));
        }
      }

      await fetchData();
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

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const hasDirty = dirtyIds.size > 0 || deletedIds.length > 0;

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

        <Button size="sm" onClick={handleSave} disabled={saving || !hasDirty}>
          <Save className="h-4 w-4 mr-1" /> Save
        </Button>

        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" /> Add Row
        </Button>
      </div>

      <div className="border rounded-md overflow-auto max-h-[calc(100vh-220px)] bg-white">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-50 border-b">
            <tr>
              <th className="grid-th min-w-[40px]"></th>
              <th className="grid-th min-w-[100px]">Country</th>
              <th className="grid-th min-w-[110px]">District/State</th>
              <th className="grid-th min-w-[110px]">Upazila/Township</th>
              <th className="grid-th min-w-[90px]">Union</th>
              <th className="grid-th min-w-[90px]">Village</th>
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
                <td colSpan={19} className="text-center py-8 text-muted-foreground">
                  No records for {year}
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="grid-td p-1 text-center">
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="text-destructive hover:text-destructive/80 p-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>

                <td className="grid-td p-0">
                  <select
                    className="grid-input bg-transparent"
                    value={row.country}
                    onChange={(e) => handleCellChange(row.id, "country", e.target.value)}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.district_or_state}
                    onChange={(e) => handleCellChange(row.id, "district_or_state", e.target.value)}
                  />
                </td>

                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.upazila_or_township}
                    onChange={(e) => handleCellChange(row.id, "upazila_or_township", e.target.value)}
                  />
                </td>

                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.union_name}
                    onChange={(e) => handleCellChange(row.id, "union_name", e.target.value)}
                  />
                </td>

                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_name}
                    onChange={(e) => handleCellChange(row.id, "village_name", e.target.value)}
                  />
                </td>

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

export default NonLocalRecordsGrid;
