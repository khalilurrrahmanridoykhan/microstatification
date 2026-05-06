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
  getUniformMonthColumnWidth,
  getDhakaMonth,
  getDhakaYear,
} from "@/lib/monthUtils";
import {
  Check,
  Columns3,
  Loader2,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  approveNonLocalRecordMetadata,
  createNonLocalRecord,
  deleteNonLocalRecord,
  fetchMalariaMasterData,
  fetchMonthlyApprovals,
  fetchMalariaGridColumnLayout,
  fetchMonthAccessSettings,
  fetchNonLocalRecordsPage,
  rejectNonLocalRecordMetadata,
  saveMalariaGridColumnLayout,
  upsertMonthlyApproval,
  updateNonLocalRecord,
  type AuthProfile,
  type ApprovalRow,
  type MalariaMasterData,
  type NonLocalRecord,
  type NonLocalRecordPayload,
} from "@/lib/api";

interface NonLocalRow extends NonLocalRecord {
  _isNew?: boolean;
}

function nonLocalRowMetaClasses(row: NonLocalRow): string {
  if (row._isNew) return "bg-sky-50/70 hover:bg-sky-100/70";
  if (row.metadata_approval_status === "PENDING") return "bg-amber-50/85 hover:bg-amber-100/75";
  if (row.metadata_approval_status === "REJECTED") return "bg-fuchsia-50/75 hover:bg-fuchsia-100/70";
  return "hover:bg-gray-50";
}

function nonLocalMetaCellBg(row: NonLocalRow): string {
  if (row._isNew) return "bg-sky-50/70";
  if (row.metadata_approval_status === "PENDING") return "bg-amber-50/85";
  if (row.metadata_approval_status === "REJECTED") return "bg-fuchsia-50/75";
  return "bg-white";
}

