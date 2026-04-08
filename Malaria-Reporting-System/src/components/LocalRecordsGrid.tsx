import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
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
  getDhakaMonth,
  getDhakaYear,
} from "@/lib/monthUtils";
import { exportRowsToXlsx } from "@/lib/xlsxExport";
import { Download, RefreshCw, Save } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import DataGridLoadingScreen from "@/components/DataGridLoadingScreen";

interface LocalRow {
  id: string;
  village_id: string;
  sk_user_id: string;
  assigned_sk_shw_name?: string;
  assigned_ss_name?: string;
  reporting_year: number;
  hh: number;
  population: number;
  itn_2023: number;
  itn_2024: number;
  itn_2025: number;
  itn_2026: number;
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
  district_name?: string;
  upazila_name?: string;
  union_name?: string;
  village_name?: string;
  village_name_bn?: string;
  village_code?: string;
  village_latitude?: string | number | null;
  village_longitude?: string | number | null;
  village_population?: string | number | null;
  village_sk_shw_name?: string;
  village_ss_name?: string;
  raw_village_sk_shw_name?: string;
  raw_village_ss_name?: string;
  village_mmw_hp_chwc_name?: string;
  village_distance_from_upazila_office_km?: string | number | null;
  village_bordering_country_name?: string;
  village_other_activities?: string;
  sk_user_designation?: string;
  ward_no?: string | null;
}

interface DistrictOption {
  id: string;
  name: string;
}

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
type CellStatus = "NEUTRAL" | "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

interface ApprovalRow {
  record_id: string;
  month: number;
  status: ApprovalStatus;
}

const COUNTRY_NAME = "Bangladesh";
const DEFAULT_DISTRICT_NAME = "Bandarban";
const DIVISION_BY_DISTRICT: Record<string, string> = {
  Bandarban: "Chattogram",
  Khagrachhari: "Chattogram",
  "Cox's Bazar": "Chattogram",
  Rangamati: "Chattogram",
  Chattogram: "Chattogram",
};

const FULL_MONTH_LABELS: Record<(typeof MONTH_COLUMNS)[number], string> = {
  jan_cases: "January",
  feb_cases: "February",
  mar_cases: "March",
  apr_cases: "April",
  may_cases: "May",
  jun_cases: "June",
  jul_cases: "July",
  aug_cases: "August",
  sep_cases: "September",
  oct_cases: "October",
  nov_cases: "November",
  dec_cases: "December",
};

const DEFAULT_LOCAL_TEXT_COLUMN_WIDTH = 60;
const DEFAULT_LOCAL_NARROW_COLUMN_WIDTH = 42;
const DEFAULT_LOCAL_MONTH_COLUMN_WIDTH = 52;
const MIN_LOCAL_TEXT_COLUMN_WIDTH = 40;
const MIN_LOCAL_NARROW_COLUMN_WIDTH = 30;
const MIN_LOCAL_MONTH_COLUMN_WIDTH = 40;

type LocalGridColumnKey =
  | "sl"
  | "country"
  | "division"
  | "district_name"
  | "upazila_name"
  | "union_name"
  | "ward_no"
  | "village_sk_shw_name"
  | "sk_user_designation"
  | "village_ss_name"
  | "village_name"
  | "village_name_bn"
  | "village_code"
  | "village_latitude"
  | "village_longitude"
  | "population"
  | "hh"
  | "itn_2026"
  | "itn_2025"
  | "itn_2024"
  | (typeof MONTH_COLUMNS)[number]
  | "village_mmw_hp_chwc_name"
  | "village_distance_from_upazila_office_km"
  | "village_bordering_country_name"
  | "village_other_activities";

interface LocalGridColumn {
  key: LocalGridColumnKey;
  label: string;
  minWidth: number;
  defaultWidth?: number;
  sticky?: boolean;
}

