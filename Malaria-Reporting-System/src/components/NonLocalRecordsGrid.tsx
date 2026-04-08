import { useEffect, useState, useCallback, useMemo } from "react";
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
  getDhakaDateString,
  getDhakaMonth,
  getDhakaYear,
  getMonthTotal,
} from "@/lib/monthUtils";
import {
  buildDefaultMonthAccessLookup,
  buildMonthAccessLookup,
  type MonthAccessLookup,
  type MonthAccessRow,
} from "@/lib/monthAccess";
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

interface UpazilaOption {
  id: string;
  name: string;
  district_id: string;
}

interface UnionOption {
  id: string;
  name: string;
  upazila_id: string;
}

interface VillageOption {
  id: string;
  name: string;
  ward_no: string | null;
  union_id: string;
}

type LocationField =
  | "country"
  | "district_or_state"
  | "upazila_or_township"
  | "union_name"
  | "village_name";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
type MonthCellStatus = "NEUTRAL" | "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

interface ApprovalRow {
  record_id: string;
  month: number;
  status: ApprovalStatus;
}

const COUNTRIES = ["Bangladesh", "India", "Myanmar"];
const COUNTRY_OPTIONS = COUNTRIES.map((name) => ({ name }));
const DEFAULT_DISTRICT_NAME = "Bandarban";
const BANGLADESH_COUNTRY = "Bangladesh";
const OTHER_LOCATION_OPTION_VALUE = "__other__";
const NON_LOCAL_RECORD_SELECT_COLUMNS = [
  "id",
  "sk_user_id",
  "reporting_year",
  "country",
  "district_or_state",
  "upazila_or_township",
  "union_name",
  "village_name",
  ...MONTH_COLUMNS,
].join(",");

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

const normalizeName = (value: unknown) => String(value ?? "").trim();

const isBangladeshCountry = (country: string) =>
  normalizeName(country).toLowerCase() === BANGLADESH_COUNTRY.toLowerCase();

const hasMatchingNamedOption = (
  options: Array<{ name: string }>,
  value: string,
) => {
  const normalizedValue = normalizeName(value).toLowerCase();
  if (!normalizedValue) return false;
  return options.some(
    (option) => normalizeName(option.name).toLowerCase() === normalizedValue,
  );
};

