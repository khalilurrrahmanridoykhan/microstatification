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
  getDhakaMonth,
  getDhakaYear,
  getMonthTotal,
} from "@/lib/monthUtils";
import { RefreshCw, Save } from "lucide-react";
import * as XLSX from "xlsx";
import {
  fetchMonthlyApprovals,
  fetchLocalRecords,
  fetchMonthAccessSettings,
  upsertMonthlyApproval,
  updateDistrict,
  updateLocalRecord,
  updateUnion,
  updateUpazila,
  updateVillage,
  type LocalRecord,
  type LocalRecordUpdate,
  type ApprovalRow,
  type VillageUpdatePayload,
} from "@/lib/api";

type CellStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
type LocalEditableField = keyof LocalRecordUpdate;

const itnColumns = ["itn_2026", "itn_2025", "itn_2024"] as const;

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

function buildUpdatePayload(row: LocalRecord): LocalRecordUpdate {
  return {
    hh: row.hh,
    population: row.population,
    itn_2026: row.itn_2026,
    itn_2023: row.itn_2023,
    itn_2024: row.itn_2024,
    itn_2025: row.itn_2025,
    sk_user_designation: row.sk_user_designation || "",
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

function buildVillageUpdatePayload(row: LocalRecord): VillageUpdatePayload {
  return {
    name: row.village_name || "",
    name_bn: row.village_name_bn || "",
    village_code: row.village_code || "",
    latitude: row.village_latitude,
    longitude: row.village_longitude,
    ward_no: row.ward_no || null,
    sk_shw_name: row.village_sk_shw_name || "",
    ss_name: row.village_ss_name || "",
    mmw_hp_chwc_name: row.village_mmw_hp_chwc_name || "",
    distance_from_upazila_office_km: row.village_distance_from_upazila_office_km,
    bordering_country_name: row.village_bordering_country_name || "",
    other_activities: row.village_other_activities || "",
  };
}

const LocalRecordsGrid = () => {
  const { user, role, profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "admin";
  const currentMonth = getDhakaMonth(); // 1..12
  const currentYear = getDhakaYear();

  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<LocalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedUpazila, setSelectedUpazila] = useState("all");
  const [selectedUnion, setSelectedUnion] = useState("all");
  const [selectedVillage, setSelectedVillage] = useState("all");
  const [selectedWard, setSelectedWard] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [openMonthNumbers, setOpenMonthNumbers] = useState<Set<number>>(new Set([currentMonth]));
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const [approvalRows, setApprovalRows] = useState<ApprovalRow[]>([]);
  const [recordView, setRecordView] = useState<"all" | "pending">("all");
  const resizingColumnRef = useRef<number | null>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  // ---- Color logic (no DB changes) ----
  // RED: value = 0
  // YELLOW: value > 0 AND (current month + current year) AND non-admin
  // GREEN: value > 0 otherwise
  const approvalByKey = useMemo(() => {
    const map = new Map<string, ApprovalRow["status"]>();
    for (const approval of approvalRows) {
      map.set(`${approval.record_id}:${approval.month}`, approval.status);
    }
    return map;
  }, [approvalRows]);

  const getMonthStatus = (row: LocalRecord, value: number, monthIndex: number): CellStatus => {
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
    // subtle but clear
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

  const handleApprovalAction = async (recordId: string, month: number, status: "APPROVED" | "REJECTED") => {
    try {
      await upsertMonthlyApproval({
        recordType: "local",
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
      let data = await fetchLocalRecords(year);
      let effectiveYear = year;

      if (data.length === 0) {
        const allRecords = await fetchLocalRecords();
        if (allRecords.length > 0) {
          const latestYear = Math.max(...allRecords.map((record) => record.reporting_year));
          data = allRecords.filter((record) => record.reporting_year === latestYear);
          effectiveYear = latestYear;
        }
      }

      if (effectiveYear !== year) {
        setYear(effectiveYear);
      }

      setRows(data);
      if (isAdmin) {
        const approvals = await fetchMonthlyApprovals({
          recordType: "local",
          reportingYear: effectiveYear,
        });
        setApprovalRows(approvals);
      } else {
        setApprovalRows([]);
      }
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

  const scopeFilteredRows = useMemo(() => {
    if (isAdmin || !user) return rows;

    const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
    const isNumericLike = (value: string) => /^\d+$/.test(value.trim());

    const districtScope = profile?.micro_district ? String(profile.micro_district).trim() : "";
    const upazilaScope = profile?.micro_upazila ? String(profile.micro_upazila).trim() : "";
    const unionScope = profile?.micro_union ? String(profile.micro_union).trim() : "";
    const villageScope = profile?.micro_village ? String(profile.micro_village).trim() : "";
    const villageScopes = new Set((profile?.micro_villages || []).map((id) => String(id).trim()));
    const wardNo = String(profile?.micro_ward_no || "").trim().toLowerCase();
    const hasScope =
      !!districtScope || !!upazilaScope || !!unionScope || !!villageScope || villageScopes.size > 0 || !!wardNo;

    // If no explicit scope metadata is available in session profile, trust backend-filtered rows.
    if (!hasScope) {
      return rows;
    }

    return rows.filter((row) => {
      if (villageScopes.size > 0) {
        const rowVillageId = String(row.village_id);
        const rowVillageName = normalize(row.village_name);
        return Array.from(villageScopes).some((scope) => {
          if (!scope) return false;
          if (isNumericLike(scope)) return rowVillageId === scope;
          return rowVillageName === normalize(scope);
        });
      }
      if (villageScope) {
        if (isNumericLike(villageScope)) return String(row.village_id) === villageScope;
        return normalize(row.village_name) === normalize(villageScope);
      }
      if (unionScope) {
        const unionMatched = isNumericLike(unionScope)
          ? String(row.union_id) === unionScope
          : normalize(row.union_name) === normalize(unionScope);
        if (!unionMatched) return false;
        if (wardNo) return String(row.ward_no || "").trim().toLowerCase() === wardNo;
        return true;
      }
      if (upazilaScope) {
        if (isNumericLike(upazilaScope)) return String(row.upazila_id) === upazilaScope;
        return normalize(row.upazila_name) === normalize(upazilaScope);
      }
      if (districtScope) {
        if (isNumericLike(districtScope)) return String(row.district_id) === districtScope;
        return normalize(row.district_name) === normalize(districtScope);
      }

      return true;
    });
  }, [rows, isAdmin, user, profile]);

  const districtOptions = useMemo(
    () => Array.from(new Set(scopeFilteredRows.map((row) => row.district_name))).sort((a, b) => a.localeCompare(b)),
    [scopeFilteredRows],
  );

  const upazilaOptions = useMemo(() => {
    const scoped =
      selectedDistrict === "all"
        ? scopeFilteredRows
        : scopeFilteredRows.filter((row) => row.district_name === selectedDistrict);
    return Array.from(new Set(scoped.map((row) => row.upazila_name))).sort((a, b) => a.localeCompare(b));
  }, [scopeFilteredRows, selectedDistrict]);

  const unionOptions = useMemo(() => {
    const scoped = scopeFilteredRows.filter((row) => {
      if (selectedDistrict !== "all" && row.district_name !== selectedDistrict) return false;
      if (selectedUpazila !== "all" && row.upazila_name !== selectedUpazila) return false;
      return true;
    });
    return Array.from(new Set(scoped.map((row) => row.union_name))).sort((a, b) => a.localeCompare(b));
  }, [scopeFilteredRows, selectedDistrict, selectedUpazila]);

  const villageOptions = useMemo(() => {
    const scoped = scopeFilteredRows.filter((row) => {
      if (selectedDistrict !== "all" && row.district_name !== selectedDistrict) return false;
      if (selectedUpazila !== "all" && row.upazila_name !== selectedUpazila) return false;
      if (selectedUnion !== "all" && row.union_name !== selectedUnion) return false;
      return true;
    });
    return Array.from(new Set(scoped.map((row) => row.village_name))).sort((a, b) => a.localeCompare(b));
  }, [scopeFilteredRows, selectedDistrict, selectedUpazila, selectedUnion]);

  const wardOptions = useMemo(() => {
    const scoped = scopeFilteredRows.filter((row) => {
      if (selectedDistrict !== "all" && row.district_name !== selectedDistrict) return false;
      if (selectedUpazila !== "all" && row.upazila_name !== selectedUpazila) return false;
      if (selectedUnion !== "all" && row.union_name !== selectedUnion) return false;
      if (selectedVillage !== "all" && row.village_name !== selectedVillage) return false;
      return true;
    });
    return Array.from(new Set(scoped.map((row) => row.ward_no || "").filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [scopeFilteredRows, selectedDistrict, selectedUpazila, selectedUnion, selectedVillage]);

  const pendingRecordIds = useMemo(() => {
    const ids = new Set<string>();
    approvalRows.forEach((approval) => {
      if (approval.status === "PENDING") {
        ids.add(approval.record_id);
      }
    });
    return ids;
  }, [approvalRows]);

  const filteredRows = useMemo(
    () =>
      scopeFilteredRows.filter((row) => {
        if (selectedDistrict !== "all" && row.district_name !== selectedDistrict) return false;
        if (selectedUpazila !== "all" && row.upazila_name !== selectedUpazila) return false;
        if (selectedUnion !== "all" && row.union_name !== selectedUnion) return false;
        if (selectedVillage !== "all" && row.village_name !== selectedVillage) return false;
        if (selectedWard !== "all" && (row.ward_no || "") !== selectedWard) return false;
        if (isAdmin && recordView === "pending" && !pendingRecordIds.has(row.id)) return false;
        return true;
      }),
    [
      scopeFilteredRows,
      selectedDistrict,
      selectedUpazila,
      selectedUnion,
      selectedVillage,
      selectedWard,
      isAdmin,
      recordView,
      pendingRecordIds,
    ],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [selectedDistrict, selectedUpazila, selectedUnion, selectedVillage, selectedWard, year, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
    const th = (event.currentTarget.parentElement as HTMLElement | null);
    if (!th) return;
    resizingColumnRef.current = index;
    resizeStartXRef.current = event.clientX;
    resizeStartWidthRef.current = th.getBoundingClientRect().width;
    event.preventDefault();
  };

  const renderHeaderCell = (label: React.ReactNode, index: number, className: string) => (
    <th key={index} className={`${className} relative`}>
      {label}
      <span
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-primary/20"
        onMouseDown={(event) => startColumnResize(index, event)}
      />
    </th>
  );

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

  const handleTextCellChange = (rowId: string, field: keyof LocalRecord, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)));
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(rowId);
      return next;
    });
  };

  const handleDecimalCellChange = (rowId: string, field: keyof LocalRecord, value: string) => {
    const normalized = value.trim();
    if (normalized === "") {
      setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: null } : r)));
    } else {
      const parsed = Number(normalized);
      if (Number.isNaN(parsed)) return;
      setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: parsed } : r)));
    }
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
        if (isAdmin) {
          await updateDistrict(r.district_id, { name: r.district_name });
          await updateUpazila(r.upazila_id, { name: r.upazila_name });
          await updateUnion(r.union_id, { name: r.union_name });
        }
        await updateLocalRecord(r.id, buildUpdatePayload(r));
        if (isAdmin) {
          await updateVillage(r.village_id, buildVillageUpdatePayload(r));
        }
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
    return openMonthNumbers.has(monthIndex + 1);
  };

  const isITNEditable = true;
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleDownloadXlsx = () => {
    const blankZero = (value: number) => (value === 0 ? "" : value);
    const exportRows = filteredRows.map((row, index) => ({
      SL: index + 1,
      Country: "Bangladesh",
      Division: "Chattogram",
      District: row.district_name,
      Upazila: row.upazila_name,
      Union: row.union_name,
      "Ward No": row.ward_no || "",
      "Name of SK/SHW": row.village_sk_shw_name || row.sk_user_display_name || "",
      "Desig.": row.sk_user_designation || "",
      "Name of SS": row.village_ss_name || row.sk_user_ss_name || "",
      "Village Name (English)": row.village_name,
      "Village Name (Bangla)": row.village_name_bn || "",
      "Village Code": row.village_code || "",
      Latitude: row.village_latitude ?? "",
      Longitute: row.village_longitude ?? "",
      Population: row.population,
      "HH Number": blankZero(row.hh),
      "2026 (Active LLINs)": blankZero(row.itn_2026),
      "2025 (Active LLINs)": blankZero(row.itn_2025),
      "2024 (Active LLINs)": blankZero(row.itn_2024),
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
      "Name of MMW, Health post & CHW(C)": row.village_mmw_hp_chwc_name || "",
      "Village Distance from upazila office (KM)": row.village_distance_from_upazila_office_km ?? "",
      "Name of Border with others country": row.village_bordering_country_name || "",
      "Others Activities (TDA/Dev care)": row.village_other_activities || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Local Records");
    XLSX.writeFile(workbook, `malaria_local_filtered_${year}.xlsx`);
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

        <Button size="sm" onClick={handleSave} disabled={saving || dirtyIds.size === 0}>
          <Save className="h-4 w-4 mr-1" /> Save {dirtyIds.size > 0 && `(${dirtyIds.size})`}
        </Button>

        <Select
          value={selectedDistrict}
          onValueChange={(value) => {
            setSelectedDistrict(value);
            setSelectedUpazila("all");
            setSelectedUnion("all");
            setSelectedVillage("all");
            setSelectedWard("all");
          }}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districtOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedUpazila}
          onValueChange={(value) => {
            setSelectedUpazila(value);
            setSelectedUnion("all");
            setSelectedVillage("all");
            setSelectedWard("all");
          }}
          disabled={selectedDistrict === "all"}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Upazila" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Upazilas</SelectItem>
            {upazilaOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedUnion}
          onValueChange={(value) => {
            setSelectedUnion(value);
            setSelectedVillage("all");
            setSelectedWard("all");
          }}
          disabled={selectedUpazila === "all"}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Union" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Unions</SelectItem>
            {unionOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedVillage}
          onValueChange={(value) => {
            setSelectedVillage(value);
            setSelectedWard("all");
          }}
          disabled={selectedUnion === "all"}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Village" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Villages</SelectItem>
            {villageOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedWard} onValueChange={setSelectedWard} disabled={selectedVillage === "all"}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ward" />
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

        <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">50 rows</SelectItem>
            <SelectItem value="100">100 rows</SelectItem>
            <SelectItem value="250">250 rows</SelectItem>
            <SelectItem value="500">500 rows</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleDownloadXlsx} disabled={loading || filteredRows.length === 0}>
          Download Data
        </Button>

        {isAdmin && (
          <Select value={recordView} onValueChange={(value: "all" | "pending") => setRecordView(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Records View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="pending">Waiting Approval</SelectItem>
            </SelectContent>
          </Select>
        )}

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
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-fuchsia-200 border border-fuchsia-300" />
            Rejected
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {(filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1)}-
          {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} filtered rows
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Prev
          </Button>
          <span>
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-auto max-h-[calc(100vh-220px)] bg-white relative">
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading malaria records...</span>
            </div>
          </div>
        )}
        <table className="w-full text-[10px] border-collapse table-fixed">
          <colgroup>
            {Array.from({ length: 36 }).map((_, index) => (
              <col key={index} style={columnWidths[index] ? { width: `${columnWidths[index]}px` } : undefined} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-gray-50 border-b">
            <tr>
              {renderHeaderCell("SL", 0, "grid-th min-w-[10px] sticky left-0 bg-gray-50 z-20")}
              {renderHeaderCell("Country", 1, "grid-th min-w-[10px]")}
              {renderHeaderCell("Division", 2, "grid-th min-w-[10px]")}
              {renderHeaderCell("District", 3, "grid-th min-w-[10px]")}
              {renderHeaderCell("Upazila", 4, "grid-th min-w-[10px]")}
              {renderHeaderCell("Union", 5, "grid-th min-w-[10px]")}
              {renderHeaderCell("Ward No", 6, "grid-th min-w-[10px]")}
              {renderHeaderCell("Name of SK/SHW", 7, "grid-th min-w-[10px]")}
              {renderHeaderCell("Desig.", 8, "grid-th min-w-[10px]")}
              {renderHeaderCell("Name of SS", 9, "grid-th min-w-[10px]")}
              {renderHeaderCell("Village Name (English)", 10, "grid-th min-w-[10px]")}
              {renderHeaderCell("Village Name (Bangla)", 11, "grid-th min-w-[10px]")}
              {renderHeaderCell("Village Code", 12, "grid-th min-w-[10px]")}
              {renderHeaderCell("Latitude", 13, "grid-th min-w-[10px]")}
              {renderHeaderCell("Longitute", 14, "grid-th min-w-[10px]")}
              {renderHeaderCell("Population", 15, "grid-th min-w-[10px]")}
              {renderHeaderCell("HH Number", 16, "grid-th min-w-[10px]")}
              {renderHeaderCell("2026 (Active LLINs)", 17, "grid-th min-w-[10px]")}
              {renderHeaderCell("2025 (Active LLINs)", 18, "grid-th min-w-[10px]")}
              {renderHeaderCell("2024 (Active LLINs)", 19, "grid-th min-w-[10px]")}
              {MONTH_LABELS.map((m, idx) => (
                renderHeaderCell(<span className="month-th-label">{m}</span>, 20 + idx, "grid-th month-th min-w-[10px]")
              ))}
              {renderHeaderCell("Name of MMW, Health post & CHW(C)", 32, "grid-th min-w-[10px]")}
              {renderHeaderCell("Village Distance from upazila office (KM)", 33, "grid-th min-w-[10px]")}
              {renderHeaderCell("Name of Border with others country", 34, "grid-th min-w-[10px]")}
              {renderHeaderCell("Others Activities (TDA/Dev care)", 35, "grid-th min-w-[10px]")}
            </tr>
          </thead>

          <tbody>
            {filteredRows.length === 0 && !loading && (
              <tr>
                <td colSpan={36} className="text-center py-8 text-muted-foreground">
                  No records found for current filters
                </td>
              </tr>
            )}

            {paginatedRows.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="grid-td sticky left-0 bg-white z-[5] font-medium">
                  {(page - 1) * pageSize + index + 1}
                </td>
                <td className="grid-td">Bangladesh</td>
                <td className="grid-td">
                  Chattogram
                </td>
                <td className="grid-td p-0">
                  {isAdmin ? (
                    <input
                      className="grid-input"
                      value={row.district_name}
                      onChange={(e) => handleTextCellChange(row.id, "district_name", e.target.value)}
                    />
                  ) : (
                    <span className="font-medium">{row.district_name}</span>
                  )}
                </td>
                <td className="grid-td p-0">
                  {isAdmin ? (
                    <input
                      className="grid-input"
                      value={row.upazila_name}
                      onChange={(e) => handleTextCellChange(row.id, "upazila_name", e.target.value)}
                    />
                  ) : (
                    row.upazila_name
                  )}
                </td>
                <td className="grid-td p-0">
                  {isAdmin ? (
                    <input
                      className="grid-input"
                      value={row.union_name}
                      onChange={(e) => handleTextCellChange(row.id, "union_name", e.target.value)}
                    />
                  ) : (
                    row.union_name
                  )}
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.ward_no || ""}
                    onChange={(e) => handleTextCellChange(row.id, "ward_no", e.target.value)}
                  />
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_sk_shw_name || ""}
                    onChange={(e) => handleTextCellChange(row.id, "village_sk_shw_name", e.target.value)}
                  />
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.sk_user_designation || ""}
                    onChange={(e) => handleTextCellChange(row.id, "sk_user_designation", e.target.value)}
                  />
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_ss_name || ""}
                    onChange={(e) => handleTextCellChange(row.id, "village_ss_name", e.target.value)}
                  />
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_name}
                    onChange={(e) => handleTextCellChange(row.id, "village_name", e.target.value)}
                  />
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_name_bn || ""}
                    onChange={(e) => handleTextCellChange(row.id, "village_name_bn", e.target.value)}
                  />
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_code || ""}
                    onChange={(e) => handleTextCellChange(row.id, "village_code", e.target.value)}
                  />
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_latitude ?? ""}
                    onChange={(e) => handleDecimalCellChange(row.id, "village_latitude", e.target.value)}
                  />
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_longitude ?? ""}
                    onChange={(e) => handleDecimalCellChange(row.id, "village_longitude", e.target.value)}
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

                <td className="grid-td p-0">
                  <input
                    type="number"
                    min={0}
                    className="grid-input"
                    value={row.hh === 0 ? "" : row.hh}
                    onChange={(e) => handleCellChange(row.id, "hh", e.target.value)}
                  />
                </td>

                {itnColumns.map((itnCol) => (
                  <td key={itnCol} className="grid-td p-0">
                    <input
                      type="number"
                      min={0}
                      className={`grid-input ${isITNEditable ? "" : "bg-muted/30 text-muted-foreground"}`}
                      value={row[itnCol] === 0 ? "" : row[itnCol]}
                      onChange={(e) => handleCellChange(row.id, itnCol, e.target.value)}
                      disabled={!isITNEditable}
                    />
                  </td>
                ))}

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
                          value={value}
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

                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_mmw_hp_chwc_name || ""}
                    onChange={(e) => handleTextCellChange(row.id, "village_mmw_hp_chwc_name", e.target.value)}
                  />
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_distance_from_upazila_office_km ?? ""}
                    onChange={(e) =>
                      handleDecimalCellChange(row.id, "village_distance_from_upazila_office_km", e.target.value)
                    }
                  />
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_bordering_country_name || ""}
                    onChange={(e) => handleTextCellChange(row.id, "village_bordering_country_name", e.target.value)}
                  />
                </td>
                <td className="grid-td p-0">
                  <input
                    className="grid-input"
                    value={row.village_other_activities || ""}
                    onChange={(e) => handleTextCellChange(row.id, "village_other_activities", e.target.value)}
                  />
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
