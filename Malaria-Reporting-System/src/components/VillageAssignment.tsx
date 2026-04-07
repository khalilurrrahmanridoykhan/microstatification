import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, RefreshCw } from "lucide-react";

interface SKUser   { user_id: string; full_name: string; email: string; }
interface District { id: string; name: string; }
interface Upazila  { id: string; name: string; district_id: string; }
interface Union    { id: string; name: string; upazila_id: string; }
interface Village  { id: string; name: string; ward_no: string | null; union_id: string; }

interface Assignment {
  id: string;
  sk_user_id: string;
  sk_name: string;
  village_name: string;
  district_name: string;
  upazila_name: string;
  union_name: string;
  reporting_year: number;
}

const VillageAssignment = () => {
  const { toast } = useToast();

  const [sks, setSks]             = useState<SKUser[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas]   = useState<Upazila[]>([]);
  const [unions, setUnions]       = useState<Union[]>([]);
  const [villages, setVillages]   = useState<Village[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [skId, setSkId]                   = useState("");
  const [districtId, setDistrictId]       = useState("");
  const [upazilaId, setUpazilaId]         = useState("");
  const [unionId, setUnionId]             = useState("");
  const [villageId, setVillageId]         = useState("");
  const [reportingYear, setReportingYear] = useState(new Date().getFullYear());
  const [submitting, setSubmitting]       = useState(false);
  const [filterSK, setFilterSK]           = useState("all");
  const [removingId, setRemovingId]       = useState<string | null>(null);

  const filteredUpazilas = upazilas.filter((u) => u.district_id === districtId);
  const filteredUnions   = unions.filter((u) => u.upazila_id === upazilaId);
  const filteredVillages = villages.filter((v) => v.union_id === unionId);

  const loadMasterData = useCallback(async () => {
    const [skRes, dRes, upRes, unRes, vRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email"),
      supabase.from("districts").select("id, name").order("name"),
      supabase.from("upazilas").select("id, name, district_id").order("name"),
      supabase.from("unions").select("id, name, upazila_id").order("name"),
      supabase.from("villages").select("id, name, ward_no, union_id").order("name"),
    ]);
    if (skRes.data)  setSks(skRes.data);
    if (dRes.data)   setDistricts(dRes.data);
    if (upRes.data)  setUpazilas(upRes.data);
    if (unRes.data)  setUnions(unRes.data);
    if (vRes.data)   setVillages(vRes.data);
  }, []);

  const loadAssignments = useCallback(async () => {
    const { data, error } = await supabase
      .from("local_records")
      .select(`
        id, sk_user_id, reporting_year,
        villages ( name, unions ( name, upazilas ( name, districts ( name ) ) ) )
      `)
      .order("reporting_year", { ascending: false });

    if (error) { console.error(error); return; }

    const skIds = [...new Set((data || []).map((r: any) => r.sk_user_id))];
    let profileMap: Record<string, string> = {};
    if (skIds.length > 0) {
      const { data: pd } = await supabase
        .from("profiles").select("user_id, full_name, email").in("user_id", skIds);
      profileMap = Object.fromEntries((pd || []).map((p: any) => [p.user_id, p.full_name || p.email]));
    }

    setAssignments(
      (data || []).map((r: any) => ({
        id: r.id,
        sk_user_id: r.sk_user_id,
        sk_name: profileMap[r.sk_user_id] || r.sk_user_id,
        village_name:  r.villages?.name ?? "—",
        district_name: r.villages?.unions?.upazilas?.districts?.name ?? "—",
        upazila_name:  r.villages?.unions?.upazilas?.name ?? "—",
        union_name:    r.villages?.unions?.name ?? "—",
        reporting_year: r.reporting_year,
      }))
    );
  }, []);

  useEffect(() => { loadMasterData(); loadAssignments(); }, [loadMasterData, loadAssignments]);

  const handleDistrictChange = (id: string) => { setDistrictId(id); setUpazilaId(""); setUnionId(""); setVillageId(""); };
  const handleUpazilaChange  = (id: string) => { setUpazilaId(id); setUnionId(""); setVillageId(""); };
  const handleUnionChange    = (id: string) => { setUnionId(id); setVillageId(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skId || !villageId) {
      toast({ title: "Please select an SK and a village", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("local_records").upsert(
        { sk_user_id: skId, village_id: villageId, reporting_year: reportingYear },
        { onConflict: "sk_user_id,village_id,reporting_year" }
      );
      if (error) throw error;
      const sk = sks.find((s) => s.user_id === skId);
      const village = villages.find((v) => v.id === villageId);
      toast({ title: `Assigned ${sk?.full_name || sk?.email} → ${village?.name} (${reportingYear})` });
      setSkId(""); setDistrictId(""); setUpazilaId(""); setUnionId(""); setVillageId("");
      loadAssignments();
    } catch (err: any) {
      toast({ title: "Assignment error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    if (!confirm("Remove this assignment? All case data for this SK–village–year will be deleted.")) return;
    setRemovingId(assignmentId);
    try {
      const { error } = await supabase.from("local_records").delete().eq("id", assignmentId);
      if (error) throw error;
      toast({ title: "Assignment removed" });
      loadAssignments();
    } catch (err: any) {
      toast({ title: "Remove error", description: err.message, variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);
  const sel = "mt-1 block w-full p-2 border rounded-md text-xs focus:ring-2 focus:ring-gray-400 focus:outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400";
  const filteredAssignments = filterSK === "all" ? assignments : assignments.filter((a) => a.sk_user_id === filterSK);

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="bg-gray-50 rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Assign New Village</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">Select SK</label>
            <select className={sel} value={skId} onChange={(e) => setSkId(e.target.value)} required>
              <option value="">— Select SK —</option>
              {sks.map((sk) => <option key={sk.user_id} value={sk.user_id}>{sk.full_name || sk.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Reporting Year</label>
            <select className={sel} value={reportingYear} onChange={(e) => setReportingYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">District</label>
            <select className={sel} value={districtId} onChange={(e) => handleDistrictChange(e.target.value)} required>
              <option value="">— Select District —</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Upazila</label>
            <select className={sel} value={upazilaId} onChange={(e) => handleUpazilaChange(e.target.value)} required disabled={!districtId}>
              <option value="">— Select Upazila —</option>
              {filteredUpazilas.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Union</label>
            <select className={sel} value={unionId} onChange={(e) => handleUnionChange(e.target.value)} required disabled={!upazilaId}>
              <option value="">— Select Union —</option>
              {filteredUnions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Village</label>
            <select className={sel} value={villageId} onChange={(e) => setVillageId(e.target.value)} required disabled={!unionId}>
              <option value="">— Select Village —</option>
              {filteredVillages.map((v) => (
                <option key={v.id} value={v.id}>{v.name}{v.ward_no ? ` (Ward ${v.ward_no})` : ""}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? "Assigning…" : "Assign Village"}
            </Button>
          </div>
        </form>
      </div>

      {/* Existing Assignments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Existing Assignments
            <span className="ml-2 text-xs font-normal text-gray-400">({filteredAssignments.length})</span>
          </h3>
          <div className="flex items-center gap-2">
            <select
              className="h-8 px-2 border rounded-md text-xs bg-white focus:outline-none"
              value={filterSK} onChange={(e) => setFilterSK(e.target.value)}
            >
              <option value="all">All SKs</option>
              {sks.map((sk) => <option key={sk.user_id} value={sk.user_id}>{sk.full_name || sk.email}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={loadAssignments}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">SK</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">District</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Upazila</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Union</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Village</th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">Year</th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">Remove</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No assignments found</td></tr>
              )}
              {filteredAssignments.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{a.sk_name}</td>
                  <td className="px-3 py-2 text-gray-600">{a.district_name}</td>
                  <td className="px-3 py-2 text-gray-600">{a.upazila_name}</td>
                  <td className="px-3 py-2 text-gray-600">{a.union_name}</td>
                  <td className="px-3 py-2 text-gray-600">{a.village_name}</td>
                  <td className="px-3 py-2 text-center text-gray-600">{a.reporting_year}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleRemove(a.id)}
                      disabled={removingId === a.id}
                      className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      {removingId === a.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VillageAssignment;