const NonLocalRecordsGrid = () => {
  const { user, role, microRole } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "admin";
  const isMicroAdmin = isAdmin && microRole === "micro_admin";
  const currentMonth = getDhakaMonth();
  const currentYear = getDhakaYear();
  const todayDateString = getDhakaDateString();
  const isMobile = useIsMobile();

  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<NonLocalRow[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [upazilas, setUpazilas] = useState<UpazilaOption[]>([]);
  const [unions, setUnions] = useState<UnionOption[]>([]);
  const [villages, setVillages] = useState<VillageOption[]>([]);
  const [selectedDistrictName, setSelectedDistrictName] = useState(DEFAULT_DISTRICT_NAME);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [explicitZeroMonthKeys, setExplicitZeroMonthKeys] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<10 | 20 | 50 | -1>(10);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [approvalLookup, setApprovalLookup] = useState<Record<string, ApprovalStatus>>({});
  const [approvalSavingKey, setApprovalSavingKey] = useState<string | null>(null);
  const [customLocationFields, setCustomLocationFields] = useState<Record<string, boolean>>({});
  const [monthAccessLookup, setMonthAccessLookup] = useState<MonthAccessLookup>(() =>
    buildDefaultMonthAccessLookup(year, todayDateString),
  );

  // -------- Color Logic (No DB Change) --------
  const getApprovalKey = (recordId: string, monthNumber: number) =>
    `${recordId}:${monthNumber}`;
  const getMonthCellKey = (recordId: string, field: string) => `${recordId}:${field}`;

  const getMonthApprovalStatus = (recordId: string, monthNumber: number) =>
    approvalLookup[getApprovalKey(recordId, monthNumber)] || null;

  const getMonthStatus = (row: NonLocalRow, monthIndex: number): MonthCellStatus => {
    const monthNumber = monthIndex + 1;
    const value = Number((row as any)[MONTH_COLUMNS[monthIndex]] || 0);
    const hasData = value > 0;
    const approvalStatus = getMonthApprovalStatus(row.id, monthNumber);
    const isFutureMonth =
      year > currentYear || (year === currentYear && monthNumber > currentMonth);
    const isFieldMonthOpen = Boolean(monthAccessLookup[monthNumber]);

    if (hasData) {
      if (approvalStatus === "APPROVED") return "APPROVED";
      if (approvalStatus === "REJECTED") return "REJECTED";
      return "PENDING";
    }

    if (approvalStatus === "REJECTED") return "REJECTED";
    if (approvalStatus === "APPROVED") return "APPROVED";
    if (isFieldMonthOpen || isFutureMonth) return "NEUTRAL";
    return "NOT_SUBMITTED";
  };

  const isMonthEditable = (row: NonLocalRow, monthIndex: number) => {
    if (isAdmin) return true;

    const monthNumber = monthIndex + 1;
    const approvalStatus = getMonthApprovalStatus(row.id, monthNumber);
    if (approvalStatus === "REJECTED") return true;
    return Boolean(monthAccessLookup[monthNumber]);
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
      let recordsQuery = supabase
        .from("non_local_records")
        .select(NON_LOCAL_RECORD_SELECT_COLUMNS)
        .eq("reporting_year", year);

      if (!isAdmin) {
        recordsQuery = recordsQuery.eq("sk_user_id", user.id);
      }

      if (isMicroAdmin && selectedDistrictName !== "all") {
        recordsQuery = recordsQuery.eq("district_or_state", selectedDistrictName);
      }

      const [recordsResult, approvalResult] = await Promise.all([
        recordsQuery,
        supabase
          .from("monthly_approvals")
          .select("record_id, month, status")
          .eq("record_type", "non_local")
          .eq("reporting_year", year),
      ]);

      if (recordsResult.error) throw recordsResult.error;
      if (approvalResult.error) throw approvalResult.error;

      const nextRows = (recordsResult.data || []) as NonLocalRow[];

      const visibleRecordIds = new Set(nextRows.map((row: NonLocalRow) => String(row.id)));
      const nextApprovalLookup = Object.fromEntries(
        ((approvalResult.data || []) as ApprovalRow[])
          .filter((approval) => visibleRecordIds.has(String(approval.record_id)))
          .map((approval) => [
            getApprovalKey(String(approval.record_id), Number(approval.month)),
            approval.status,
          ]),
      );

      setRows(nextRows);
      setExplicitZeroMonthKeys((prev) => {
        const next = new Set<string>();
        const rowById = new Map(nextRows.map((row) => [String(row.id), row]));
        prev.forEach((cellKey) => {
          const separatorIndex = cellKey.indexOf(":");
          if (separatorIndex === -1) return;
          const rowId = cellKey.slice(0, separatorIndex);
          const field = cellKey.slice(separatorIndex + 1);
          if (!MONTH_COLUMNS.includes(field as (typeof MONTH_COLUMNS)[number])) {
            return;
          }
          const row = rowById.get(rowId);
          if (row && Number((row as any)[field] || 0) === 0) {
            next.add(cellKey);
          }
        });
        return next;
      });
      setApprovalLookup(nextApprovalLookup);
      setCustomLocationFields({});
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

    const loadMasterData = async () => {
      try {
        const [districtResult, upazilaResult, unionResult, villageResult] = await Promise.all([
          supabase.from("districts").select("id,name").order("name"),
          supabase.from("upazilas").select("id,name,district_id").order("name"),
          supabase.from("unions").select("id,name,upazila_id").order("name"),
          supabase.from("villages").select("id,name,ward_no,union_id").order("name"),
        ]);

        if (districtResult.error) throw districtResult.error;
        if (upazilaResult.error) throw upazilaResult.error;
        if (unionResult.error) throw unionResult.error;
        if (villageResult.error) throw villageResult.error;
        if (canceled) return;

        const districtOptions = (districtResult.data || []).map((item: any) => ({
          id: String(item.id),
          name: item.name,
        }));

        setDistricts(districtOptions);
        setUpazilas((upazilaResult.data || []).map((item: any) => ({
          id: String(item.id),
          name: item.name,
          district_id: String(item.district_id),
        })));
        setUnions((unionResult.data || []).map((item: any) => ({
          id: String(item.id),
          name: item.name,
          upazila_id: String(item.upazila_id),
        })));
        setVillages((villageResult.data || []).map((item: any) => ({
          id: String(item.id),
          name: item.name,
          ward_no: item.ward_no ?? null,
          union_id: String(item.union_id),
        })));

        if (isMicroAdmin) {
          setSelectedDistrictName((currentValue) => {
            if (currentValue && currentValue !== "all") {
              return currentValue;
            }

            const hasBandarban = districtOptions.some(
              (district) => district.name === DEFAULT_DISTRICT_NAME,
            );

            return hasBandarban ? DEFAULT_DISTRICT_NAME : "all";
          });
        } else {
          setSelectedDistrictName("all");
        }
      } catch (err: any) {
        if (canceled) return;
        toast({
          title: "District load error",
          description: err.message,
          variant: "destructive",
        });
      }
    };

    void loadMasterData();

    return () => {
      canceled = true;
    };
  }, [isMicroAdmin, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let canceled = false;

    const loadMonthAccess = async () => {
      try {
        const { data, error } = await supabase
          .from("month_access_settings")
          .select("id,reporting_year,month,is_open,close_date")
          .eq("reporting_year", year);

        if (error) throw error;
        if (canceled) return;

        setMonthAccessLookup(
          buildMonthAccessLookup(
            ((data || []) as MonthAccessRow[]),
            year,
            todayDateString,
          ),
        );
      } catch (err: any) {
        if (canceled) return;
        setMonthAccessLookup(buildDefaultMonthAccessLookup(year, todayDateString));
        toast({
          title: "Month access load error",
          description: err.message,
          variant: "destructive",
        });
      }
    };

    void loadMonthAccess();

    return () => {
      canceled = true;
    };
  }, [year, todayDateString, toast]);

  useEffect(() => {
    if (loading) {
      setShowLoadingScreen(true);
    }
  }, [loading]);

  const districtIdByName = useMemo(
    () =>
      Object.fromEntries(
        districts.map((district) => [normalizeName(district.name), district.id]),
      ) as Record<string, string>,
    [districts],
  );

  const upazilasByDistrictId = useMemo(() => {
    const grouped: Record<string, UpazilaOption[]> = {};
    upazilas.forEach((upazila) => {
      if (!grouped[upazila.district_id]) {
        grouped[upazila.district_id] = [];
      }
      grouped[upazila.district_id].push(upazila);
    });
    return grouped;
  }, [upazilas]);

  const unionsByUpazilaId = useMemo(() => {
    const grouped: Record<string, UnionOption[]> = {};
    unions.forEach((union) => {
      if (!grouped[union.upazila_id]) {
        grouped[union.upazila_id] = [];
      }
      grouped[union.upazila_id].push(union);
    });
    return grouped;
  }, [unions]);

  const villagesByUnionId = useMemo(() => {
    const grouped: Record<string, VillageOption[]> = {};
    villages.forEach((village) => {
      if (!grouped[village.union_id]) {
        grouped[village.union_id] = [];
      }
      grouped[village.union_id].push(village);
    });
    return grouped;
  }, [villages]);

  const getUpazilaOptionsForRow = useCallback(
    (row: NonLocalRow) => {
      const districtId = districtIdByName[normalizeName(row.district_or_state)];
      return districtId ? upazilasByDistrictId[districtId] || [] : [];
    },
    [districtIdByName, upazilasByDistrictId],
  );

  const getUnionOptionsForRow = useCallback(
    (row: NonLocalRow) => {
      const matchingUpazila = getUpazilaOptionsForRow(row).find(
        (option) => normalizeName(option.name) === normalizeName(row.upazila_or_township),
      );
      return matchingUpazila ? unionsByUpazilaId[matchingUpazila.id] || [] : [];
    },
    [getUpazilaOptionsForRow, unionsByUpazilaId],
  );

  const getVillageOptionsForRow = useCallback(
    (row: NonLocalRow) => {
      const matchingUnion = getUnionOptionsForRow(row).find(
        (option) => normalizeName(option.name) === normalizeName(row.union_name),
      );
      return matchingUnion ? villagesByUnionId[matchingUnion.id] || [] : [];
    },
    [getUnionOptionsForRow, villagesByUnionId],
  );

  const updateRow = useCallback(
    (rowId: string, updater: (row: NonLocalRow) => NonLocalRow) => {
      setRows((prev) => prev.map((row) => (row.id === rowId ? updater(row) : row)));
      setDirtyIds((prev) => new Set(prev).add(rowId));
    },
    [],
  );

  const getLocationFieldModeKey = useCallback(
    (rowId: string, field: LocationField) => `${rowId}:${field}`,
    [],
  );

  const setLocationFieldOtherMode = useCallback(
    (rowId: string, field: LocationField, enabled: boolean) => {
      const key = getLocationFieldModeKey(rowId, field);
      setCustomLocationFields((prev) => {
        if (enabled) {
          return prev[key] ? prev : { ...prev, [key]: true };
        }

        if (!(key in prev)) {
          return prev;
        }

        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [getLocationFieldModeKey],
  );

  const clearLocationFieldOtherModes = useCallback(
    (rowId: string, fields: LocationField[]) => {
      setCustomLocationFields((prev) => {
        let changed = false;
        const next = { ...prev };

        fields.forEach((field) => {
          const key = getLocationFieldModeKey(rowId, field);
          if (key in next) {
            delete next[key];
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    },
    [getLocationFieldModeKey],
  );

  const isLocationFieldOtherMode = useCallback(
    (
      rowId: string,
      field: LocationField,
      value: string,
      options: Array<{ name: string }>,
    ) => {
      const key = getLocationFieldModeKey(rowId, field);
      return Boolean(customLocationFields[key])
        || (Boolean(normalizeName(value)) && !hasMatchingNamedOption(options, value));
    },
    [customLocationFields, getLocationFieldModeKey],
  );

  const addRow = () => {
    if (!user) return;
    const newRow: NonLocalRow = {
      id: createRowId(),
      sk_user_id: user.id,
      reporting_year: year,
      country: BANGLADESH_COUNTRY,
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
    setExplicitZeroMonthKeys((prev) => {
      const next = new Set<string>();
      prev.forEach((cellKey) => {
        if (!cellKey.startsWith(`${id}:`)) {
          next.add(cellKey);
        }
      });
      return next;
    });
    clearLocationFieldOtherModes(id, [
      "country",
      "district_or_state",
      "upazila_or_township",
      "union_name",
      "village_name",
    ]);
  };

  const handleCellChange = (rowId: string, field: string, value: string) => {
    if (MONTH_COLUMNS.includes(field as any)) {
      const num = value === "" ? 0 : parseInt(value, 10);
      if (isNaN(num) || num < 0) return;

      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, [field]: num } : r)),
      );
      setExplicitZeroMonthKeys((prev) => {
        const next = new Set(prev);
        const cellKey = getMonthCellKey(rowId, field);
        if (value === "") {
          next.delete(cellKey);
        } else if (num === 0) {
          next.add(cellKey);
        } else {
          next.delete(cellKey);
        }
        return next;
      });
    } else {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
      );
    }

    setDirtyIds((prev) => new Set(prev).add(rowId));
  };

  const handleCountryChange = (rowId: string, country: string) => {
    clearLocationFieldOtherModes(rowId, [
      "district_or_state",
      "upazila_or_township",
      "union_name",
      "village_name",
    ]);
    updateRow(rowId, (row) => {
      if (!isBangladeshCountry(country)) {
        return { ...row, country };
      }

      const currentDistrictName = normalizeName(row.district_or_state);
      const hasCurrentDistrict = districts.some(
        (district) => normalizeName(district.name) === currentDistrictName,
      );
      const nextDistrictName =
        hasCurrentDistrict
          ? row.district_or_state
          : (isMicroAdmin && selectedDistrictName !== "all" ? selectedDistrictName : "");

      return {
        ...row,
        country,
        district_or_state: nextDistrictName,
        upazila_or_township: hasCurrentDistrict ? row.upazila_or_township : "",
        union_name: hasCurrentDistrict ? row.union_name : "",
        village_name: hasCurrentDistrict ? row.village_name : "",
      };
    });
  };

  const handleDistrictChange = (rowId: string, districtName: string) => {
    clearLocationFieldOtherModes(rowId, [
      "upazila_or_township",
      "union_name",
      "village_name",
    ]);
    updateRow(rowId, (row) => ({
      ...row,
      district_or_state: districtName,
      upazila_or_township: "",
      union_name: "",
      village_name: "",
    }));
  };

  const handleUpazilaChange = (rowId: string, upazilaName: string) => {
    clearLocationFieldOtherModes(rowId, ["union_name", "village_name"]);
    updateRow(rowId, (row) => ({
      ...row,
      upazila_or_township: upazilaName,
      union_name: "",
      village_name: "",
    }));
  };

  const handleUnionChange = (rowId: string, unionName: string) => {
    clearLocationFieldOtherModes(rowId, ["village_name"]);
    updateRow(rowId, (row) => ({
      ...row,
      union_name: unionName,
      village_name: "",
    }));
  };

  const handleVillageChange = (rowId: string, villageName: string) => {
    updateRow(rowId, (row) => ({
      ...row,
      village_name: villageName,
    }));
  };

  const renderBangladeshLocationCell = (
    row: NonLocalRow,
    field: LocationField,
    options: Array<{ id?: string; name: string; ward_no?: string | null }>,
    placeholder: string,
    onSelectValueChange: (rowId: string, value: string) => void,
    disabled = false,
  ) => {
    const value = String(row[field] || "");
    const otherMode = isLocationFieldOtherMode(row.id, field, value, options);

    return (
      <td className="grid-td p-0">
        <div className="flex h-full flex-col">
          <select
            className="grid-input bg-transparent"
            value={otherMode ? OTHER_LOCATION_OPTION_VALUE : value}
            onChange={(event) => {
              const nextValue = event.target.value;

              if (nextValue === OTHER_LOCATION_OPTION_VALUE) {
                setLocationFieldOtherMode(row.id, field, true);
                onSelectValueChange(row.id, "");
                return;
              }

              setLocationFieldOtherMode(row.id, field, false);
              onSelectValueChange(row.id, nextValue);
            }}
            disabled={disabled}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.id ?? option.name} value={option.name}>
                {option.name}
                {"ward_no" in option && option.ward_no ? ` (Ward ${option.ward_no})` : ""}
              </option>
            ))}
            <option value={OTHER_LOCATION_OPTION_VALUE}>Other</option>
          </select>

          {otherMode && (
            <input
              className="grid-input border-t border-black/5"
              value={value}
              onChange={(event) => handleCellChange(row.id, field, event.target.value)}
              placeholder="Type here"
            />
          )}
        </div>
      </td>
    );
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
                  <th key={m} className="grid-th grid-th-month min-w-[28px] w-[28px]">
                    <div className="grid-th-month-content">
                      <span className="grid-th-month-label">{m}</span>
                    </div>
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
                      <div className="flex h-full flex-col">
                        <select
                          className="grid-input bg-transparent"
                          value={
                            isLocationFieldOtherMode(
                              row.id,
                              "country",
                              row.country,
                              COUNTRY_OPTIONS,
                            )
                              ? OTHER_LOCATION_OPTION_VALUE
                              : row.country
                          }
                          onChange={(e) => {
                            const nextValue = e.target.value;

                            if (nextValue === OTHER_LOCATION_OPTION_VALUE) {
                              setLocationFieldOtherMode(row.id, "country", true);
                              handleCountryChange(row.id, "");
                              return;
                            }

                            setLocationFieldOtherMode(row.id, "country", false);
                            handleCountryChange(row.id, nextValue);
                          }}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value={OTHER_LOCATION_OPTION_VALUE}>Other</option>
                        </select>

                        {isLocationFieldOtherMode(
                          row.id,
                          "country",
                          row.country,
                          COUNTRY_OPTIONS,
                        ) && (
                          <input
                            className="grid-input border-t border-black/5"
                            value={row.country}
                            onChange={(e) => handleCellChange(row.id, "country", e.target.value)}
                            placeholder="Type country"
                          />
                        )}
                      </div>
                    </td>

                    {isBangladeshCountry(row.country) ? (
                      renderBangladeshLocationCell(
                        row,
                        "district_or_state",
                        districts,
                        "Select district",
                        handleDistrictChange,
                      )
                    ) : (
                      <td className="grid-td p-0">
                        <input
                          className="grid-input"
                          value={row.district_or_state}
                          onChange={(e) => handleCellChange(row.id, "district_or_state", e.target.value)}
                        />
                      </td>
                    )}

                    {isBangladeshCountry(row.country) ? (
                      renderBangladeshLocationCell(
                        row,
                        "upazila_or_township",
                        getUpazilaOptionsForRow(row),
                        "Select upazila",
                        handleUpazilaChange,
                        !normalizeName(row.district_or_state),
                      )
                    ) : (
                      <td className="grid-td p-0">
                        <input
                          className="grid-input"
                          value={row.upazila_or_township}
                          onChange={(e) => handleCellChange(row.id, "upazila_or_township", e.target.value)}
                        />
                      </td>
                    )}

                    {isBangladeshCountry(row.country) ? (
                      renderBangladeshLocationCell(
                        row,
                        "union_name",
                        getUnionOptionsForRow(row),
                        "Select union",
                        handleUnionChange,
                        !normalizeName(row.upazila_or_township),
                      )
                    ) : (
                      <td className="grid-td p-0">
                        <input
                          className="grid-input"
                          value={row.union_name}
                          onChange={(e) => handleCellChange(row.id, "union_name", e.target.value)}
                        />
                      </td>
                    )}

                    {isBangladeshCountry(row.country) ? (
                      renderBangladeshLocationCell(
                        row,
                        "village_name",
                        getVillageOptionsForRow(row),
                        "Select village",
                        handleVillageChange,
                        !normalizeName(row.union_name),
                      )
                    ) : (
                      <td className="grid-td p-0">
                        <input
                          className="grid-input"
                          value={row.village_name}
                          onChange={(e) => handleCellChange(row.id, "village_name", e.target.value)}
                        />
                      </td>
                    )}

                    {MONTH_COLUMNS.map((col, idx) => {
                      const value = (row as any)[col] as number;
                      const monthNumber = idx + 1;
                      const status = getMonthStatus(row, idx);
                      const editable = isMonthEditable(row, idx);
                      const showExplicitZero = explicitZeroMonthKeys.has(
                        getMonthCellKey(row.id, col),
                      );
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
                              value={value > 0 || showExplicitZero ? String(value) : ""}
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