const LOCAL_RECORD_COLUMNS: LocalGridColumn[] = [
  { key: "sl", label: "SL", minWidth: 30, defaultWidth: 38, sticky: true },
  { key: "country", label: "Country", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "division", label: "Division", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "district_name", label: "District", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "upazila_name", label: "Upazila", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "union_name", label: "Union", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "ward_no", label: "Ward No", minWidth: MIN_LOCAL_NARROW_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_NARROW_COLUMN_WIDTH },
  { key: "village_sk_shw_name", label: "Name of SK/SHW", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "sk_user_designation", label: "Desig.", minWidth: MIN_LOCAL_NARROW_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_NARROW_COLUMN_WIDTH },
  { key: "village_ss_name", label: "Name of SS", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "village_name", label: "Village Name (English)", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "village_name_bn", label: "Village Name (Bangla)", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "village_code", label: "Village Code", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "village_latitude", label: "Latitude", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "village_longitude", label: "Longitute", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "population", label: "Population", minWidth: MIN_LOCAL_NARROW_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_NARROW_COLUMN_WIDTH },
  { key: "hh", label: "HH Number", minWidth: MIN_LOCAL_NARROW_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_NARROW_COLUMN_WIDTH },
  { key: "itn_2026", label: "2026 (Active LLINs)", minWidth: MIN_LOCAL_MONTH_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_MONTH_COLUMN_WIDTH },
  { key: "itn_2025", label: "2025 (Active LLINs)", minWidth: MIN_LOCAL_MONTH_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_MONTH_COLUMN_WIDTH },
  { key: "itn_2024", label: "2024 (Active LLINs)", minWidth: MIN_LOCAL_MONTH_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_MONTH_COLUMN_WIDTH },
  ...MONTH_COLUMNS.map((column) => ({
    key: column,
    label: FULL_MONTH_LABELS[column],
    minWidth: MIN_LOCAL_MONTH_COLUMN_WIDTH,
    defaultWidth: DEFAULT_LOCAL_MONTH_COLUMN_WIDTH,
  })),
  { key: "village_mmw_hp_chwc_name", label: "Name of MMW, Health post & CHW(C)", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "village_distance_from_upazila_office_km", label: "Village Distance from upazila office (KM)", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "village_bordering_country_name", label: "Name of Border with others country", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
  { key: "village_other_activities", label: "Others Activities (TDA/Dev care)", minWidth: MIN_LOCAL_TEXT_COLUMN_WIDTH, defaultWidth: DEFAULT_LOCAL_TEXT_COLUMN_WIDTH },
];

const LOCAL_RECORD_COLUMN_WIDTH_STORAGE_KEY = "malaria-local-record-column-widths-v6";
const LOCAL_RECORD_COLUMN_MIN_WIDTHS = LOCAL_RECORD_COLUMNS.reduce((acc, column) => {
  acc[column.key] = column.minWidth;
  return acc;
}, {} as Record<LocalGridColumnKey, number>);

const naturalTextCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const normalizeSortText = (value: unknown) => String(value ?? "").trim();

const compareNaturalText = (left: unknown, right: unknown) =>
  naturalTextCollator.compare(normalizeSortText(left), normalizeSortText(right));

const compareWardValues = (left: unknown, right: unknown) => {
  const leftText = normalizeSortText(left);
  const rightText = normalizeSortText(right);

  if (!leftText && !rightText) return 0;
  if (!leftText) return 1;
  if (!rightText) return -1;

  const leftPrimaryText = leftText.split(",")[0]?.trim() || leftText;
  const rightPrimaryText = rightText.split(",")[0]?.trim() || rightText;

  const leftNumber = Number(leftPrimaryText);
  const rightNumber = Number(rightPrimaryText);
  const leftIsNumber = Number.isFinite(leftNumber);
  const rightIsNumber = Number.isFinite(rightNumber);

  if (leftIsNumber && rightIsNumber && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  return naturalTextCollator.compare(leftText, rightText);
};

const sortLocalRows = (input: LocalRow[]) =>
  [...input].sort((left, right) => {
    const districtComparison = compareNaturalText(left.district_name, right.district_name);
    if (districtComparison !== 0) return districtComparison;

    const upazilaComparison = compareNaturalText(left.upazila_name, right.upazila_name);
    if (upazilaComparison !== 0) return upazilaComparison;

    const unionComparison = compareNaturalText(left.union_name, right.union_name);
    if (unionComparison !== 0) return unionComparison;

    const wardComparison = compareWardValues(left.ward_no, right.ward_no);
    if (wardComparison !== 0) return wardComparison;

    const villageComparison = compareNaturalText(left.village_name, right.village_name);
    if (villageComparison !== 0) return villageComparison;

    return compareNaturalText(left.id, right.id);
  });

const getLocalExportValue = (
  row: LocalRow,
  rowIndex: number,
  column: LocalGridColumn,
) => {
  switch (column.key) {
    case "sl":
      return rowIndex + 1;
    case "country":
      return COUNTRY_NAME;
    case "division":
      return DIVISION_BY_DISTRICT[String(row.district_name || "")] || "";
    case "district_name":
      return row.district_name || "";
    case "upazila_name":
      return row.upazila_name || "";
    case "union_name":
      return row.union_name || "";
    case "ward_no":
      return row.ward_no || "";
    case "village_sk_shw_name":
      return row.village_sk_shw_name || "";
    case "sk_user_designation":
      return row.sk_user_designation || "";
    case "village_ss_name":
      return row.village_ss_name || "";
    case "village_name":
      return row.village_name || "";
    case "village_name_bn":
      return row.village_name_bn || "";
    case "village_code":
      return row.village_code || "";
    case "village_latitude":
      return row.village_latitude ?? "";
    case "village_longitude":
      return row.village_longitude ?? "";
    case "population":
      return row.population ?? "";
    case "hh":
      return row.hh ?? "";
    case "itn_2026":
      return row.itn_2026 ?? "";
    case "itn_2025":
      return row.itn_2025 ?? "";
    case "itn_2024":
      return row.itn_2024 ?? "";
    case "village_mmw_hp_chwc_name":
      return row.village_mmw_hp_chwc_name || "";
    case "village_distance_from_upazila_office_km":
      return row.village_distance_from_upazila_office_km ?? "";
    case "village_bordering_country_name":
      return row.village_bordering_country_name || "";
    case "village_other_activities":
      return row.village_other_activities || "";
    default: {
      const value = Number((row as any)[column.key] || 0);
      return value > 0 ? value : "";
    }
  }
};

const buildDefaultColumnWidths = (): Record<LocalGridColumnKey, number> =>
  LOCAL_RECORD_COLUMNS.reduce((acc, column) => {
    acc[column.key] = column.defaultWidth ?? column.minWidth;
    return acc;
  }, {} as Record<LocalGridColumnKey, number>);

const loadColumnWidths = (): Record<LocalGridColumnKey, number> => {
  const defaults = buildDefaultColumnWidths();

  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_RECORD_COLUMN_WIDTH_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as Partial<Record<LocalGridColumnKey, number>>;
    const next = { ...defaults };

    LOCAL_RECORD_COLUMNS.forEach((column) => {
      const width = parsed[column.key];
      if (typeof width === "number" && Number.isFinite(width)) {
        next[column.key] = Math.max(column.minWidth, Math.round(width));
      }
    });

    return next;
  } catch {
    return defaults;
  }
};

type ResizeState = {
  key: LocalGridColumnKey;
  startX: number;
  startWidth: number;
};

const LocalRecordsGrid = () => {
  const { user, role, microRole } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "admin";
  const isMicroAdmin = isAdmin && microRole === "micro_admin";
  const currentMonth = getDhakaMonth();
  const currentYear = getDhakaYear();
  const isMobile = useIsMobile();

  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<LocalRow[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedUpazilaFilter, setSelectedUpazilaFilter] = useState("all");
  const [selectedUnionFilter, setSelectedUnionFilter] = useState("all");
  const [selectedWardFilter, setSelectedWardFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending">("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<10 | 20 | 50 | -1>(10);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [approvalLookup, setApprovalLookup] = useState<Record<string, ApprovalStatus>>({});
  const [approvalSavingKey, setApprovalSavingKey] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<LocalGridColumnKey, number>>(
    loadColumnWidths,
  );
  const resizeStateRef = useRef<ResizeState | null>(null);
  const canEditVillageMetadata = isAdmin;

  const getApprovalKey = (recordId: string, monthNumber: number) =>
    `${recordId}:${monthNumber}`;

  const getMonthApprovalStatus = (recordId: string, monthNumber: number) =>
    approvalLookup[getApprovalKey(recordId, monthNumber)] || null;

  const getMonthStatus = (row: LocalRow, monthIndex: number): CellStatus => {
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

  const isMonthEditable = (row: LocalRow, monthIndex: number) => {
    if (isAdmin) return true;
    if (year !== currentYear) return false;

    const monthNumber = monthIndex + 1;
    const approvalStatus = getMonthApprovalStatus(row.id, monthNumber);
    if (approvalStatus === "REJECTED") return true;
    return monthNumber === currentMonth;
  };

  const getMonthTitle = (status: CellStatus) => {
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

  const getMonthBg = (status: CellStatus) => {
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
    if (isMicroAdmin && !selectedDistrictId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("local_records")
        .select(
          `
          *,
          villages!inner (
            name,
            name_bn,
            village_code,
            latitude,
            longitude,
            population,
            ward_no,
            sk_shw_name,
            ss_name,
            mmw_hp_chwc_name,
            distance_from_upazila_office_km,
            bordering_country_name,
            other_activities,
            unions!inner (
              name,
              upazilas!inner (
                name,
                districts!inner ( name )
              )
            )
          )
        `,
        )
        .eq("reporting_year", year)
        .order("created_at");

      if (isMicroAdmin && selectedDistrictId !== "all") {
        query = query.eq("district_id", selectedDistrictId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map((record: any) => {
        const rawVillageSkShwName = record.villages?.sk_shw_name ?? "";
        const rawVillageSsName = record.villages?.ss_name ?? "";
        const assignedSkShwName = record.sk_user_display_name ?? "";
        const assignedSsName = record.sk_user_ss_name ?? "";

        return {
          ...record,
          assigned_sk_shw_name: assignedSkShwName,
          assigned_ss_name: assignedSsName,
          district_name: record.villages?.unions?.upazilas?.districts?.name ?? "",
          upazila_name: record.villages?.unions?.upazilas?.name ?? "",
          union_name: record.villages?.unions?.name ?? "",
          village_name: record.villages?.name ?? "",
          village_name_bn: record.villages?.name_bn ?? "",
          village_code: record.villages?.village_code ?? "",
          village_latitude: record.villages?.latitude ?? "",
          village_longitude: record.villages?.longitude ?? "",
          village_population: record.villages?.population ?? null,
          population:
            typeof record.population === "number" && record.population > 0
              ? record.population
              : (record.villages?.population ?? 0),
          village_sk_shw_name: assignedSkShwName || rawVillageSkShwName,
          village_ss_name: assignedSsName || rawVillageSsName,
          raw_village_sk_shw_name: rawVillageSkShwName,
          raw_village_ss_name: rawVillageSsName,
          village_mmw_hp_chwc_name: record.villages?.mmw_hp_chwc_name ?? "",
          village_distance_from_upazila_office_km:
            record.villages?.distance_from_upazila_office_km ?? "",
          village_bordering_country_name: record.villages?.bordering_country_name ?? "",
          village_other_activities: record.villages?.other_activities ?? "",
          sk_user_designation: record.sk_user_designation ?? "",
          ward_no: record.villages?.ward_no ?? "",
          itn_2026: typeof record.itn_2026 === "number" ? record.itn_2026 : 0,
        };
      });

      const { data: approvalData, error: approvalError } = await supabase
        .from("monthly_approvals")
        .select("record_id, month, status")
        .eq("record_type", "local")
        .eq("reporting_year", year);
      if (approvalError) throw approvalError;

      const visibleRecordIds = new Set(mapped.map((row) => String(row.id)));
      const nextApprovalLookup = Object.fromEntries(
        ((approvalData || []) as ApprovalRow[])
          .filter((approval) => visibleRecordIds.has(String(approval.record_id)))
          .map((approval) => [
            getApprovalKey(String(approval.record_id), Number(approval.month)),
            approval.status,
          ]),
      );

      setRows(mapped);
      setApprovalLookup(nextApprovalLookup);
      setDirtyIds(new Set());
      setCurrentPage(1);
    } catch (err: any) {
      toast({
        title: "Load error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, year, isMicroAdmin, selectedDistrictId, toast]);

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
        setSelectedDistrictId((currentValue) => {
          if (currentValue && currentValue !== "all") {
            return currentValue;
          }

          const bandarbanDistrict = options.find(
            (district) => district.name === DEFAULT_DISTRICT_NAME,
          );

          return bandarbanDistrict?.id ?? currentValue ?? "all";
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
      setSelectedDistrictId("all");
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

  useEffect(() => {
    setSelectedUpazilaFilter("all");
    setSelectedUnionFilter("all");
    setSelectedWardFilter("all");
  }, [selectedDistrictId, year]);

  useEffect(() => {
    setSelectedUnionFilter("all");
    setSelectedWardFilter("all");
  }, [selectedUpazilaFilter]);

  useEffect(() => {
    setSelectedWardFilter("all");
  }, [selectedUnionFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUpazilaFilter, selectedUnionFilter, selectedWardFilter, approvalFilter]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LOCAL_RECORD_COLUMN_WIDTH_STORAGE_KEY,
        JSON.stringify(columnWidths),
      );
    } catch {
      // Ignore storage errors and keep in-memory widths.
    }
  }, [columnWidths]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      const minWidth = LOCAL_RECORD_COLUMN_MIN_WIDTHS[resizeState.key];
      const nextWidth = Math.max(
        minWidth,
        Math.round(resizeState.startWidth + (event.clientX - resizeState.startX)),
      );

      setColumnWidths((prev) =>
        prev[resizeState.key] === nextWidth
          ? prev
          : { ...prev, [resizeState.key]: nextWidth },
      );
    };

    const handlePointerUp = () => {
      if (!resizeStateRef.current) return;
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const markRowDirty = (rowId: string) => {
    setDirtyIds((prev) => new Set(prev).add(rowId));
  };

  const handleIntegerCellChange = (
    rowId: string,
    field: keyof LocalRow,
    value: string,
  ) => {
    const num = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: num } : row)),
    );
    markRowDirty(rowId);
  };

  const handleValueChange = (
    rowId: string,
    field: keyof LocalRow,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
    markRowDirty(rowId);
  };

  const normalizeIntegerValue = (value: unknown) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const parsed = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }
    return Math.trunc(parsed);
  };

  const normalizeDecimalValue = (value: unknown) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const normalized = String(value).trim();
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return normalized;
  };

  const handleSave = async () => {
    if (dirtyIds.size === 0) return;
    setSaving(true);
    try {
      const dirtyRows = rows.filter((row) => dirtyIds.has(row.id));

      for (const row of dirtyRows) {
        const villageName = String(row.village_name || "").trim();
        if (!villageName) {
          throw new Error("Village name is required before saving.");
        }

        const updatePayload: Record<string, number> = {
          hh: normalizeIntegerValue(row.hh) ?? 0,
          population: normalizeIntegerValue(row.population) ?? 0,
          itn_2024: normalizeIntegerValue(row.itn_2024) ?? 0,
          itn_2025: normalizeIntegerValue(row.itn_2025) ?? 0,
          itn_2026: normalizeIntegerValue(row.itn_2026) ?? 0,
        };

        MONTH_COLUMNS.forEach((column) => {
          updatePayload[column] = normalizeIntegerValue((row as any)[column]) ?? 0;
        });

        const { error: localError } = await supabase
          .from("local_records")
          .update(updatePayload)
          .eq("id", row.id);
        if (localError) throw localError;

        if (canEditVillageMetadata) {
          const villagePayload = {
            name: villageName,
            name_bn: String(row.village_name_bn || "").trim(),
            village_code: String(row.village_code || "").trim(),
            ward_no: String(row.ward_no || "").trim() || null,
            sk_shw_name: String(
              row.assigned_sk_shw_name
                ? row.raw_village_sk_shw_name || ""
                : row.village_sk_shw_name || "",
            ).trim(),
            ss_name: String(
              row.assigned_ss_name
                ? row.raw_village_ss_name || ""
                : row.village_ss_name || "",
            ).trim(),
            latitude: normalizeDecimalValue(row.village_latitude),
            longitude: normalizeDecimalValue(row.village_longitude),
            population: normalizeIntegerValue(row.village_population),
            mmw_hp_chwc_name: String(row.village_mmw_hp_chwc_name || "").trim(),
            distance_from_upazila_office_km: normalizeDecimalValue(
              row.village_distance_from_upazila_office_km,
            ),
            bordering_country_name: String(row.village_bordering_country_name || "").trim(),
            other_activities: String(row.village_other_activities || "").trim(),
          };

          const { error: villageError } = await supabase
            .from("villages")
            .update(villagePayload)
            .eq("id", row.village_id);
          if (villageError) throw villageError;
        }
      }

      await fetchData();
      toast({ title: "Saved successfully" });
    } catch (err: any) {
      toast({
        title: "Save error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprovalChange = async (
    row: LocalRow,
    monthNumber: number,
    nextStatus: Extract<ApprovalStatus, "APPROVED" | "REJECTED">,
  ) => {
    const monthField = MONTH_COLUMNS[monthNumber - 1];
    const monthValue = Number((row as any)[monthField] || 0);
    if (!isAdmin || monthValue <= 0) return;

    const approvalKey = getApprovalKey(row.id, monthNumber);
    setApprovalSavingKey(approvalKey);
    try {
      const { error } = await supabase.from("monthly_approvals").upsert({
        record_type: "local",
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

  const years = Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);
  const selectedDistrictName =
    !selectedDistrictId || selectedDistrictId === "all"
      ? ""
      : districts.find((district) => district.id === selectedDistrictId)?.name ||
        "selected district";
  const sortedRows = useMemo(() => sortLocalRows(rows), [rows]);
  const upazilaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sortedRows
            .map((row) => String(row.upazila_name || "").trim())
            .filter(Boolean),
        ),
      ).sort(compareNaturalText),
    [sortedRows],
  );
  const unionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sortedRows
            .filter((row) =>
              selectedUpazilaFilter === "all"
                ? true
                : String(row.upazila_name || "").trim() === selectedUpazilaFilter,
            )
            .map((row) => String(row.union_name || "").trim())
            .filter(Boolean),
        ),
      ).sort(compareNaturalText),
    [sortedRows, selectedUpazilaFilter],
  );
  const wardOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sortedRows
            .filter((row) =>
              (selectedUpazilaFilter === "all"
                ? true
                : String(row.upazila_name || "").trim() === selectedUpazilaFilter)
              && (selectedUnionFilter === "all"
                ? true
                : String(row.union_name || "").trim() === selectedUnionFilter),
            )
            .map((row) => normalizeSortText(row.ward_no))
            .filter(Boolean),
        ),
      ).sort(compareWardValues),
    [sortedRows, selectedUpazilaFilter, selectedUnionFilter],
  );
  const filteredSortedRows = useMemo(
    () =>
      sortedRows.filter((row) => {
        if (
          selectedUpazilaFilter !== "all"
          && String(row.upazila_name || "").trim() !== selectedUpazilaFilter
        ) {
          return false;
        }

        if (
          selectedUnionFilter !== "all"
          && String(row.union_name || "").trim() !== selectedUnionFilter
        ) {
          return false;
        }

        if (
          selectedWardFilter !== "all"
          && normalizeSortText(row.ward_no) !== selectedWardFilter
        ) {
          return false;
        }

        if (approvalFilter === "pending") {
          return MONTH_COLUMNS.some(
            (_column, monthIndex) => getMonthStatus(row, monthIndex) === "PENDING",
          );
        }

        return true;
      }),
    [
      sortedRows,
      selectedUpazilaFilter,
      selectedUnionFilter,
      selectedWardFilter,
      approvalFilter,
    ],
  );
  const effectiveRowsPerPage = rowsPerPage === -1 ? filteredSortedRows.length || 1 : rowsPerPage;
  const totalPages = isMobile
    ? 1
    : Math.max(1, Math.ceil(filteredSortedRows.length / effectiveRowsPerPage));
  const pagedRows = isMobile
    ? filteredSortedRows
    : filteredSortedRows.slice(
        (currentPage - 1) * effectiveRowsPerPage,
        currentPage * effectiveRowsPerPage,
      );
  const visibleRows =
    filteredSortedRows.length === 0
      ? []
      : isMobile
        ? pagedRows
        : [
            ...pagedRows,
            ...Array.from(
              { length: Math.max(0, effectiveRowsPerPage - pagedRows.length) },
              () => null,
            ),
          ];

  const handleDownloadData = useCallback(() => {
    if (!isAdmin) return;

    if (filteredSortedRows.length === 0) {
      toast({
        title: "No data to download",
        description: "There are no rows in the current local table view.",
        variant: "destructive",
      });
      return;
    }

    exportRowsToXlsx({
      filename: `malaria-local-records-${year}.xlsx`,
      sheetName: `Local ${year}`,
      headers: LOCAL_RECORD_COLUMNS.map((column) => column.label),
      rows: filteredSortedRows.map((row, rowIndex) =>
        LOCAL_RECORD_COLUMNS.map((column) => getLocalExportValue(row, rowIndex, column)),
      ),
    });
  }, [filteredSortedRows, isAdmin, toast, year]);

  const getColumnWidth = (key: LocalGridColumnKey) =>
    columnWidths[key] ?? LOCAL_RECORD_COLUMN_MIN_WIDTHS[key];

  const getColumnStyle = (key: LocalGridColumnKey) => {
    const width = getColumnWidth(key);
    return {
      width,
      minWidth: width,
    };
  };

  const handleResizeStart = (
    event: React.PointerEvent<HTMLDivElement>,
    key: LocalGridColumnKey,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    resizeStateRef.current = {
      key,
      startX: event.clientX,
      startWidth: getColumnWidth(key),
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const renderReadOnlyCell = (
    column: LocalGridColumn,
    value: ReactNode,
    extraClassName = "",
  ) => (
    <td
      className={`grid-td ${column.sticky ? "sticky left-0 bg-white z-[5]" : ""} ${extraClassName}`}
      style={getColumnStyle(column.key)}
    >
      {value}
    </td>
  );

  const renderTextInputCell = (
    row: LocalRow,
    column: LocalGridColumn,
    field: keyof LocalRow,
    disabled: boolean,
  ) => (
    <td
      className={`grid-td p-0 ${column.sticky ? "sticky left-0 bg-white z-[5]" : ""}`}
      style={getColumnStyle(column.key)}
    >
      <input
        type="text"
        className="grid-input"
        value={String((row as any)[field] ?? "")}
        onChange={(event) => handleValueChange(row.id, field, event.target.value)}
        disabled={disabled}
      />
    </td>
  );

  const renderIntegerInputCell = (
    row: LocalRow,
    column: LocalGridColumn,
    field: keyof LocalRow,
    disabled = false,
    className = "",
  ) => (
    <td
      className={`grid-td p-0 ${column.sticky ? "sticky left-0 bg-white z-[5]" : ""}`}
      style={getColumnStyle(column.key)}
    >
      <input
        type="number"
        min={0}
        className={`grid-input ${className}`}
        value={String((row as any)[field] ?? 0)}
        onChange={(event) => handleIntegerCellChange(row.id, field, event.target.value)}
        disabled={disabled}
      />
    </td>
  );

  const renderColumnCell = (
    row: LocalRow,
    rowIndex: number,
    column: LocalGridColumn,
  ) => {
    const displayIndex =
      (isMobile ? 0 : (currentPage - 1) * effectiveRowsPerPage) + rowIndex + 1;

    switch (column.key) {
      case "sl":
        return renderReadOnlyCell(column, displayIndex, "font-medium text-center");
      case "country":
        return renderReadOnlyCell(column, COUNTRY_NAME);
      case "division":
        return renderReadOnlyCell(
          column,
          DIVISION_BY_DISTRICT[String(row.district_name || "")] || "",
        );
      case "district_name":
        return renderReadOnlyCell(column, row.district_name || "");
      case "upazila_name":
        return renderReadOnlyCell(column, row.upazila_name || "");
      case "union_name":
        return renderReadOnlyCell(column, row.union_name || "");
      case "sk_user_designation":
        return renderReadOnlyCell(column, row.sk_user_designation || "");
      case "ward_no":
        return renderTextInputCell(row, column, "ward_no", !canEditVillageMetadata);
      case "village_sk_shw_name":
        if (row.assigned_sk_shw_name) {
          return renderReadOnlyCell(column, row.village_sk_shw_name || "");
        }
        return renderTextInputCell(
          row,
          column,
          "village_sk_shw_name",
          !canEditVillageMetadata,
        );
      case "village_ss_name":
        if (row.assigned_ss_name) {
          return renderReadOnlyCell(column, row.village_ss_name || "");
        }
        return renderTextInputCell(row, column, "village_ss_name", !canEditVillageMetadata);
      case "village_name":
        return renderTextInputCell(row, column, "village_name", !canEditVillageMetadata);
      case "village_name_bn":
        return renderTextInputCell(
          row,
          column,
          "village_name_bn",
          !canEditVillageMetadata,
        );
      case "village_code":
        return renderTextInputCell(row, column, "village_code", !canEditVillageMetadata);
      case "village_latitude":
        return renderTextInputCell(
          row,
          column,
          "village_latitude",
          !canEditVillageMetadata,
        );
      case "village_longitude":
        return renderTextInputCell(
          row,
          column,
          "village_longitude",
          !canEditVillageMetadata,
        );
      case "population":
        return renderIntegerInputCell(row, column, "population");
      case "hh":
        return renderIntegerInputCell(row, column, "hh");
      case "itn_2026":
      case "itn_2025":
      case "itn_2024":
        return renderIntegerInputCell(
          row,
          column,
          column.key,
          !isAdmin,
          !isAdmin ? "bg-muted/30 text-muted-foreground" : "",
        );
      case "village_mmw_hp_chwc_name":
        return renderTextInputCell(
          row,
          column,
          "village_mmw_hp_chwc_name",
          !canEditVillageMetadata,
        );
      case "village_distance_from_upazila_office_km":
        return renderTextInputCell(
          row,
          column,
          "village_distance_from_upazila_office_km",
          !canEditVillageMetadata,
        );
      case "village_bordering_country_name":
        return renderTextInputCell(
          row,
          column,
          "village_bordering_country_name",
          !canEditVillageMetadata,
        );
      case "village_other_activities":
        return renderTextInputCell(
          row,
          column,
          "village_other_activities",
          !canEditVillageMetadata,
        );
      default: {
        const monthIndex = MONTH_COLUMNS.indexOf(column.key as (typeof MONTH_COLUMNS)[number]);
        if (monthIndex !== -1) {
          const value = Number((row as any)[column.key] || 0);
          const monthNumber = monthIndex + 1;
          const status = getMonthStatus(row, monthIndex);
          const editable = isMonthEditable(row, monthIndex);
          const approvalStatus = getMonthApprovalStatus(row.id, monthNumber);
          const hasData = value > 0;
          const isApprovalSaving = approvalSavingKey === getApprovalKey(row.id, monthNumber);
          const approvalDisabled = !hasData || isApprovalSaving || dirtyIds.has(row.id);

          return (
            <td
              className={`grid-td p-0 border ${getMonthBg(status)} ${editable ? "" : "opacity-80"} ${column.sticky ? "sticky left-0 bg-white z-[5]" : ""}`}
              style={getColumnStyle(column.key)}
              title={getMonthTitle(status)}
            >
              <div className="flex h-full flex-col">
                <input
                  type="number"
                  min={0}
                  className={`grid-input bg-transparent text-center ${editable ? "" : "text-muted-foreground"}`}
                  value={value > 0 ? String(value) : ""}
                  placeholder={editable ? "" : undefined}
                  onChange={(event) =>
                    handleIntegerCellChange(row.id, column.key, event.target.value)
                  }
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
        }

        return renderReadOnlyCell(column, "");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
            <SelectTrigger className="h-9 w-full min-w-[120px] sm:w-[140px]">
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

          {isMicroAdmin && (
            <Select
              value={selectedDistrictId}
              onValueChange={(value) => {
                setSelectedDistrictId(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full min-w-[170px] sm:w-[220px]">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={selectedUpazilaFilter}
            onValueChange={(value) => setSelectedUpazilaFilter(value)}
          >
            <SelectTrigger className="h-9 w-full min-w-[160px] sm:w-[190px]">
              <SelectValue placeholder="All Upazilas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Upazilas</SelectItem>
              {upazilaOptions.map((upazila) => (
                <SelectItem key={upazila} value={upazila}>
                  {upazila}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedUnionFilter}
            onValueChange={(value) => setSelectedUnionFilter(value)}
            disabled={selectedUpazilaFilter === "all"}
          >
            <SelectTrigger className="h-9 w-full min-w-[160px] sm:w-[190px]">
              <SelectValue placeholder="All Unions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Unions</SelectItem>
              {unionOptions.map((union) => (
                <SelectItem key={union} value={union}>
                  {union}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedWardFilter}
            onValueChange={(value) => setSelectedWardFilter(value)}
            disabled={selectedUnionFilter === "all"}
          >
            <SelectTrigger className="h-9 w-full min-w-[140px] sm:w-[160px]">
              <SelectValue placeholder="All Wards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wards</SelectItem>
              {wardOptions.map((ward) => (
                <SelectItem key={ward} value={ward}>
                  {ward}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={approvalFilter}
            onValueChange={(value: "all" | "pending") => setApprovalFilter(value)}
          >
            <SelectTrigger className="h-9 w-full min-w-[170px] sm:w-[210px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="pending">Waiting For Approval</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9"
          >
            <RefreshCw className="mr-1 h-4 w-4" /> Reload
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || dirtyIds.size === 0}
            className="h-9"
          >
            <Save className="mr-1 h-4 w-4" /> Save{" "}
            {dirtyIds.size > 0 && `(${dirtyIds.size})`}
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
              disabled={filteredSortedRows.length === 0}
              className="h-9"
            >
              <Download className="mr-1 h-4 w-4" /> Download Data
            </Button>
          )}
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
      </div>

      <div>
        <div className="relative">
          {loading && showLoadingScreen && (
            <DataGridLoadingScreen
              title="Refreshing local reporting table"
              description="Updating villages, reporting totals, monthly case values, and district-linked metadata for the current selection."
              cachedRows={rows.length}
              columnCount={LOCAL_RECORD_COLUMNS.length}
              rowCount={6}
              onDismiss={() => setShowLoadingScreen(false)}
            />
          )}
          <div className="max-h-[calc(100vh-240px)] overflow-auto bg-white md:max-h-[calc(100vh-260px)]">
            <table className="w-max min-w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 border-b bg-gray-50">
                <tr>
                  {LOCAL_RECORD_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={`grid-th relative ${column.sticky ? "sticky left-0 z-20 bg-gray-50" : ""}`}
                      style={getColumnStyle(column.key)}
                    >
                      <div className="pr-3 whitespace-normal break-words leading-tight">
                        {column.label}
                      </div>
                      <div
                        className="grid-col-resizer"
                        onPointerDown={(event) => handleResizeStart(event, column.key)}
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Resize ${column.label} column`}
                      />
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredSortedRows.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={LOCAL_RECORD_COLUMNS.length}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {sortedRows.length > 0
                        ? "No local records match the selected filters."
                        : isAdmin
                          ? `No local records for ${year}${selectedDistrictName ? ` in ${selectedDistrictName}` : ""}. Configure district, upazila, union, and village first, then assign SK users and reload.`
                          : `No local records for ${year}. Ask a malaria admin to assign villages to your account.`}
                    </td>
                  </tr>
                )}

                {visibleRows.map((row, rowIndex) =>
                  row ? (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {LOCAL_RECORD_COLUMNS.map((column) =>
                        renderColumnCell(row, rowIndex, column),
                      )}
                    </tr>
                  ) : (
                    <tr key={`empty-local-${rowIndex}`} className="hidden md:table-row">
                      {LOCAL_RECORD_COLUMNS.map((column) => (
                        <td
                          key={column.key}
                          className={`grid-td text-transparent ${column.sticky ? "sticky left-0 z-[5] bg-white" : ""}`}
                          style={getColumnStyle(column.key)}
                        >
                          .
                        </td>
                      ))}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {!isMobile && filteredSortedRows.length > 0 && (
        <div className="flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            Showing page {currentPage} of {totalPages}. Total rows: {filteredSortedRows.length}.
          </p>
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
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
                  onClick={(event) => {
                    event.preventDefault();
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

export default LocalRecordsGrid;
