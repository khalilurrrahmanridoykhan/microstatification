import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getDhakaYear, MONTH_LABELS, MONTH_COLUMNS } from "@/lib/monthUtils";
import { Check, RefreshCw, AlertCircle } from "lucide-react";

type RecordType = "local" | "non_local";

interface ReviewRow {
  id: string;
  record_type: RecordType;
  sk_user_id: string;
  sk_name: string;
  location: string;
  reporting_year: number;
  [key: string]: any;
}

interface ApprovalRow {
  record_id: string;
  month: number;
  status: "PENDING" | "APPROVED";
}

interface SKOption { user_id: string; name: string; }

const AdminRecordReview = () => {
  const { user } = useAuth();
  const currentYear = getDhakaYear();

  const [year, setYear]             = useState(currentYear);
  const [recordType, setRecordType] = useState<RecordType>("local");
  const [filterSK, setFilterSK]     = useState("all");
  const [rows, setRows]             = useState<ReviewRow[]>([]);
  const [approvals, setApprovals]   = useState<ApprovalRow[]>([]);
  const [skOptions, setSkOptions]   = useState<SKOption[]>([]);
  const [loading, setLoading]       = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let recordData: any[] = [];
      let recordError: any  = null;

      if (recordType === "local") {
        const { data, error } = await supabase
          .from("local_records")
          .select(`*, villages ( name, ward_no, unions ( name, upazilas ( name, districts ( name ) ) ) )`)
          .eq("reporting_year", year).order("created_at");
        recordData = data || []; recordError = error;
      } else {
        const { data, error } = await supabase
          .from("non_local_records").select("*")
          .eq("reporting_year", year).order("created_at");
        recordData = data || []; recordError = error;
      }

      if (recordError) throw recordError;

      const skIds = [...new Set(recordData.map((r: any) => r.sk_user_id))];
      let profileMap: Record<string, string> = {};
      if (skIds.length > 0) {
        const { data: pd } = await supabase
          .from("profiles").select("user_id, full_name, email").in("user_id", skIds);
        profileMap = Object.fromEntries(
          (pd || []).map((p: any) => [p.user_id, p.full_name || p.email || p.user_id])
        );
        setSkOptions(skIds.map((id) => ({ user_id: id as string, name: profileMap[id as string] || (id as string) })));
      }

      const { data: approvalData, error: approvalError } = await supabase
        .from("monthly_approvals").select("record_id, month, status")
        .eq("record_type", recordType).eq("reporting_year", year);
      if (approvalError) throw approvalError;

      const mapped = recordData.map((r: any) => ({
        ...r,
        record_type: recordType,
        sk_name: profileMap[r.sk_user_id] || r.sk_user_id,
        location:
          recordType === "local"
            ? [r.villages?.unions?.upazilas?.districts?.name, r.villages?.unions?.upazilas?.name,
               r.villages?.unions?.name, r.villages?.name].filter(Boolean).join(" › ")
            : [r.country, r.district_or_state, r.village_name].filter(Boolean).join(" - "),
      }));

      setRows(mapped);
      setApprovals(approvalData || []);
    } catch (err) {
      console.error("Admin load error:", err);
    } finally {
      setLoading(false);
    }
  }, [recordType, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStatus = (recordId: string, month: number) =>
    approvals.find((a) => a.record_id === recordId && a.month === month)?.status;

  const approveMonth = async (recordId: string, month: number) => {
    if (!user) return;
    await supabase.from("monthly_approvals").upsert({
      record_type: recordType, record_id: recordId,
      reporting_year: year, month, status: "APPROVED",
      approved_by: user.id, approved_at: new Date().toISOString(),
    });
    fetchData();
  };

  const approveAllRow = async (recordId: string) => {
    if (!user) return;
    const row = rows.find((r) => r.id === recordId);
    if (!row) return;
    const upserts = MONTH_COLUMNS
      .map((col, i) => ({ col, month: i + 1, value: Number(row[col]) || 0 }))
      .filter(({ value }) => value > 0)
      .map(({ month }) => ({
        record_type: recordType, record_id: recordId,
        reporting_year: year, month, status: "APPROVED" as const,
        approved_by: user.id, approved_at: new Date().toISOString(),
      }));
    if (upserts.length === 0) return;
    await supabase.from("monthly_approvals").upsert(upserts);
    fetchData();
  };

  const rowNeedsAttention = (row: ReviewRow) =>
    MONTH_COLUMNS.some((col, idx) => {
      const value = Number(row[col]) || 0;
      return value > 0 && getStatus(row.id, idx + 1) !== "APPROVED";
    });

  const filteredRows = filterSK === "all" ? rows : rows.filter((r) => r.sk_user_id === filterSK);
  const needsAttentionCount = rows.filter(rowNeedsAttention).length;

  const getCellStyle = (recordId: string, month: number, hasData: boolean) => {
    if (!hasData) return "bg-gray-50 text-gray-300 cursor-default border border-gray-100";
    const status = getStatus(recordId, month);
    if (status === "APPROVED") return "bg-green-50 border border-green-200 text-green-800 cursor-pointer hover:bg-green-100";
    if (status === "PENDING")  return "bg-yellow-50 border border-yellow-200 text-yellow-800 cursor-pointer hover:bg-yellow-100";
    return "bg-red-50 border border-red-200 text-red-700 cursor-pointer hover:bg-red-100";
  };

  return (
    <div className="space-y-4">
      {needsAttentionCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span><strong>{needsAttentionCount}</strong> record{needsAttentionCount > 1 ? "s have" : " has"} unapproved months with submitted data.</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[110px] h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex border rounded-md overflow-hidden">
          <button onClick={() => setRecordType("local")}
            className={`px-3 h-8 text-xs transition-colors ${recordType === "local" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"}`}>
            Local
          </button>
          <button onClick={() => setRecordType("non_local")}
            className={`px-3 h-8 text-xs transition-colors ${recordType === "non_local" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"}`}>
            Non-Local
          </button>
        </div>

        <Select value={filterSK} onValueChange={setFilterSK}>
          <SelectTrigger className="w-[160px] h-8"><SelectValue placeholder="All SKs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All SKs</SelectItem>
            {skOptions.map((sk) => <SelectItem key={sk.user_id} value={sk.user_id}>{sk.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="ml-auto">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Reload
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-100 border border-red-200" />Needs approval</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-yellow-100 border border-yellow-200" />Pending</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-green-100 border border-green-200" />Approved</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-gray-100 border border-gray-200" />No data</span>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-gray-50 border-b sticky top-0 z-10">
            <tr>
              <th className="p-2 text-left font-semibold text-gray-700 min-w-[130px]">SK</th>
              <th className="p-2 text-left font-semibold text-gray-700 min-w-[160px]">Location</th>
              {MONTH_LABELS.map((m) => (
                <th key={m} className="p-2 text-center font-semibold text-gray-700 min-w-[56px]">{m}</th>
              ))}
              <th className="p-2 text-center font-semibold text-gray-700 min-w-[60px]">Total</th>
              <th className="p-2 text-center font-semibold text-gray-700 min-w-[80px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const total = MONTH_COLUMNS.reduce((s, c) => s + (Number(row[c]) || 0), 0);
              const needsAction = rowNeedsAttention(row);
              return (
                <tr key={row.id} className={`border-t ${needsAction ? "bg-amber-50/40 hover:bg-amber-50" : "hover:bg-gray-50/50"}`}>
                  <td className="p-2 font-medium text-gray-900">
                    <div className="flex items-center gap-1.5">
                      {needsAction && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />}
                      {row.sk_name}
                    </div>
                  </td>
                  <td className="p-2 text-gray-500 text-[11px]">{row.location}</td>

                  {MONTH_COLUMNS.map((col, idx) => {
                    const month  = idx + 1;
                    const value  = Number(row[col]) || 0;
                    const hasData = value > 0;
                    const status = getStatus(row.id, month);
                    return (
                      <td key={col} className="p-1 text-center">
                        <button
                          onClick={() => hasData ? approveMonth(row.id, month) : undefined}
                          disabled={!hasData}
                          title={!hasData ? "No data" : status === "APPROVED" ? "Approved" : "Click to approve"}
                          className={`w-full px-1 py-1.5 rounded text-xs font-medium transition-colors ${getCellStyle(row.id, month, hasData)}`}
                        >
                          {hasData ? (
                            <span className="flex flex-col items-center leading-tight">
                              <span className="font-semibold">{value}</span>
                              {status === "APPROVED" && <span className="text-[9px] text-green-600">✓</span>}
                              {!status && <span className="text-[9px] text-red-400">approve</span>}
                            </span>
                          ) : "—"}
                        </button>
                      </td>
                    );
                  })}

                  <td className="p-2 text-center font-bold text-gray-900 bg-gray-50/80">
                    {total > 0 ? total : "—"}
                  </td>
                  <td className="p-2 text-center">
                    <Button size="sm" variant={needsAction ? "default" : "outline"}
                      onClick={() => approveAllRow(row.id)} className="h-7 text-xs px-2">
                      <Check className="h-3 w-3 mr-1" /> All
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filteredRows.length === 0 && !loading && (
              <tr><td colSpan={16} className="text-center p-8 text-muted-foreground">No records found for {year}</td></tr>
            )}
            {loading && (
              <tr><td colSpan={16} className="text-center p-8 text-muted-foreground">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRecordReview;
