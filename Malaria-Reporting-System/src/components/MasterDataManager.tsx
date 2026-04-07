import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronRight, Loader2, RefreshCw, Save } from "lucide-react";

type Level = "districts" | "upazilas" | "unions" | "villages";

interface Row { id: string; name: string; [key: string]: any; }

const LEVELS: { key: Level; label: string; parentKey?: string; parentLabel?: string }[] = [
  { key: "districts", label: "Districts" },
  { key: "upazilas", label: "Upazilas",  parentKey: "district_id", parentLabel: "District" },
  { key: "unions",   label: "Unions",    parentKey: "upazila_id",  parentLabel: "Upazila"  },
  { key: "villages", label: "Villages",  parentKey: "union_id",    parentLabel: "Union"    },
];

const MasterDataManager = () => {
  const { toast } = useToast();
  const [activeLevel, setActiveLevel] = useState<Level>("districts");
  const [rows, setRows]       = useState<Row[]>([]);
  const [parents, setParents] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [newName, setNewName]         = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [newWardNo, setNewWardNo]     = useState("");
  const [adding, setAdding]           = useState(false);
  const [removingId, setRemovingId]   = useState<string | null>(null);
  const [savingId, setSavingId]       = useState<string | null>(null);
  const [dirtyIds, setDirtyIds]       = useState<Set<string>>(new Set());

  const level = LEVELS.find((l) => l.key === activeLevel)!;

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from(activeLevel).select("*").order("name");
      if (error) throw error;
      setRows(data || []);
      setDirtyIds(new Set());
    } catch (err: any) {
      toast({ title: "Load error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeLevel, toast]);

  const loadParents = useCallback(async () => {
    if (!level.parentKey) { setParents([]); return; }
    const parentTable =
      activeLevel === "upazilas" ? "districts" :
      activeLevel === "unions"   ? "upazilas"  :
      activeLevel === "villages" ? "unions"    : null;
    if (!parentTable) return;
    const { data } = await supabase.from(parentTable).select("id, name").order("name");
    setParents(data || []);
  }, [activeLevel, level.parentKey]);

  useEffect(() => {
    loadRows();
    loadParents();
    setNewName(""); setNewParentId(""); setNewWardNo("");
  }, [loadRows, loadParents]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (level.parentKey && !newParentId) {
      toast({ title: `Please select a ${level.parentLabel}`, variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      const payload: any = { name: newName.trim() };
      if (level.parentKey) payload[level.parentKey] = newParentId;
      if (activeLevel === "villages" && newWardNo) payload.ward_no = newWardNo;

      const { error } = await supabase.from(activeLevel).insert(payload);
      if (error) throw error;

      toast({ title: `${newName} added to ${level.label}` });
      setNewName(""); setNewParentId(""); setNewWardNo("");
      loadRows();
    } catch (err: any) {
      toast({ title: "Add error", description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This may affect records linked to it.`)) return;
    setRemovingId(id);
    try {
      const { error } = await supabase.from(activeLevel).delete().eq("id", id);
      if (error) throw error;
      toast({ title: `"${name}" deleted` });
      loadRows();
    } catch (err: any) {
      toast({ title: "Delete error", description: err.message, variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const handleRowChange = (id: string, field: string, value: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    setDirtyIds((prev) => new Set(prev).add(id));
  };

  const normalizeDecimalValue = (value: unknown) => {
    if (value === "" || value === null || value === undefined) return null;
    const normalized = String(value).trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? normalized : null;
  };

  const handleSaveRow = async (row: Row) => {
    const trimmedName = String(row.name || "").trim();
    if (!trimmedName) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (level.parentKey && !row[level.parentKey]) {
      toast({ title: `Please select a ${level.parentLabel}`, variant: "destructive" });
      return;
    }

    setSavingId(row.id);
    try {
      const payload: Record<string, any> = { name: trimmedName };
      if (level.parentKey) {
        payload[level.parentKey] = row[level.parentKey];
      }
      if (activeLevel === "villages") {
        payload.ward_no = String(row.ward_no || "").trim() || null;
        payload.mmw_hp_chwc_name = String(row.mmw_hp_chwc_name || "").trim();
        payload.distance_from_upazila_office_km = normalizeDecimalValue(row.distance_from_upazila_office_km);
        payload.bordering_country_name = String(row.bordering_country_name || "").trim();
        payload.other_activities = String(row.other_activities || "").trim();
      }

      const { error } = await supabase.from(activeLevel).update(payload).eq("id", row.id);
      if (error) throw error;

      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      toast({ title: `"${trimmedName}" saved` });
      loadRows();
    } catch (err: any) {
      toast({ title: "Save error", description: err.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const sel = "w-full p-2 border rounded-md text-xs focus:ring-2 focus:ring-gray-400 focus:outline-none bg-white";

  return (
    <div className="space-y-6">
      {/* Level Tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {LEVELS.map((l, i) => (
          <div key={l.key} className="flex items-center gap-1">
            <button
              onClick={() => setActiveLevel(l.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeLevel === l.key
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {l.label}
              {activeLevel === l.key && (
                <span className="ml-1.5 text-[10px] opacity-60">({rows.length})</span>
              )}
            </button>
            {i < LEVELS.length - 1 && <ChevronRight className="h-3 w-3 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Add Form */}
      <div className="bg-gray-50 rounded-lg border p-4">
        <h3 className="text-xs font-semibold text-gray-700 mb-3">
          Add New {level.label.slice(0, -1)}
        </h3>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          {level.parentKey && (
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">{level.parentLabel}</label>
              <select className={sel} value={newParentId} onChange={(e) => setNewParentId(e.target.value)} required>
                <option value="">— Select {level.parentLabel} —</option>
                {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              type="text" className={sel} value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`${level.label.slice(0, -1)} name`} required
            />
          </div>

          {activeLevel === "villages" && (
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-600 mb-1">Ward No.</label>
              <input
                type="text" className={sel} value={newWardNo}
                onChange={(e) => setNewWardNo(e.target.value)} placeholder="e.g. 3"
              />
            </div>
          )}

          <Button type="submit" size="sm" disabled={adding}>
            {adding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Add
          </Button>
        </form>
      </div>

      {/* Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500">{rows.length} {level.label.toLowerCase()}</p>
          <Button variant="outline" size="sm" onClick={loadRows} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                {level.parentKey && (
                  <th className="px-3 py-2 text-left font-medium text-gray-600">{level.parentLabel}</th>
                )}
                <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                {activeLevel === "villages" && (
                  <>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Ward</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">MMW / Health post / CHW(C)</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Distance (KM)</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Border Country</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Other Activities</th>
                  </>
                )}
                <th className="px-3 py-2 text-center font-medium text-gray-600 w-16">Save</th>
                <th className="px-3 py-2 text-center font-medium text-gray-600 w-16">Del</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={activeLevel === "villages" ? 9 : level.parentKey ? 4 : 3} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={activeLevel === "villages" ? 9 : level.parentKey ? 4 : 3} className="px-3 py-6 text-center text-muted-foreground">
                  No {level.label.toLowerCase()} yet. Add one above.
                </td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-t hover:bg-gray-50">
                  {level.parentKey && (
                    <td className="px-3 py-2 text-gray-500">
                      <select
                        className={sel}
                        value={row[level.parentKey] || ""}
                        onChange={(e) => handleRowChange(row.id, level.parentKey!, e.target.value)}
                      >
                        <option value="">— Select {level.parentLabel} —</option>
                        {parents.map((parent) => (
                          <option key={parent.id} value={parent.id}>{parent.name}</option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="px-3 py-2 font-medium text-gray-900">
                    <input
                      type="text"
                      className={sel}
                      value={row.name || ""}
                      onChange={(e) => handleRowChange(row.id, "name", e.target.value)}
                    />
                  </td>
                  {activeLevel === "villages" && (
                    <>
                      <td className="px-3 py-2 text-gray-500">
                        <input
                          type="text"
                          className={sel}
                          value={row.ward_no || ""}
                          onChange={(e) => handleRowChange(row.id, "ward_no", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        <input
                          type="text"
                          className={sel}
                          value={row.mmw_hp_chwc_name || ""}
                          onChange={(e) => handleRowChange(row.id, "mmw_hp_chwc_name", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        <input
                          type="text"
                          className={sel}
                          value={row.distance_from_upazila_office_km || ""}
                          onChange={(e) => handleRowChange(row.id, "distance_from_upazila_office_km", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        <input
                          type="text"
                          className={sel}
                          value={row.bordering_country_name || ""}
                          onChange={(e) => handleRowChange(row.id, "bordering_country_name", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        <input
                          type="text"
                          className={sel}
                          value={row.other_activities || ""}
                          onChange={(e) => handleRowChange(row.id, "other_activities", e.target.value)}
                        />
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleSaveRow(row)}
                      disabled={savingId === row.id || !dirtyIds.has(row.id)}
                      className="text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-40"
                    >
                      {savingId === row.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Save className="h-3.5 w-3.5" />}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleRemove(row.id, row.name)}
                      disabled={removingId === row.id}
                      className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      {removingId === row.id
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

export default MasterDataManager;
