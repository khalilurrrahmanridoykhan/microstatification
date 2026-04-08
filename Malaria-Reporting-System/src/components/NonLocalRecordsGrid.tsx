import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  getDhakaMonth,
  getDhakaYear,
  getMonthTotal,
} from "@/lib/monthUtils";
import { exportRowsToXlsx } from "@/lib/xlsxExport";
import { Download, Plus, Trash2, RefreshCw, Save } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import DataGridLoadingScreen from "@/components/DataGridLoadingScreen";

interface NonLocalRow {
  id: string;
  sk_user_id: string;
  reporting_year: number;
  country: string;
  district_or_state: string;
  upazila_or_township: string;
  union_name: string;
  village_name: string;
  jan_cases: number;
  feb_cases: number;
  mar_cases: number;
  apr_cases: number;
  may_cases: number;
  jun_cases: number;
  jul_cases: number;
  aug_cases: number;
  sep_cases: number;
  oct_cases: number;
  nov_cases: number;
  dec_cases: number;
  _isNew?: boolean;
}

interface DistrictOption {
  id: string;
  name: string;
}

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
type MonthCellStatus = "NEUTRAL" | "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

interface ApprovalRow {
  record_id: string;
  month: number;
  status: ApprovalStatus;
}

const COUNTRIES = ["Bangladesh", "India", "Myanmar"];
const DEFAULT_DISTRICT_NAME = "Bandarban";

