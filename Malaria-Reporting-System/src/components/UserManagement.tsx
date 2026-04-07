import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ChevronDown, ChevronUp, UserPlus, Shield, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Assignment { id: string; village_name: string; district_name: string; reporting_year: number; }

interface SKUser {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  assignments: Assignment[];
}

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers]           = useState<SKUser[]>([]);
  const [loading, setLoading]       = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [role, setRole]             = useState("sk");
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");
      if (profileError) throw profileError;

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (roleError) throw roleError;

      const { data: assignData } = await supabase
        .from("local_records")
        .select(`id, sk_user_id, reporting_year, villages ( name, unions ( upazilas ( districts ( name ) ) ) )`);

      const roleMap = new Map<string, string>();
      (roleData || []).forEach((entry) => {
        roleMap.set(entry.user_id, entry.role);
      });

      const assignMap: Record<string, Assignment[]> = {};
      (assignData || []).forEach((r: any) => {
        const a: Assignment = {
          id: r.id,
          village_name:  r.villages?.name ?? "—",
          district_name: r.villages?.unions?.upazilas?.districts?.name ?? "—",
          reporting_year: r.reporting_year,
        };
        if (!assignMap[r.sk_user_id]) assignMap[r.sk_user_id] = [];
        assignMap[r.sk_user_id].push(a);
      });

      setUsers(
        (profileData || []).map((p: any) => ({
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
          role: roleMap.get(p.user_id) ?? "sk",
          assignments: assignMap[p.user_id] || [],
        }))
      );
      setCurrentPage(1);
    } catch (err: any) {
      toast({ title: "Load error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name } },
      });
      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("No user returned");

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: signUpData.user.id, role }, { onConflict: "user_id" });
      if (roleError) throw roleError;

      toast({ title: `User ${email} created` });
      setName(""); setEmail(""); setPassword(""); setRole("sk");
      setShowForm(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Create error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(users.length / rowsPerPage));
  const pageStart = (currentPage - 1) * rowsPerPage;
  const pageUsers = users.slice(pageStart, pageStart + rowsPerPage);
  const visibleRows = Array.from({ length: rowsPerPage }, (_, index) => pageUsers[index] ?? null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{users.length} users total</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            {showForm ? "Cancel" : "Add User"}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Create New User</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="SK Rahim Uddin"
                className="w-full p-2 border rounded-md text-xs focus:ring-2 focus:ring-gray-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="sk2@test.com"
                className="w-full p-2 border rounded-md text-xs focus:ring-2 focus:ring-gray-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="Min 6 characters"
                className="w-full p-2 border rounded-md text-xs focus:ring-2 focus:ring-gray-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 border rounded-md text-xs focus:ring-2 focus:ring-gray-400 focus:outline-none">
                <option value="sk">SK</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {submitting ? "Creating…" : "Create User"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="border rounded-md overflow-hidden divide-y">
        {loading && <div className="px-4 py-8 text-center text-xs text-muted-foreground">Loading…</div>}
        {!loading && users.length === 0 && <div className="px-4 py-8 text-center text-xs text-muted-foreground">No users found</div>}

        {!loading && users.length > 0 && visibleRows.map((u, rowIndex) => {
          if (!u) {
            return (
              <div key={`empty-${rowIndex}`} className="flex min-h-[72px] items-center justify-between bg-white/40 px-4 py-3">
                <div className="flex items-center gap-3 opacity-0">
                  <div className="h-9 w-9 rounded-full bg-slate-100" />
                  <div className="space-y-2">
                    <div className="h-3 w-28 rounded bg-slate-100" />
                    <div className="h-2 w-36 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            );
          }

          const isExpanded = expandedId === u.user_id;
          const initials = (u.full_name || u.email || "?")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "?";

          return (
            <div key={u.user_id} className="bg-white">
              <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-full transition-transform hover:scale-[1.02]">
                        <Avatar className="h-10 w-10 border border-slate-200">
                          <AvatarFallback className={u.role === "admin" ? "bg-slate-900 text-white" : "bg-sky-100 text-sky-700"}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-sm font-semibold text-slate-900">{u.full_name || "—"}</p>
                        <p className="mt-1 text-xs text-slate-500">{u.email}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">{u.role}</p>
                      </div>
                      <DropdownMenuItem className="mt-2 rounded-xl px-3 py-2.5" onClick={() => setExpandedId(isExpanded ? null : u.user_id)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        User details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl px-3 py-2.5">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl px-3 py-2.5">
                        <MapPin className="mr-2 h-4 w-4" />
                        Location options
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button className="text-left" onClick={() => setExpandedId(isExpanded ? null : u.user_id)}>
                    <p className="text-xs font-medium text-gray-900">{u.full_name || "—"}</p>
                    <p className="text-[11px] text-gray-400">{u.email}</p>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    u.role === "admin" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}>{u.role}</span>
                  <span className="text-[11px] text-gray-400">{u.assignments.length} village{u.assignments.length !== 1 ? "s" : ""}</span>
                  <button onClick={() => setExpandedId(isExpanded ? null : u.user_id)}>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-gray-50 border-t px-4 py-3">
                  <div className="mb-3 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 md:grid-cols-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Name</p>
                      <p className="mt-1 font-medium text-slate-900">{u.full_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Email</p>
                      <p className="mt-1 font-medium text-slate-900">{u.email}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Role</p>
                      <p className="mt-1 font-medium capitalize text-slate-900">{u.role}</p>
                    </div>
                  </div>

                  {u.assignments.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No villages assigned. Go to Assign Villages to add.</p>
                  ) : (
                    <>
                      <p className="text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Assigned Villages</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {u.assignments.map((a) => (
                          <div key={a.id} className="flex items-center justify-between bg-white border rounded-md px-3 py-1.5 text-xs">
                            <div>
                              <span className="font-medium text-gray-800">{a.village_name}</span>
                              <span className="text-gray-400 ml-1.5">— {a.district_name}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 ml-2">{a.reporting_year}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {users.length > 0 && (
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
                Page {currentPage} of {totalPages}
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
      )}
    </div>
  );
};

export default UserManagement;
