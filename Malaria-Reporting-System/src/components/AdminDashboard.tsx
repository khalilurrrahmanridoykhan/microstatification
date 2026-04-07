import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, MapPin, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Stats {
  totalSKs: number;
  totalVillages: number;
  totalAssignments: number;
  approvedMonths: number;
  unapprovedWithData: number;
}

const StatCard = ({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) => (
  <div className="bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3">
    <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalSKs: 0,
    totalVillages: 0,
    totalAssignments: 0,
    approvedMonths: 0,
    unapprovedWithData: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [skRes, villageRes, assignRes, approvalRes, localRes] = await Promise.all([
          supabase.from("user_roles").select("user_id", { count: "exact" }).eq("role", "sk"),
          supabase.from("villages").select("id", { count: "exact" }),
          supabase.from("local_records").select("id", { count: "exact" }),
          supabase.from("monthly_approvals").select("status, record_id, month"),
          supabase.from("local_records").select(
            "id,jan_cases,feb_cases,mar_cases,apr_cases,may_cases,jun_cases,jul_cases,aug_cases,sep_cases,oct_cases,nov_cases,dec_cases"
          ),
        ]);

        const approvals = approvalRes.data || [];
        const approved  = approvals.filter((a) => a.status === "APPROVED").length;

        const COLS = [
          "jan_cases","feb_cases","mar_cases","apr_cases","may_cases","jun_cases",
          "jul_cases","aug_cases","sep_cases","oct_cases","nov_cases","dec_cases",
        ];

        let unapproved = 0;
        (localRes.data || []).forEach((row: any) => {
          COLS.forEach((col, idx) => {
            if (Number(row[col]) > 0) {
              const isApproved = approvals.some(
                (a: any) => a.record_id === row.id && a.month === idx + 1 && a.status === "APPROVED"
              );
              if (!isApproved) unapproved++;
            }
          });
        });

        setStats({
          totalSKs: skRes.count ?? 0,
          totalVillages: villageRes.count ?? 0,
          totalAssignments: assignRes.count ?? 0,
          approvedMonths: approved,
          unapprovedWithData: unapproved,
        });
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border shadow-sm p-4 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={<Users className="h-4 w-4 text-blue-600" />}
          label="Total SKs" value={stats.totalSKs}
          sub="Active field workers" color="bg-blue-50"
        />
        <StatCard
          icon={<MapPin className="h-4 w-4 text-violet-600" />}
          label="Villages" value={stats.totalVillages}
          sub="In master data" color="bg-violet-50"
        />
        <StatCard
          icon={<MapPin className="h-4 w-4 text-indigo-600" />}
          label="Assignments" value={stats.totalAssignments}
          sub="SK–village–year rows" color="bg-indigo-50"
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          label="Approved" value={stats.approvedMonths}
          sub="Month slots approved" color="bg-green-50"
        />
        <StatCard
          icon={<AlertCircle className="h-4 w-4 text-red-500" />}
          label="Needs Approval" value={stats.unapprovedWithData}
          sub="Months with data, not approved" color="bg-red-50"
        />
      </div>

      {stats.unapprovedWithData > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>{stats.unapprovedWithData}</strong> month entries have data submitted but are not yet approved.
            Go to <strong>View Records</strong> to review.
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
