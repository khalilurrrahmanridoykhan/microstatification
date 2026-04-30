import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  estimateMonthColumnWithActionsWidth,
  estimateVerticalMonthHeaderWidth,
  getDhakaMonth,
  getDhakaYear,
  getMonthTotal,
} from "@/lib/monthUtils";
import { Maximize2, Minimize2, Plus, Trash2, RefreshCw, Save } from "lucide-react";
import {
  createNonLocalRecord,
  deleteNonLocalRecord,
  fetchMalariaMasterData,
  fetchVillagesByUnion,
  fetchMonthlyApprovals,
  fetchMonthAccessSettings,
  fetchNonLocalRecords,
  upsertMonthlyApproval,
  updateNonLocalRecord,
  type ApprovalRow,
  type MalariaMasterData,
  type NonLocalRecord,
  type NonLocalRecordPayload,
} from "@/lib/api";

interface NonLocalRow extends NonLocalRecord {
  _isNew?: boolean;
}

type CellStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
type NonLocalEditableField =
  | "country"
  | "district_or_state"
  | "upazila_or_township"
  | "union_name"
  | "village_name"
  | MonthColumn;

const COUNTRIES = ["Bangladesh", "India", "Myanmar"];
const OTHER_OPTION = "__other__";
const NON_LOCAL_HEADER_LABELS = [
  "",
  "Country",
  "District/State",
  "Upazila/Township",
  "Union",
  "Ward No",
  "Village",
  ...MONTH_LABELS,
  "Total",
];

const NON_LOCAL_MONTH_COLUMN_START_INDEX = 7;
const NON_LOCAL_MONTH_COLUMN_END_INDEX = 18;

function getDhakaTodayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getMonthLastDayIso(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function computeOpenMonthNumbers(
  year: number,
  settings: Array<{ month: number; close_date: string | null }>,
): Set<number> {
  const today = getDhakaTodayIso();
  const closeDateByMonth = new Map<number, string>();
  settings.forEach((item) => {
    const closeDate = item.close_date || getMonthLastDayIso(year, item.month);
    closeDateByMonth.set(item.month, closeDate);
  });

  const open = new Set<number>();
  for (let month = 1; month <= 12; month += 1) {
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const monthClose = closeDateByMonth.get(month) || getMonthLastDayIso(year, month);
    if (today >= monthStart && today <= monthClose) {
      open.add(month);
    }
  }
  return open;
}

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
  const [openMonthNumbers, setOpenMonthNumbers] = useState<Set<number>>(new Set([currentMonth]));
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const [isExpandedToHeaderWidth, setIsExpandedToHeaderWidth] = useState(false);
  const previousColumnWidthsRef = useRef<Record<number, number> | null>(null);
  const [approvalRows, setApprovalRows] = useState<ApprovalRow[]>([]);
  const [recordView, setRecordView] = useState<"all" | "pending">("all");
  const [masterData, setMasterData] = useState<MalariaMasterData>({
    districts: [],
    upazilas: [],
    unions: [],
    villages: [],
  });
  const [wardByRow, setWardByRow] = useState<Record<string, string>>({});
  const [otherModeByRow, setOtherModeByRow] = useState<
    Record<string, Partial<Record<"country" | "district" | "upazila" | "union" | "ward" | "village", boolean>>>
  >({});
  const touchedColumnIndexesRef = useRef<Set<number>>(new Set());
  const resizingColumnRef = useRef<number | null>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  // -------- Color Logic (No DB Change) --------
  const approvalByKey = useMemo(() => {
    const map = new Map<string, ApprovalRow["status"]>();
    for (const approval of approvalRows) {
      map.set(`${approval.record_id}:${approval.month}`, approval.status);
    }
    return map;
  }, [approvalRows]);

  const getMonthStatus = (row: NonLocalRow, value: number, monthIndex: number): CellStatus => {
    if (!value || value === 0) return "NOT_SUBMITTED";
    const monthNumber = monthIndex + 1;
    const approvalStatus = approvalByKey.get(`${row.id}:${monthNumber}`);
    if (approvalStatus === "PENDING") return "PENDING";
    if (approvalStatus === "APPROVED") return "APPROVED";
    if (approvalStatus === "REJECTED") return "REJECTED";

    if (!isAdmin && year === currentYear && monthNumber === currentMonth) {
      return "PENDING";
    }
    return "APPROVED";
  };

  const getMonthBg = (status: CellStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-50 border-green-200";
      case "PENDING":
        return "bg-yellow-50 border-yellow-200";
      case "REJECTED":
        return "bg-fuchsia-50 border-fuchsia-200";
      default:
        return "bg-red-50 border-red-200";
    }
  };

  const pendingRecordIds = useMemo(() => {
    const ids = new Set<string>();
    approvalRows.forEach((approval) => {
      if (approval.status === "PENDING") {
        ids.add(approval.record_id);
      }
    });
    return ids;
  }, [approvalRows]);

  const displayedRows = useMemo(() => {
    if (!isAdmin || recordView === "all") return rows;
    return rows.filter((row) => pendingRecordIds.has(row.id));
  }, [rows, isAdmin, recordView, pendingRecordIds]);

  const handleApprovalAction = async (recordId: string, month: number, status: "APPROVED" | "REJECTED") => {
    try {
      await upsertMonthlyApproval({
        recordType: "non_local",
        recordId,
        reportingYear: year,
        month,
        status,
      });
      setApprovalRows((prev) => {
        const filtered = prev.filter((a) => !(a.record_id === recordId && a.month === month));
        return [...filtered, { record_id: recordId, month, status }];
      });
    } catch (error) {
      toast({
        title: "Approval update failed",
        description: error instanceof Error ? error.message : "Failed to update approval.",
        variant: "destructive",
      });
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let data = await fetchNonLocalRecords(year);
      let effectiveYear = year;

      if (data.length === 0) {
        const latestRecords = await fetchNonLocalRecords("latest");
        if (latestRecords.length > 0) {
          data = latestRecords;
          effectiveYear = latestRecords[0].reporting_year;
        }
      }

      if (effectiveYear !== year) {
        setYear(effectiveYear);
      }

      const visibleRows = isAdmin ? data : data.filter((row) => row.sk_user_id === user.id);
      setRows(visibleRows);
      const approvals = await fetchMonthlyApprovals({
        recordType: "non_local",
        reportingYear: effectiveYear,
      });
      setApprovalRows(approvals);
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

  useEffect(() => {
    let mounted = true;
    const loadMasterData = async () => {
      try {
        const data = await fetchMalariaMasterData({ includeVillages: false });
        if (mounted) setMasterData(data);
      } catch (_error) {
        if (mounted) {
          setMasterData({
            districts: [],
            upazilas: [],
            unions: [],
            villages: [],
          });
        }
      }
    };
    void loadMasterData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    let mounted = true;
    const loadMonthAccess = async () => {
      try {
        const settings = await fetchMonthAccessSettings(year);
        const open = computeOpenMonthNumbers(year, settings);
        if (mounted) {
          setOpenMonthNumbers(open);
        }
      } catch (_error) {
        if (mounted) {
          setOpenMonthNumbers(new Set([currentMonth]));
        }
      }
    };
    void loadMonthAccess();
    return () => {
      mounted = false;
    };
  }, [year, isAdmin, currentMonth]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const col = resizingColumnRef.current;
      if (col === null) return;
      const deltaX = event.clientX - resizeStartXRef.current;
      const nextWidth = Math.max(10, resizeStartWidthRef.current + deltaX);
      setColumnWidths((prev) => ({ ...prev, [col]: nextWidth }));
    };

    const handleMouseUp = () => {
      resizingColumnRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startColumnResize = (index: number, event: React.MouseEvent<HTMLSpanElement>) => {
    const th = event.currentTarget.parentElement as HTMLElement | null;
    if (!th) return;
    touchedColumnIndexesRef.current.add(index);
    resizingColumnRef.current = index;
    resizeStartXRef.current = event.clientX;
    resizeStartWidthRef.current = th.getBoundingClientRect().width;
    event.preventDefault();
  };

  const estimateHeaderWidth = (label: string) => {
    const headerLabel = String(label || "").trim();
    if (!headerLabel) {
      return 36;
    }
    if (typeof document === "undefined") {
      return Math.min(320, Math.max(36, headerLabel.length * 7 + 18));
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return Math.min(320, Math.max(36, headerLabel.length * 7 + 18));
    }
    context.font = "600 9px Inter, ui-sans-serif, system-ui, sans-serif";
    const textWidth = context.measureText(headerLabel).width;
    return Math.min(320, Math.ceil(textWidth + 18));
  };

  const pendingActionMonthColumnIndexes = useMemo(() => {
    if (!isAdmin) {
      return new Set<number>();
    }
    const set = new Set<number>();
    displayedRows.forEach((row) => {
      MONTH_COLUMNS.forEach((col, idx) => {
        const value = row[col as MonthColumn];
        if (!value || value === 0) return;
        const monthNumber = idx + 1;
        if (approvalByKey.get(`${row.id}:${monthNumber}`) === "PENDING") {
          set.add(NON_LOCAL_MONTH_COLUMN_START_INDEX + idx);
        }
      });
    });
    return set;
  }, [displayedRows, isAdmin, approvalByKey]);

  useEffect(() => {
    setColumnWidths((prev) => {
      if (Object.keys(prev).length > 0) {
        return prev;
      }
      const next: Record<number, number> = {};
      NON_LOCAL_HEADER_LABELS.forEach((label, index) => {
        next[index] = estimateHeaderWidth(label);
      });
      for (let index = NON_LOCAL_MONTH_COLUMN_START_INDEX; index <= NON_LOCAL_MONTH_COLUMN_END_INDEX; index += 1) {
        const monthLabel = MONTH_LABELS[index - NON_LOCAL_MONTH_COLUMN_START_INDEX] || "";
        next[index] = pendingActionMonthColumnIndexes.has(index)
          ? estimateMonthColumnWithActionsWidth(monthLabel)
          : estimateVerticalMonthHeaderWidth(monthLabel);
      }
      return next;
    });
  }, [pendingActionMonthColumnIndexes]);

  useEffect(() => {
    setColumnWidths((prev) => {
      if (Object.keys(prev).length === 0) {
        return prev;
      }
      const next = { ...prev };
      let changed = false;
      for (let index = NON_LOCAL_MONTH_COLUMN_START_INDEX; index <= NON_LOCAL_MONTH_COLUMN_END_INDEX; index += 1) {
        if (touchedColumnIndexesRef.current.has(index)) {
          continue;
        }
        const width = next[index] || 0;
        const monthLabel = MONTH_LABELS[index - NON_LOCAL_MONTH_COLUMN_START_INDEX] || "";
        const targetWidth = pendingActionMonthColumnIndexes.has(index)
          ? estimateMonthColumnWithActionsWidth(monthLabel)
          : estimateVerticalMonthHeaderWidth(monthLabel);
        if (targetWidth !== width) {
          next[index] = targetWidth;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pendingActionMonthColumnIndexes]);

  const toggleExpandToHeaderWidth = () => {
    if (!isExpandedToHeaderWidth) {
      previousColumnWidthsRef.current = { ...columnWidths };
      const expandedWidths: Record<number, number> = {};
      NON_LOCAL_HEADER_LABELS.forEach((label, index) => {
        expandedWidths[index] = estimateHeaderWidth(label);
      });
      setColumnWidths(expandedWidths);
      setIsExpandedToHeaderWidth(true);
      return;
    }

    setColumnWidths(previousColumnWidthsRef.current || {});
    setIsExpandedToHeaderWidth(false);
  };

  const renderHeaderCell = (label: React.ReactNode, index: number, className: string) => (
    <th key={index} className={`${className} relative`}>
      {typeof label === "string" ? <span className="grid-th-label">{label}</span> : label}
      <span
        className="absolute right-0 top-0 z-20 h-full w-2 cursor-col-resize bg-transparent hover:bg-primary/20"
        onMouseDown={(event) => startColumnResize(index, event)}
      />
    </th>
  );

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

    setRows((prev) => [newRow, ...prev]);
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

  const setOtherMode = (
    rowId: string,
    field: "country" | "district" | "upazila" | "union" | "ward" | "village",
    enabled: boolean,
  ) => {
    setOtherModeByRow((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [field]: enabled,
      },
    }));
  };

  const getDistrictOptions = () => masterData.districts.map((item) => item.name).sort((a, b) => a.localeCompare(b));

  const getUpazilaOptions = (row: NonLocalRow) => {
    const district = masterData.districts.find((item) => item.name === row.district_or_state);
    if (!district) return [];
    return masterData.upazilas
      .filter((item) => item.district_id === district.id)
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b));
  };

  const getUnionOptions = (row: NonLocalRow) => {
    const upazila = masterData.upazilas.find((item) => item.name === row.upazila_or_township);
    if (!upazila) return [];
    return masterData.unions
      .filter((item) => item.upazila_id === upazila.id)
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b));
  };

  const getWardOptions = (row: NonLocalRow) => {
    const union = masterData.unions.find((item) => item.name === row.union_name);
    if (!union) return [];
    return Array.from(
      new Set(
        masterData.villages
          .filter((item) => item.union_id === union.id && item.ward_no)
          .map((item) => String(item.ward_no)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  };

  const getVillageOptions = (row: NonLocalRow) => {
    const union = masterData.unions.find((item) => item.name === row.union_name);
    if (!union) return [];
    const ward = wardByRow[row.id] || "";
    return masterData.villages
      .filter((item) => item.union_id === union.id)
      .filter((item) => (ward ? String(item.ward_no || "") === ward : true))
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b));
  };

  const ensureVillagesForUnion = async (unionName: string) => {
    const union = masterData.unions.find((item) => item.name === unionName);
    if (!union) return;
    const alreadyLoaded = masterData.villages.some((item) => item.union_id === union.id);
    if (alreadyLoaded) return;
    const villages = await fetchVillagesByUnion(union.id);
    setMasterData((prev) => ({
      ...prev,
      villages: [
        ...prev.villages,
        ...villages.filter((item) => !prev.villages.some((existing) => existing.id === item.id)),
      ],
    }));
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
    return openMonthNumbers.has(monthIndex + 1);
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
        <Button variant="outline" size="icon" onClick={toggleExpandToHeaderWidth} title="Toggle full-width columns">
          {isExpandedToHeaderWidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        {isAdmin && (
          <Select value={recordView} onValueChange={(value) => setRecordView(value as "all" | "pending")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Records View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="pending">Waiting Approval</SelectItem>
            </SelectContent>
          </Select>
        )}
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
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-fuchsia-200 border border-fuchsia-300" />
            Rejected
          </span>
        </div>
      </div>

      <div className="border rounded-md overflow-auto max-h-[calc(100vh-220px)] bg-white relative">
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading non-local records...</span>
            </div>
          </div>
        )}
        <table className="w-full text-[10px] border-collapse table-fixed">
          <colgroup>
            {Array.from({ length: 20 }).map((_, index) => (
              <col key={index} style={columnWidths[index] ? { width: `${columnWidths[index]}px` } : undefined} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-gray-50 border-b">
            <tr>
              {renderHeaderCell("", 0, "grid-th min-w-[10px]")}
              {renderHeaderCell("Country", 1, "grid-th min-w-[10px]")}
              {renderHeaderCell("District/State", 2, "grid-th min-w-[10px]")}
              {renderHeaderCell("Upazila/Township", 3, "grid-th min-w-[10px]")}
              {renderHeaderCell("Union", 4, "grid-th min-w-[10px]")}
              {renderHeaderCell("Ward No", 5, "grid-th min-w-[10px]")}
              {renderHeaderCell("Village", 6, "grid-th min-w-[10px]")}
              {MONTH_LABELS.map((m, idx) => (
                renderHeaderCell(
                  <span className={`month-th-label${isExpandedToHeaderWidth ? " month-th-label-horizontal" : ""}`}>
                    {m}
                  </span>,
                  7 + idx,
                  `grid-th min-w-[10px]${isExpandedToHeaderWidth ? " month-th-horizontal" : " month-th"}`,
                )
              ))}
              {renderHeaderCell("Total", 19, "grid-th min-w-[10px] font-bold")}
            </tr>
          </thead>

          <tbody>
            {displayedRows.length === 0 && !loading && (
              <tr>
                <td colSpan={20} className="text-center py-8 text-muted-foreground">
                  {isAdmin && recordView === "pending" ? "No pending records for current filters" : `No records for ${year}`}
                </td>
              </tr>
            )}

            {displayedRows.map((row) => (
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
                  {otherModeByRow[row.id]?.country ? (
                    <input
                      className="grid-input"
                      placeholder="Enter country"
                      value={row.country}
                      onChange={(e) => handleCellChange(row.id, "country", e.target.value)}
                    />
                  ) : (
                    <select
                      className="grid-input bg-transparent"
                      value={row.country}
                      onChange={(e) => {
                        if (e.target.value === OTHER_OPTION) {
                          setOtherMode(row.id, "country", true);
                          handleCellChange(row.id, "country", "");
                          return;
                        }
                        setOtherMode(row.id, "country", false);
                        handleCellChange(row.id, "country", e.target.value);
                      }}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value={OTHER_OPTION}>Other</option>
                    </select>
                  )}
                </td>

                <td className="grid-td p-0">
                  {row.country === "Bangladesh" && !otherModeByRow[row.id]?.district ? (
                    <select
                      className="grid-input bg-transparent"
                      value={row.district_or_state}
                      onChange={(e) => {
                        if (e.target.value === OTHER_OPTION) {
                          setOtherMode(row.id, "district", true);
                          handleCellChange(row.id, "district_or_state", "");
                          return;
                        }
                        setOtherMode(row.id, "district", false);
                        handleCellChange(row.id, "district_or_state", e.target.value);
                        handleCellChange(row.id, "upazila_or_township", "");
                        handleCellChange(row.id, "union_name", "");
                        handleCellChange(row.id, "village_name", "");
                        setWardByRow((prev) => ({ ...prev, [row.id]: "" }));
                      }}
                    >
                      <option value="">Select District</option>
                      {getDistrictOptions().map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                      <option value={OTHER_OPTION}>Other</option>
                    </select>
                  ) : (
                    <input
                      className="grid-input"
                      placeholder="District/State"
                      value={row.district_or_state}
                      onChange={(e) => handleCellChange(row.id, "district_or_state", e.target.value)}
                    />
                  )}
                </td>

                <td className="grid-td p-0">
                  {row.country === "Bangladesh" && !otherModeByRow[row.id]?.upazila ? (
                    <select
                      className="grid-input bg-transparent"
                      value={row.upazila_or_township}
                      onChange={(e) => {
                        if (e.target.value === OTHER_OPTION) {
                          setOtherMode(row.id, "upazila", true);
                          handleCellChange(row.id, "upazila_or_township", "");
                          return;
                        }
                        setOtherMode(row.id, "upazila", false);
                        handleCellChange(row.id, "upazila_or_township", e.target.value);
                        handleCellChange(row.id, "union_name", "");
                        handleCellChange(row.id, "village_name", "");
                        setWardByRow((prev) => ({ ...prev, [row.id]: "" }));
                      }}
                    >
                      <option value="">Select Upazila</option>
                      {getUpazilaOptions(row).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                      <option value={OTHER_OPTION}>Other</option>
                    </select>
                  ) : (
                    <input
                      className="grid-input"
                      placeholder="Upazila/Township"
                      value={row.upazila_or_township}
                      onChange={(e) => handleCellChange(row.id, "upazila_or_township", e.target.value)}
                    />
                  )}
                </td>

                <td className="grid-td p-0">
                  {row.country === "Bangladesh" && !otherModeByRow[row.id]?.union ? (
                    <select
                      className="grid-input bg-transparent"
                      value={row.union_name}
                      onChange={(e) => {
                        if (e.target.value === OTHER_OPTION) {
                          setOtherMode(row.id, "union", true);
                          handleCellChange(row.id, "union_name", "");
                          return;
                        }
                        setOtherMode(row.id, "union", false);
                        handleCellChange(row.id, "union_name", e.target.value);
                        handleCellChange(row.id, "village_name", "");
                        setWardByRow((prev) => ({ ...prev, [row.id]: "" }));
                        void ensureVillagesForUnion(e.target.value);
                      }}
                    >
                      <option value="">Select Union</option>
                      {getUnionOptions(row).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                      <option value={OTHER_OPTION}>Other</option>
                    </select>
                  ) : (
                    <input
                      className="grid-input"
                      placeholder="Union"
                      value={row.union_name}
                      onChange={(e) => handleCellChange(row.id, "union_name", e.target.value)}
                    />
                  )}
                </td>

                <td className="grid-td p-0">
                  {row.country === "Bangladesh" && !otherModeByRow[row.id]?.ward ? (
                    <select
                      className="grid-input bg-transparent"
                      value={wardByRow[row.id] || ""}
                      onChange={(e) => {
                        if (e.target.value === OTHER_OPTION) {
                          setOtherMode(row.id, "ward", true);
                          setWardByRow((prev) => ({ ...prev, [row.id]: "" }));
                          handleCellChange(row.id, "village_name", "");
                          return;
                        }
                        setOtherMode(row.id, "ward", false);
                        setWardByRow((prev) => ({ ...prev, [row.id]: e.target.value }));
                        handleCellChange(row.id, "village_name", "");
                      }}
                    >
                      <option value="">All Wards</option>
                      {getWardOptions(row).map((ward) => (
                        <option key={ward} value={ward}>
                          {ward}
                        </option>
                      ))}
                      <option value={OTHER_OPTION}>Other</option>
                    </select>
                  ) : (
                    <input
                      className="grid-input"
                      placeholder="Ward No"
                      value={wardByRow[row.id] || ""}
                      onChange={(e) => setWardByRow((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    />
                  )}
                </td>

                <td className="grid-td p-0">
                  {row.country === "Bangladesh" && !otherModeByRow[row.id]?.village ? (
                    <select
                      className="grid-input bg-transparent"
                      value={row.village_name}
                      onChange={(e) => {
                        if (e.target.value === OTHER_OPTION) {
                          setOtherMode(row.id, "village", true);
                          handleCellChange(row.id, "village_name", "");
                          return;
                        }
                        setOtherMode(row.id, "village", false);
                        handleCellChange(row.id, "village_name", e.target.value);
                      }}
                    >
                      <option value="">Select Village</option>
                      {getVillageOptions(row).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                      <option value={OTHER_OPTION}>Other</option>
                    </select>
                  ) : (
                    <input
                      className="grid-input"
                      placeholder="Village"
                      value={row.village_name}
                      onChange={(e) => handleCellChange(row.id, "village_name", e.target.value)}
                    />
                  )}
                </td>

                {MONTH_COLUMNS.map((col, idx) => {
                  const value = row[col as MonthColumn];
                  const status = getMonthStatus(row, value, idx);
                  const editable = isMonthEditable(idx);
                  const monthNumber = idx + 1;
                  const isPendingCell = status === "PENDING";

                  return (
                    <td
                      key={col}
                      className={`grid-td p-0 border ${getMonthBg(status)} ${
                        editable ? "" : "opacity-80"
                      }`}
                      title={
                        status === "APPROVED"
                          ? "Approved"
                          : status === "PENDING"
                          ? "Waiting for approval"
                          : status === "REJECTED"
                          ? "Rejected"
                          : "Not submitted"
                      }
                    >
                      <div className="flex items-center">
                        <input
                          type="number"
                          min={0}
                          className={`grid-input bg-transparent ${
                            editable ? "" : "text-muted-foreground"
                          }`}
                          value={value === 0 ? "" : value}
                          onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                          disabled={!editable}
                        />
                        {isAdmin && isPendingCell && (
                          <div className="pr-1 flex items-center gap-0.5">
                            <button
                              type="button"
                              className="h-4 w-4 rounded text-[9px] leading-none bg-green-600 text-white"
                              title="Approve"
                              onClick={() => handleApprovalAction(row.id, monthNumber, "APPROVED")}
                            >
                              A
                            </button>
                            <button
                              type="button"
                              className="h-4 w-4 rounded text-[9px] leading-none bg-fuchsia-600 text-white"
                              title="Reject"
                              onClick={() => handleApprovalAction(row.id, monthNumber, "REJECTED")}
                            >
                              R
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NonLocalRecordsGrid;