const createRowId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `nonlocal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getNonLocalExportMonthValue = (row: NonLocalRow, monthColumn: (typeof MONTH_COLUMNS)[number]) => {
  const value = Number((row as any)[monthColumn] || 0);
  return value > 0 ? value : "";
};

const NonLocalRecordsGrid = () => {
  const { user, role, microRole } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "admin";
  const isMicroAdmin = isAdmin && microRole === "micro_admin";
  const currentMonth = getDhakaMonth();
  const currentYear = getDhakaYear();
  const isMobile = useIsMobile();

  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<NonLocalRow[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [selectedDistrictName, setSelectedDistrictName] = useState(DEFAULT_DISTRICT_NAME);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<10 | 20 | 50 | -1>(10);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [approvalLookup, setApprovalLookup] = useState<Record<string, ApprovalStatus>>({});
  const [approvalSavingKey, setApprovalSavingKey] = useState<string | null>(null);

  // -------- Color Logic (No DB Change) --------
  const getApprovalKey = (recordId: string, monthNumber: number) =>
    `${recordId}:${monthNumber}`;

  const getMonthApprovalStatus = (recordId: string, monthNumber: number) =>
    approvalLookup[getApprovalKey(recordId, monthNumber)] || null;

  const getMonthStatus = (row: NonLocalRow, monthIndex: number): MonthCellStatus => {
    const monthNumber = monthIndex + 1;
    const value = Number((row as any)[MONTH_COLUMNS[monthIndex]] || 0);
    const hasData = value > 0;
    const approvalStatus = getMonthApprovalStatus(row.id, monthNumber);
    const isFutureMonth =
      year > currentYear || (year === currentYear && monthNumber > currentMonth);
    const isCurrentMonth = year === currentYear && monthNumber === currentMonth;

    if (hasData) {
      if (approvalStatus === "APPROVED") return "APPROVED";
      if (approvalStatus === "REJECTED") return "REJECTED";
      return "PENDING";
    }

    if (approvalStatus === "REJECTED") return "REJECTED";
    if (approvalStatus === "APPROVED") return "APPROVED";
    if (isCurrentMonth || isFutureMonth) return "NEUTRAL";
    return "NOT_SUBMITTED";
  };

  const isMonthEditable = (row: NonLocalRow, monthIndex: number) => {
    if (isAdmin) return true;
    if (year !== currentYear) return false;

    const monthNumber = monthIndex + 1;
    const approvalStatus = getMonthApprovalStatus(row.id, monthNumber);
    if (approvalStatus === "REJECTED") return true;
    return monthNumber === currentMonth;
  };

  const getMonthTitle = (status: MonthCellStatus) => {
    switch (status) {
      case "APPROVED":
        return "Approved";
      case "PENDING":
        return "Pending approval";
      case "REJECTED":
        return "Not approved";
      case "NOT_SUBMITTED":
        return "Not submitted";
      default:
        return "";
    }
  };

  const getMonthBg = (status: MonthCellStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-50 border-green-200";
      case "PENDING":
        return "bg-yellow-50 border-yellow-200";
      case "REJECTED":
        return "bg-orange-50 border-orange-200";
      case "NOT_SUBMITTED":
        return "bg-red-50 border-red-200";
      default:
        return "bg-white border-border/60";
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from("non_local_records")
        .select("*")
        .eq("reporting_year", year)
        .order("created_at");

      if (!isAdmin) {
        query = query.eq("sk_user_id", user.id);
      }

      if (isMicroAdmin && selectedDistrictName !== "all") {
        query = query.eq("district_or_state", selectedDistrictName);
      }

      const { data, error } = await query;
      if (error) throw error;

      const nextRows = data || [];
      const { data: approvalData, error: approvalError } = await supabase
        .from("monthly_approvals")
        .select("record_id, month, status")
        .eq("record_type", "non_local")
        .eq("reporting_year", year);
      if (approvalError) throw approvalError;

      const visibleRecordIds = new Set(nextRows.map((row: NonLocalRow) => String(row.id)));
      const nextApprovalLookup = Object.fromEntries(
        ((approvalData || []) as ApprovalRow[])
          .filter((approval) => visibleRecordIds.has(String(approval.record_id)))
          .map((approval) => [
            getApprovalKey(String(approval.record_id), Number(approval.month)),
            approval.status,
          ]),
      );

      setRows(nextRows);
      setApprovalLookup(nextApprovalLookup);
      setDirtyIds(new Set());
      setDeletedIds([]);
      setCurrentPage(1);
    } catch (err: any) {
      toast({ title: "Load error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, year, isAdmin, isMicroAdmin, selectedDistrictName, toast]);

  useEffect(() => {
    let canceled = false;

    const loadDistricts = async () => {
      try {
        const { data, error } = await supabase.from("districts").select("id,name").order("name");
        if (error) throw error;
        if (canceled) return;
        const options = (data || []).map((item: any) => ({
          id: String(item.id),
          name: item.name,
        }));
        setDistricts(options);
        setSelectedDistrictName((currentValue) => {
          if (currentValue && currentValue !== "all") {
            return currentValue;
          }

          const hasBandarban = options.some(
            (district) => district.name === DEFAULT_DISTRICT_NAME,
          );

          return hasBandarban ? DEFAULT_DISTRICT_NAME : "all";
        });
      } catch (err: any) {
        if (canceled) return;
        toast({
          title: "District load error",
          description: err.message,
          variant: "destructive",
        });
      }
    };

    if (isMicroAdmin) {
      void loadDistricts();
    } else {
      setDistricts([]);
      setSelectedDistrictName("all");
    }

    return () => {
      canceled = true;
    };
  }, [isMicroAdmin, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (loading) {
      setShowLoadingScreen(true);
    }
  }, [loading]);

  const addRow = () => {
    if (!user) return;
    const newRow: NonLocalRow = {
      id: createRowId(),
      sk_user_id: user.id,
      reporting_year: year,
      country: "Bangladesh",
      district_or_state: isMicroAdmin && selectedDistrictName !== "all" ? selectedDistrictName : "",
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
    setDirtyIds((prev) => new Set(prev).add(newRow.id));
    if (!isMobile) {
      const nextPageSize = rowsPerPage === -1 ? rows.length + 1 : rowsPerPage;
      setCurrentPage(Math.max(1, Math.ceil((rows.length + 1) / nextPageSize)));
    }
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

  const handleCellChange = (rowId: string, field: string, value: string) => {
    if (MONTH_COLUMNS.includes(field as any)) {
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

    setDirtyIds((prev) => new Set(prev).add(rowId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete removed
      for (const id of deletedIds) {
        const { error } = await supabase.from("non_local_records").delete().eq("id", id);
        if (error) throw error;
      }

      const dirty = rows.filter((r) => dirtyIds.has(r.id));

      for (const r of dirty) {
        const payload: any = {
          sk_user_id: r.sk_user_id,
          reporting_year: r.reporting_year,
          country: r.country,
          district_or_state: r.district_or_state,
          upazila_or_township: r.upazila_or_township,
          union_name: r.union_name,
          village_name: r.village_name,
        };

        MONTH_COLUMNS.forEach((col) => {
          payload[col] = (r as any)[col];
        });

        if (r._isNew) {
          payload.id = r.id;
          const { error } = await supabase.from("non_local_records").insert(payload);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("non_local_records").update(payload).eq("id", r.id);
          if (error) throw error;
        }
      }

      await fetchData();
      toast({ title: "Saved successfully" });
    } catch (err: any) {
      toast({ title: "Save error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprovalChange = async (
    row: NonLocalRow,
    monthNumber: number,
    nextStatus: Extract<ApprovalStatus, "APPROVED" | "REJECTED">,
  ) => {
    const monthField = MONTH_COLUMNS[monthNumber - 1];
    const monthValue = Number((row as any)[monthField] || 0);
    if (!isAdmin || row._isNew || monthValue <= 0) return;

    const approvalKey = getApprovalKey(row.id, monthNumber);
    setApprovalSavingKey(approvalKey);
    try {
      const { error } = await supabase.from("monthly_approvals").upsert({
        record_type: "non_local",
        record_id: row.id,
        reporting_year: year,
        month: monthNumber,
        status: nextStatus,
      });
      if (error) throw error;

      setApprovalLookup((prev) => ({
        ...prev,
        [approvalKey]: nextStatus,
      }));
      toast({ title: nextStatus === "APPROVED" ? "Month approved" : "Month marked not approved" });
    } catch (err: any) {
      toast({
        title: "Approval update failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setApprovalSavingKey(null);
    }
  };

  const handleDownloadData = useCallback(() => {
    if (!isAdmin) return;

    if (rows.length === 0) {
      toast({
        title: "No data to download",
        description: "There are no rows in the current non-local table view.",
        variant: "destructive",
      });
      return;
    }

    exportRowsToXlsx({
      filename: `malaria-non-local-records-${year}.xlsx`,
      sheetName: `Non-Local ${year}`,
      headers: [
        "Country",
        "District/State",
        "Upazila/Township",
        "Union",
        "Village",
        ...MONTH_LABELS,
        "Total",
      ],
      rows: rows.map((row) => [
        row.country || "",
        row.district_or_state || "",
        row.upazila_or_township || "",
        row.union_name || "",
        row.village_name || "",
        ...MONTH_COLUMNS.map((column) => getNonLocalExportMonthValue(row, column)),
        getMonthTotal(row),
      ]),
    });
  }, [isAdmin, rows, toast, year]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const selectedDistrictLabel = selectedDistrictName === "all" ? "" : selectedDistrictName;
  const hasDirty = dirtyIds.size > 0 || deletedIds.length > 0;
  const effectiveRowsPerPage = rowsPerPage === -1 ? rows.length || 1 : rowsPerPage;
  const totalPages = isMobile ? 1 : Math.max(1, Math.ceil(rows.length / effectiveRowsPerPage));
  const pagedRows = isMobile
    ? rows
    : rows.slice((currentPage - 1) * effectiveRowsPerPage, currentPage * effectiveRowsPerPage);
  const visibleRows = rows.length === 0
    ? []
    : isMobile
      ? pagedRows
      : [...pagedRows, ...Array.from({ length: Math.max(0, effectiveRowsPerPage - pagedRows.length) }, () => null)];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="h-9 w-full min-w-[120px] sm:w-[140px]">
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

          {isMicroAdmin && (
            <Select
              value={selectedDistrictName}
              onValueChange={(value) => {
                setSelectedDistrictName(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full min-w-[170px] sm:w-[220px]">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district.id} value={district.name}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-9">
            <RefreshCw className="h-4 w-4 mr-1" /> Reload
          </Button>

          <Button size="sm" onClick={handleSave} disabled={saving || !hasDirty} className="h-9">
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>

          <Button variant="outline" size="sm" onClick={addRow} className="h-9">
            <Plus className="h-4 w-4 mr-1" /> Add Row
          </Button>

          {!isMobile && (
            <Select
              value={String(rowsPerPage)}
              onValueChange={(value) => {
                setRowsPerPage(Number(value) as 10 | 20 | 50 | -1);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[132px]">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 rows</SelectItem>
                <SelectItem value="20">20 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="-1">All rows</SelectItem>
              </SelectContent>
            </Select>
          )}

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadData}
              disabled={rows.length === 0}
              className="h-9"
            >
              <Download className="h-4 w-4 mr-1" /> Download Data
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-red-300 bg-red-200" />
          Not submitted
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-yellow-300 bg-yellow-200" />
          Pending approval
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-orange-300 bg-orange-200" />
          Not approved
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-green-300 bg-green-200" />
          Approved
        </span>
      </div>

      <div>
        <div className="relative">
          {loading && showLoadingScreen && (
            <DataGridLoadingScreen
              title="Refreshing non-local reporting table"
              description="Loading the latest non-local case rows, selected district filters, and month-wise reporting values."
              cachedRows={rows.length}
              columnCount={19}
              rowCount={6}
              onDismiss={() => setShowLoadingScreen(false)}
            />
          )}
          <div className="overflow-auto max-h-[calc(100vh-240px)] md:max-h-[calc(100vh-260px)] bg-white">
          <table className="w-max min-w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b">
              <tr>
                <th className="grid-th min-w-[40px]"></th>
                <th className="grid-th min-w-[120px]">Country</th>
                <th className="grid-th min-w-[140px]">District/State</th>
                <th className="grid-th min-w-[150px]">Upazila/Township</th>
                <th className="grid-th min-w-[120px]">Union</th>
                <th className="grid-th min-w-[120px]">Village</th>
                {MONTH_LABELS.map((m) => (
                  <th key={m} className="grid-th min-w-[64px]">
                    {m}
                  </th>
                ))}
                <th className="grid-th min-w-[72px] font-bold">Total</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={19} className="text-center py-8 text-muted-foreground">
                    No non-local records for {year}{selectedDistrictLabel ? ` in ${selectedDistrictLabel}` : ""}. Click Add Row, enter values, then Save.
                  </td>
                </tr>
              )}

              {visibleRows.map((row, rowIndex) =>
                row ? (
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
                      const value = (row as any)[col] as number;
                      const monthNumber = idx + 1;
                      const status = getMonthStatus(row, idx);
                      const editable = isMonthEditable(row, idx);
                      const approvalStatus = getMonthApprovalStatus(row.id, monthNumber);
                      const hasData = value > 0;
                      const isApprovalSaving = approvalSavingKey === getApprovalKey(row.id, monthNumber);
                      const approvalDisabled = !hasData || isApprovalSaving || row._isNew || dirtyIds.has(row.id);

                      return (
                        <td
                          key={col}
                          className={`grid-td p-0 border ${getMonthBg(status)} ${editable ? "" : "opacity-80"
                            }`}
                          title={getMonthTitle(status)}
                        >
                          <div className="flex h-full flex-col">
                            <input
                              type="number"
                              min={0}
                              className={`grid-input bg-transparent text-center ${editable ? "" : "text-muted-foreground"
                                }`}
                              value={value > 0 ? String(value) : ""}
                              onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                              disabled={!editable}
                            />
                          {isAdmin && hasData && (
                            <div className="flex items-center justify-center gap-2 border-t border-black/5 px-1 py-1 text-[9px]">
                              <button
                                type="button"
                                className={`inline-flex min-w-[28px] items-center justify-center rounded border px-1.5 py-0.5 font-semibold transition-colors ${
                                  approvalStatus === "APPROVED"
                                    ? "border-green-700 bg-green-700 text-white"
                                    : "border-green-300 bg-white text-green-700"
                                } ${approvalDisabled ? "cursor-not-allowed opacity-60" : "hover:bg-green-50"}`}
                                title="Approve"
                                aria-pressed={approvalStatus === "APPROVED"}
                                disabled={approvalDisabled}
                                onClick={() => void handleApprovalChange(row, monthNumber, "APPROVED")}
                              >
                                A
                              </button>
                              <button
                                type="button"
                                className={`inline-flex min-w-[28px] items-center justify-center rounded border px-1.5 py-0.5 font-semibold transition-colors ${
                                  approvalStatus === "REJECTED"
                                    ? "border-orange-700 bg-orange-700 text-white"
                                    : "border-orange-300 bg-white text-orange-700"
                                } ${approvalDisabled ? "cursor-not-allowed opacity-60" : "hover:bg-orange-50"}`}
                                title="Not approve"
                                aria-pressed={approvalStatus === "REJECTED"}
                                disabled={approvalDisabled}
                                onClick={() => void handleApprovalChange(row, monthNumber, "REJECTED")}
                              >
                                N
                              </button>
                            </div>
                          )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="grid-td font-bold text-center bg-gray-50">
                      {getMonthTotal(row)}
                    </td>
                  </tr>
                ) : (
                  <tr key={`empty-nonlocal-${rowIndex}`} className="hidden md:table-row">
                    {Array.from({ length: 19 }, (_, cellIndex) => (
                      <td key={cellIndex} className="grid-td text-transparent">.</td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {!isMobile && rows.length > 0 && (
        <div className="flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            Showing page {currentPage} of {totalPages}. Total rows: {rows.length}.
          </p>
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-3 text-xs text-slate-500">
                  {currentPage} / {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default NonLocalRecordsGrid;