function profileScopeId(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function resolveProfileDistrictFilterName(
  profile: AuthProfile | null | undefined,
  masterData: MalariaMasterData,
): string | null {
  if (!profile) return null;

  const did = profileScopeId(profile.micro_district);
  if (did != null) {
    const district = masterData.districts.find((item) => item.id === did);
    return district?.name ?? null;
  }

  const upid = profileScopeId(profile.micro_upazila);
  if (upid != null) {
    const upazila = masterData.upazilas.find((item) => item.id === upid);
    const district = upazila ? masterData.districts.find((item) => item.id === upazila.district_id) : undefined;
    return district?.name ?? null;
  }

  const uid = profileScopeId(profile.micro_union);
  if (uid != null) {
    const union = masterData.unions.find((item) => item.id === uid);
    const upazila = union ? masterData.upazilas.find((item) => item.id === union.upazila_id) : undefined;
    const district = upazila ? masterData.districts.find((item) => item.id === upazila.district_id) : undefined;
    return district?.name ?? null;
  }

  const vid = profileScopeId(profile.micro_village);
  if (vid != null) {
    const village = masterData.villages.find((item) => item.id === vid);
    const union = village ? masterData.unions.find((item) => item.id === village.union_id) : undefined;
    const upazila = union ? masterData.upazilas.find((item) => item.id === union.upazila_id) : undefined;
    const district = upazila ? masterData.districts.find((item) => item.id === upazila.district_id) : undefined;
    return district?.name ?? null;
  }

  const multiIds = (profile.micro_villages || [])
    .map((id) => profileScopeId(id))
    .filter((n): n is number => n != null);
  if (multiIds.length > 0) {
    const names = new Set<string>();
    for (const id of multiIds) {
      const village = masterData.villages.find((item) => item.id === id);
      const union = village ? masterData.unions.find((item) => item.id === village.union_id) : undefined;
      const upazila = union ? masterData.upazilas.find((item) => item.id === union.upazila_id) : undefined;
      const district = upazila ? masterData.districts.find((item) => item.id === upazila.district_id) : undefined;
      if (district?.name) names.add(district.name);
    }
    if (names.size === 1) return [...names][0];
  }

  return null;
}

function resolveProfileDistrictId(
  profile: AuthProfile | null | undefined,
  masterData: MalariaMasterData,
): number | null {
  const districtName = resolveProfileDistrictFilterName(profile, masterData);
  if (!districtName) return null;
  return masterData.districts.find((district) => district.name === districtName)?.id ?? null;
}

type CellStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
type NonLocalEditableField =
  | "country"
  | "district_or_state"
  | "upazila_or_township"
  | "union_name"
  | "village_name"
  | MonthColumn;
type NonLocalExtraEditableField =
  | "division_name"
  | "name_of_sk_shw"
  | "designation"
  | "name_of_ss"
  | "village_name_bn"
  | "village_code"
  | "latitude"
  | "longitude"
  | "population_text"
  | "hh_text"
  | "itn_2026_text"
  | "itn_2025_text"
  | "itn_2024_text"
  | "mmw_hp_chwc_name"
  | "village_distance_km"
  | "border_country_name"
  | "other_activities";

const COUNTRIES = ["Bangladesh", "India", "Myanmar"];
const OTHER_OPTION = "__other__";
/** Column labels for layout width heuristics (actions + SL + geo + Jan–Dec). */
const NON_LOCAL_HEADER_LABELS = ["", "SL", "Country", "Division / State", "District", "Upazila", "Union", ...MONTH_LABELS];

const NON_LOCAL_TABLE_COL_COUNT = NON_LOCAL_HEADER_LABELS.length;
const NON_LOCAL_LIST_FIELDS = [
  "id",
  "sk_user_id",
  "reporting_year",
  "country",
  "district_or_state",
  "upazila_or_township",
  "union_name",
  "village_name",
  ...MONTH_COLUMNS,
  "metadata_approval_status",
  "metadata_rejection_note",
  "division_name",
  "name_of_sk_shw",
  "designation",
  "name_of_ss",
  "village_name_bn",
  "village_code",
  "latitude",
  "longitude",
  "population_text",
  "hh_text",
  "itn_2026_text",
  "itn_2025_text",
  "itn_2024_text",
  "mmw_hp_chwc_name",
  "village_distance_km",
  "border_country_name",
  "other_activities",
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
  settings: Array<{ month: number; close_date: string | null; district_id?: number | null }>,
): Set<number> {
  const today = getDhakaTodayIso();
  const closeDateByMonth = new Map<number, string>();

  // Keep the latest district-scoped setting per month.
  const districtFirst = [...settings].sort((a, b) => {
    const aPriority = a.district_id ? 1 : 0;
    const bPriority = b.district_id ? 1 : 0;
    return bPriority - aPriority;
  });

  districtFirst.forEach((item) => {
    if (closeDateByMonth.has(item.month)) {
      return;
    }
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

function buildNonLocalMetadataFlat(row: NonLocalRow): Record<string, string> {
  return {
    division_name: row.division_name || "",
    name_of_sk_shw: row.name_of_sk_shw || "",
    designation: row.designation || "",
    name_of_ss: row.name_of_ss || "",
    village_name_bn: row.village_name_bn || "",
    village_code: row.village_code || "",
    latitude: row.latitude || "",
    longitude: row.longitude || "",
    population_text: row.population_text || "",
    hh_text: row.hh_text || "",
    itn_2026_text: row.itn_2026_text || "",
    itn_2025_text: row.itn_2025_text || "",
    itn_2024_text: row.itn_2024_text || "",
    mmw_hp_chwc_name: row.mmw_hp_chwc_name || "",
    village_distance_km: row.village_distance_km || "",
    border_country_name: row.border_country_name || "",
    other_activities: row.other_activities || "",
  };
}

function buildPayload(row: NonLocalRow, isAdminUser: boolean, includeNonAdminMetadataSubmission: boolean): NonLocalRecordPayload {
  const base: NonLocalRecordPayload = {
    reporting_year: row.reporting_year,
    country: row.country.trim() || "Bangladesh",
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
  const flat = buildNonLocalMetadataFlat(row);
  if (isAdminUser) {
    base.grid_metadata = flat;
  } else if (includeNonAdminMetadataSubmission) {
    base.metadata_submission = flat;
  }
  return base;
}

const NonLocalRecordsGrid = () => {
  const { user, role, profile } = useAuth();
  const { toast } = useToast();
  const isGlobalAdmin = role === "admin";
  const isPrivileged = role === "admin" || role === "dm";
  const isSpo = role === "spo";
  const isAdmin = isPrivileged;
  const currentMonth = getDhakaMonth();
  const currentYear = getDhakaYear();

  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<NonLocalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const dirtyNonLocalMetadataRowIdsRef = useRef<Set<string>>(new Set());
  const [openMonthNumbers, setOpenMonthNumbers] = useState<Set<number>>(new Set([currentMonth]));
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const [isExpandedToHeaderWidth, setIsExpandedToHeaderWidth] = useState(false);
  const previousColumnWidthsRef = useRef<Record<number, number> | null>(null);
  const appliedServerLayoutRef = useRef(false);
  const [savingLayout, setSavingLayout] = useState(false);
  const [approvalRows, setApprovalRows] = useState<ApprovalRow[]>([]);
  const [recordView, setRecordView] = useState<"all" | "pending">("all");
  const [metadataActionBusyId, setMetadataActionBusyId] = useState<string | null>(null);
  const [masterData, setMasterData] = useState<MalariaMasterData>({
    districts: [],
    upazilas: [],
    unions: [],
    villages: [],
  });
  const [otherModeByRow, setOtherModeByRow] = useState<
    Record<string, Partial<Record<"country" | "district" | "upazila" | "union", boolean>>>
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

    if (!isPrivileged && year === currentYear && monthNumber === currentMonth) {
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
    rows.forEach((r) => {
      if (r.metadata_approval_status === "PENDING") {
        ids.add(r.id);
      }
    });
    return ids;
  }, [approvalRows, rows]);

  const displayedRows = useMemo(() => {
    if (!isPrivileged) return rows;  // SPO sees all their records
    if (recordView === "all") return rows;  // DM/Admin can see all records
    return rows.filter((row) => pendingRecordIds.has(row.id));  // Filter to pending approval
  }, [rows, isPrivileged, recordView, pendingRecordIds]);

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

  const handleApproveNonLocalMetadata = async (id: string) => {
    if (metadataActionBusyId !== null) return;
    try {
      setMetadataActionBusyId(id);
      const updated = await approveNonLocalRecordMetadata(id);
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? ({ ...r, ...updated, ...(r._isNew ? { _isNew: true as const } : {}) } as NonLocalRow) : r,
        ),
      );
      toast({ title: "Metadata approved" });
    } catch (error) {
      toast({
        title: "Approve failed",
        description: error instanceof Error ? error.message : "Could not approve metadata.",
        variant: "destructive",
      });
    } finally {
      setMetadataActionBusyId(null);
    }
  };

  const handleRejectNonLocalMetadata = async (id: string) => {
    if (metadataActionBusyId !== null) return;
    try {
      setMetadataActionBusyId(id);
      const updated = await rejectNonLocalRecordMetadata(id);
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? ({ ...r, ...updated, ...(r._isNew ? { _isNew: true as const } : {}) } as NonLocalRow) : r,
        ),
      );
      toast({ title: "Metadata rejected" });
    } catch (error) {
      toast({
        title: "Reject failed",
        description: error instanceof Error ? error.message : "Could not reject metadata.",
        variant: "destructive",
      });
    } finally {
      setMetadataActionBusyId(null);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const requestPageSize = 100;
      const skUserId = isPrivileged ? undefined : user.id;
      let firstPage = await fetchNonLocalRecordsPage({
        year,
        page: 1,
        pageSize: requestPageSize,
        fields: NON_LOCAL_LIST_FIELDS,
        skUserId,
      });
      let effectiveYear = year;

      if (firstPage.results.length === 0) {
        const latestPage = await fetchNonLocalRecordsPage({
          year: "latest",
          page: 1,
          pageSize: requestPageSize,
          fields: NON_LOCAL_LIST_FIELDS,
          skUserId,
        });
        if (latestPage.results.length > 0) {
          firstPage = latestPage;
          effectiveYear = latestPage.results[0].reporting_year;
        }
      }

      if (effectiveYear !== year) {
        setYear(effectiveYear);
      }

      setRows(firstPage.results);
      const approvals = await fetchMonthlyApprovals({
        recordType: "non_local",
        reportingYear: effectiveYear,
      });
      setApprovalRows(approvals);
      setDirtyIds(new Set());
      setDeletedIds([]);

      // Load remaining pages in the background to keep first paint fast.
      void (async () => {
        let nextUrl = firstPage.next;
        const seen = new Set(firstPage.results.map((row) => row.id));
        while (nextUrl) {
          const nextPageParam = new URL(nextUrl, window.location.origin).searchParams.get("page");
          const pageNumber = Number(nextPageParam || "0");
          if (!Number.isFinite(pageNumber) || pageNumber < 2) break;
          const pageData = await fetchNonLocalRecordsPage({
            year: effectiveYear,
            page: pageNumber,
            pageSize: requestPageSize,
            fields: NON_LOCAL_LIST_FIELDS,
            skUserId,
          });
          setRows((prev) => [
            ...prev,
            ...pageData.results.filter((row) => {
              if (seen.has(row.id)) return false;
              seen.add(row.id);
              return true;
            }),
          ]);
          nextUrl = pageData.next;
        }
      })();
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
    if (!isSpo) return;
    let mounted = true;
    const loadMonthAccess = async () => {
      try {
        const settings = await fetchMonthAccessSettings(year);
        const assignedDistrictId = resolveProfileDistrictId(profile, masterData);
        const scopedSettings = assignedDistrictId
          ? settings.filter((item) => Number(item.district_id) === assignedDistrictId)
          : [];
        const open = computeOpenMonthNumbers(year, scopedSettings);
        if (mounted) {
          setOpenMonthNumbers(open);
        }
      } catch (_error) {
        if (mounted) {
          setOpenMonthNumbers(new Set());
        }
      }
    };
    void loadMonthAccess();
    return () => {
      mounted = false;
    };
  }, [year, isSpo, profile, masterData]);

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

  const pendingActionMonthColumnIndexesRef = useRef<Set<number>>(new Set());
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
  pendingActionMonthColumnIndexesRef.current = pendingActionMonthColumnIndexes;

  useEffect(() => {
    setColumnWidths((prev) => {
      if (appliedServerLayoutRef.current && !isAdmin) {
        return prev;
      }
      if (Object.keys(prev).length > 0) {
        return prev;
      }
      const next: Record<number, number> = {};
      NON_LOCAL_HEADER_LABELS.forEach((label, index) => {
        next[index] = estimateHeaderWidth(label);
      });
      const narrowMonth = getUniformMonthColumnWidth();
      for (let index = NON_LOCAL_MONTH_COLUMN_START_INDEX; index <= NON_LOCAL_MONTH_COLUMN_END_INDEX; index += 1) {
        const monthLabel = MONTH_LABELS[index - NON_LOCAL_MONTH_COLUMN_START_INDEX] || "";
        next[index] = pendingActionMonthColumnIndexes.has(index)
          ? estimateMonthColumnWithActionsWidth(monthLabel)
          : narrowMonth;
      }
      return next;
    });
  }, [pendingActionMonthColumnIndexes, isAdmin]);

  useEffect(() => {
    setColumnWidths((prev) => {
      if (appliedServerLayoutRef.current) {
        return prev;
      }
      if (Object.keys(prev).length === 0) {
        return prev;
      }
      const next = { ...prev };
      let changed = false;
      const narrowMonth = getUniformMonthColumnWidth();
      for (let index = NON_LOCAL_MONTH_COLUMN_START_INDEX; index <= NON_LOCAL_MONTH_COLUMN_END_INDEX; index += 1) {
        const width = next[index] || 0;
        const monthLabel = MONTH_LABELS[index - NON_LOCAL_MONTH_COLUMN_START_INDEX] || "";
        const isPending = pendingActionMonthColumnIndexes.has(index);
        if (!isPending) {
          if (touchedColumnIndexesRef.current.has(index)) {
            continue;
          }
          if (width !== narrowMonth) {
            next[index] = narrowMonth;
            touchedColumnIndexesRef.current.delete(index);
            changed = true;
          }
          continue;
        }
        if (touchedColumnIndexesRef.current.has(index)) {
          continue;
        }
        const targetWidth = estimateMonthColumnWithActionsWidth(monthLabel);
        if (targetWidth !== width) {
          next[index] = targetWidth;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pendingActionMonthColumnIndexes, isAdmin]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchMalariaGridColumnLayout("non_local_records");
        if (cancelled) return;
        const raw = data.column_widths || {};
        const hasSaved = Object.keys(raw).some((k) => {
          const v = raw[k];
          return typeof v === "number" && Number.isFinite(v) && v >= 10;
        });
        if (!hasSaved) return;
        appliedServerLayoutRef.current = true;
        setIsExpandedToHeaderWidth(Boolean(data.is_expanded_to_header_width));
        setColumnWidths((prev) => {
          const next: Record<number, number> = { ...prev };
          for (let i = 0; i < NON_LOCAL_TABLE_COL_COUNT; i += 1) {
            const sv = raw[String(i)] ?? (raw as Record<number, number>)[i];
            if (typeof sv === "number" && Number.isFinite(sv) && sv >= 10) {
              next[i] = Math.round(sv);
            } else if (next[i] == null) {
              next[i] = 72;
            }
          }
          return next;
        });
      } catch (_error) {
        // No saved layout or network error — keep heuristic widths.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  const handleSaveColumnLayoutForEveryone = async () => {
    if (!isGlobalAdmin) return;
    try {
      setSavingLayout(true);
      const narrowMonth = getUniformMonthColumnWidth();
      const column_widths: Record<number, number> = { ...columnWidths };
      for (let index = NON_LOCAL_MONTH_COLUMN_START_INDEX; index <= NON_LOCAL_MONTH_COLUMN_END_INDEX; index += 1) {
        const w = columnWidths[index];
        if (typeof w === "number" && Number.isFinite(w) && w >= 10) {
          column_widths[index] = Math.round(w);
        } else {
          const monthLabel = MONTH_LABELS[index - NON_LOCAL_MONTH_COLUMN_START_INDEX] || "";
          column_widths[index] = pendingActionMonthColumnIndexes.has(index)
            ? estimateMonthColumnWithActionsWidth(monthLabel)
            : narrowMonth;
        }
      }
      await saveMalariaGridColumnLayout("non_local_records", {
        column_widths,
        is_expanded_to_header_width: isExpandedToHeaderWidth,
      });
      appliedServerLayoutRef.current = true;
      setColumnWidths(column_widths);
      toast({
        title: "Column layout saved",
        description: "All users will see these column widths on their next visit or refresh, including Jan–Dec.",
      });
    } catch (error) {
      toast({
        title: "Could not save layout",
        description: error instanceof Error ? error.message : "Only malaria admins can publish column layouts.",
        variant: "destructive",
      });
    } finally {
      setSavingLayout(false);
    }
  };

  const toggleExpandToHeaderWidth = () => {
    if (!isExpandedToHeaderWidth) {
      previousColumnWidthsRef.current = { ...columnWidths };
      const expandedWidths: Record<number, number> = {};
      NON_LOCAL_HEADER_LABELS.forEach((label, index) => {
        expandedWidths[index] = estimateHeaderWidth(label);
      });
      const narrowMonth = getUniformMonthColumnWidth();
      for (let index = NON_LOCAL_MONTH_COLUMN_START_INDEX; index <= NON_LOCAL_MONTH_COLUMN_END_INDEX; index += 1) {
        const monthLabel = MONTH_LABELS[index - NON_LOCAL_MONTH_COLUMN_START_INDEX] || "";
        expandedWidths[index] = pendingActionMonthColumnIndexes.has(index)
          ? estimateMonthColumnWithActionsWidth(monthLabel)
          : narrowMonth;
      }
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

  const deleteRow = async (id: string) => {
    const row = rows.find((r) => String(r.id) === String(id));
    if (!row) {
      toast({
        title: "Delete failed",
        description: "Could not find that row. Try reloading the table.",
        variant: "destructive",
      });
      return;
    }

    if (isAdmin && !row._isNew) {
      try {
        await deleteNonLocalRecord(String(row.id));
      } catch (error) {
        toast({
          title: "Delete failed",
          description: error instanceof Error ? error.message : "Failed to delete record.",
          variant: "destructive",
        });
        return;
      }
    } else if (!row._isNew) {
      setDeletedIds((prev) => [...prev, String(id)]);
    }

    setRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
    setDirtyIds((prev) => {
      const next = new Set(prev);
      for (const dirtyId of prev) {
        if (String(dirtyId) === String(id)) {
          next.delete(dirtyId);
        }
      }
      return next;
    });
    setOtherModeByRow((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (isAdmin && !row._isNew) {
      toast({ title: "Row deleted" });
    }
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

  const handleExtraFieldChange = (rowId: string, field: NonLocalExtraEditableField, value: string) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? ({ ...row, [field]: value } as NonLocalRow) : row)));
    dirtyNonLocalMetadataRowIdsRef.current.add(rowId);
    setDirtyIds((prev) => new Set(prev).add(rowId));
  };

  const setOtherMode = (
    rowId: string,
    field: "country" | "district" | "upazila" | "union",
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete removed
      for (const id of deletedIds) {
        await deleteNonLocalRecord(id);
      }

      const dirty = rows.filter((r) => dirtyIds.has(r.id));

      for (const r of dirty) {
        const includeMeta =
          !isAdmin && (r._isNew || dirtyNonLocalMetadataRowIdsRef.current.has(r.id));
        if (r._isNew) {
          await createNonLocalRecord(buildPayload(r, isAdmin, includeMeta));
        } else {
          await updateNonLocalRecord(r.id, buildPayload(r, isAdmin, includeMeta));
        }
      }

      await fetchData();
      dirtyNonLocalMetadataRowIdsRef.current.clear();
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
  const canEditOwnNewRow = (row: NonLocalRow) =>
    isSpo && !!user && row._isNew && String(row.sk_user_id) === String(user.id);
  const canEditLocationField = (row: NonLocalRow) => isAdmin || canEditOwnNewRow(row);
  const canEditNonLocalMetadata = (row: NonLocalRow) => {
    if (isAdmin) return true;
    if (!isSpo || !user || String(row.sk_user_id) !== String(user.id)) return false;
    if (row._isNew) return canEditOwnNewRow(row);
    return true;
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const hasDirty = dirtyIds.size > 0 || deletedIds.length > 0;

  const handleDownloadXlsx = () => {
    const exportRows = displayedRows.map((row, index) => ({
      SL: index + 1,
      Country: row.country || "",
      "Division / State": row.division_name || "",
      District: row.district_or_state || "",
      Upazila: row.upazila_or_township || "",
      Union: row.union_name || "",
      January: row.jan_cases,
      February: row.feb_cases,
      March: row.mar_cases,
      April: row.apr_cases,
      May: row.may_cases,
      June: row.jun_cases,
      July: row.jul_cases,
      August: row.aug_cases,
      September: row.sep_cases,
      October: row.oct_cases,
      November: row.nov_cases,
      December: row.dec_cases,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Imported Records");
    XLSX.writeFile(workbook, `malaria_imported_filtered_${year}.xlsx`);
  };

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

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadXlsx}
          disabled={loading || displayedRows.length === 0}
        >
          Download Data
        </Button>

        <Button variant="outline" size="icon" onClick={toggleExpandToHeaderWidth} title="Toggle full-width columns">
          {isExpandedToHeaderWidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        {isGlobalAdmin && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => void handleSaveColumnLayoutForEveryone()}
            disabled={savingLayout || loading}
            title="Publish column layout for everyone (SPO and admins). Jan–Dec widths are normalized to standard month sizes; other columns use your current sizes."
            aria-label="Save column layout for all users"
          >
            {savingLayout ? <Loader2 className="h-4 w-4 animate-spin" /> : <Columns3 className="h-4 w-4" />}
          </Button>
        )}
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
            {Array.from({ length: NON_LOCAL_TABLE_COL_COUNT }).map((_, index) => (
              <col key={index} style={columnWidths[index] ? { width: `${columnWidths[index]}px` } : undefined} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-gray-50 border-b">
            <tr>
              {renderHeaderCell("", 0, "grid-th min-w-[10px]")}
              {renderHeaderCell("SL", 1, "grid-th min-w-[10px] sticky left-0 bg-gray-50 z-20")}
              {renderHeaderCell("Country", 2, "grid-th min-w-[10px]")}
              {renderHeaderCell("Division / State", 3, "grid-th min-w-[10px]")}
              {renderHeaderCell("District", 4, "grid-th min-w-[10px]")}
              {renderHeaderCell("Upazila", 5, "grid-th min-w-[10px]")}
              {renderHeaderCell("Union", 6, "grid-th min-w-[10px]")}
              {MONTH_LABELS.map((m, idx) => (
                renderHeaderCell(
                  <span className={`month-th-label${isExpandedToHeaderWidth ? " month-th-label-horizontal" : ""}`}>
                    {m}
                  </span>,
                  NON_LOCAL_MONTH_COLUMN_START_INDEX + idx,
                  `grid-th min-w-[10px]${isExpandedToHeaderWidth ? " month-th-horizontal" : " month-th"}`,
                )
              ))}
            </tr>
          </thead>

          <tbody>
            {displayedRows.length === 0 && !loading && (
              <tr>
                <td colSpan={NON_LOCAL_TABLE_COL_COUNT} className="text-center py-8 text-muted-foreground">
                  {isAdmin && recordView === "pending"
                    ? "No pending records for current filters (monthly submissions or metadata approval)."
                    : `No records for ${year}`}
                </td>
              </tr>
            )}

            {displayedRows.map((row, index) => (
              <tr
                key={row.id}
                className={nonLocalRowMetaClasses(row)}
                title={
                  row.metadata_approval_status === "REJECTED"
                    ? row.metadata_rejection_note || "Metadata rejected"
                    : row.metadata_approval_status === "PENDING"
                      ? "Metadata pending approval"
                      : undefined
                }
              >
                <td className={`grid-td p-1 text-center align-top min-w-[52px] ${nonLocalMetaCellBg(row)}`}>
                  <div className="flex flex-col items-center gap-0.5">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        className="text-destructive hover:text-destructive/80 p-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {isAdmin && row.metadata_approval_status === "PENDING" && !row._isNew && (
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          className="rounded border border-emerald-300 bg-emerald-50 p-0.5 hover:bg-emerald-100 disabled:opacity-50"
                          title="Approve metadata"
                          disabled={metadataActionBusyId !== null}
                          onClick={() => void handleApproveNonLocalMetadata(row.id)}
                        >
                          {metadataActionBusyId === row.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-emerald-800" />
                          ) : (
                            <Check className="h-3 w-3 text-emerald-800" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="rounded border border-fuchsia-300 bg-fuchsia-50 p-0.5 hover:bg-fuchsia-100 disabled:opacity-50"
                          title="Reject metadata"
                          disabled={metadataActionBusyId !== null}
                          onClick={() => void handleRejectNonLocalMetadata(row.id)}
                        >
                          {metadataActionBusyId === row.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-fuchsia-800" />
                          ) : (
                            <X className="h-3 w-3 text-fuchsia-800" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className={`grid-td sticky left-0 z-[5] font-medium ${nonLocalMetaCellBg(row)}`}>
                  {index + 1}
                </td>

                <td className="grid-td p-0">
                  {otherModeByRow[row.id]?.country ? (
                    <input
                      className="grid-input"
                      placeholder="Enter country"
                      value={row.country}
                      onChange={(e) => handleCellChange(row.id, "country", e.target.value)}
                      disabled={!canEditLocationField(row)}
                    />
                  ) : (
                    <select
                      className="grid-input bg-transparent"
                      value={row.country}
                      disabled={!canEditLocationField(row)}
                      onChange={(e) => {
                        if (e.target.value === OTHER_OPTION) {
                          setOtherMode(row.id, "country", true);
                          handleCellChange(row.id, "country", row.country.trim() || "Other");
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
                  {canEditNonLocalMetadata(row) ? (
                    <input
                      className="grid-input"
                      value={row.division_name || (row.country === "Bangladesh" ? "Chattogram" : "")}
                      onChange={(e) => handleExtraFieldChange(row.id, "division_name", e.target.value)}
                    />
                  ) : (
                    <span>{row.division_name || ("Bangladesh" === row.country ? "Chattogram" : "-")}</span>
                  )}
                </td>

                <td className="grid-td p-0">
                  {row.country === "Bangladesh" && !otherModeByRow[row.id]?.district ? (
                    <select
                      className="grid-input bg-transparent"
                      value={row.district_or_state}
                      disabled={!canEditLocationField(row)}
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
                      disabled={!canEditLocationField(row)}
                    />
                  )}
                </td>

                <td className="grid-td p-0">
                  {row.country === "Bangladesh" && !otherModeByRow[row.id]?.upazila ? (
                    <select
                      className="grid-input bg-transparent"
                      value={row.upazila_or_township}
                      disabled={!canEditLocationField(row)}
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
                      disabled={!canEditLocationField(row)}
                    />
                  )}
                </td>

                <td className="grid-td p-0">
                  {row.country === "Bangladesh" && !otherModeByRow[row.id]?.union ? (
                    <select
                      className="grid-input bg-transparent"
                      value={row.union_name}
                      disabled={!canEditLocationField(row)}
                      onChange={(e) => {
                        if (e.target.value === OTHER_OPTION) {
                          setOtherMode(row.id, "union", true);
                          handleCellChange(row.id, "union_name", "");
                          return;
                        }
                        setOtherMode(row.id, "union", false);
                        handleCellChange(row.id, "union_name", e.target.value);
                        handleCellChange(row.id, "village_name", "");
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
                      disabled={!canEditLocationField(row)}
                    />
                  )}
                </td>

                {MONTH_COLUMNS.map((col, idx) => {
                  const value = row[col as MonthColumn];
                  const status = getMonthStatus(row, value, idx);
                  const editable = canEditOwnNewRow(row) || isMonthEditable(idx);
                  const monthNumber = idx + 1;
                  const isPendingCell = status === "PENDING";

                  return (
                    <td
                      key={col}
                      className={`grid-td p-0 border ${getMonthBg(status)} ${isAdmin && isPendingCell ? "!overflow-visible whitespace-normal align-middle" : ""
                        } ${editable ? "" : "opacity-80"}`}
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
                      {isAdmin && isPendingCell ? (
                        <div className="flex min-w-0 items-center gap-0 px-0 py-0.5">
                          <input
                            type="number"
                            min={0}
                            className={`grid-input bg-transparent min-w-0 flex-1 !w-auto !overflow-visible !text-clip ${editable ? "" : "text-muted-foreground"}`}
                            value={value === 0 ? "" : value}
                            onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                            disabled={!editable}
                          />
                          <div className="flex shrink-0 items-center gap-0.5 pr-0.5">
                            <button
                              type="button"
                              className="h-4 w-4 shrink-0 rounded text-[9px] leading-none bg-green-600 text-white"
                              title="Approve"
                              onClick={() => handleApprovalAction(row.id, monthNumber, "APPROVED")}
                            >
                              A
                            </button>
                            <button
                              type="button"
                              className="h-4 w-4 shrink-0 rounded text-[9px] leading-none bg-fuchsia-600 text-white"
                              title="Reject"
                              onClick={() => handleApprovalAction(row.id, monthNumber, "REJECTED")}
                            >
                              R
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-w-0 items-center">
                          <input
                            type="number"
                            min={0}
                            className={`grid-input bg-transparent ${editable ? "" : "text-muted-foreground"}`}
                            value={value === 0 ? "" : value}
                            onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                            disabled={!editable}
                          />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NonLocalRecordsGrid;
