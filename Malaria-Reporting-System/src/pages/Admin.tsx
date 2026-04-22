import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, EditIcon, FileText, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo, useState, type ReactNode } from "react";
import UserManagement from "@/components/UserManagement";
import VillageAssignment from "@/components/VillageAssignment";
import AdminRecordReview from "@/components/AdminRecordReview";

type SectionKey = "records" | "assignments" | "users" | "masterData";

const Admin = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionKey>("records");

  // Premium compact button styles (neutral, professional)
  const navBtnBase =
    "h-8 px-3 rounded-md border text-xs font-medium " +
    "inline-flex items-center justify-center gap-2 " +
    "whitespace-nowrap shrink-0 " +
    "bg-white border-gray-200 text-gray-800 " +
    "shadow-[0_1px_2px_rgba(0,0,0,0.06)] " +
    "hover:bg-gray-50 hover:border-gray-300 hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)] " +
    "active:translate-y-[0.5px] " +
    "transition-all duration-150 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  const navBtnActive =
    "bg-gray-900 text-white border-gray-900 " +
    "hover:bg-gray-900 hover:border-gray-900 " +
    "shadow-[0_2px_10px_rgba(0,0,0,0.14)] " +
    "ring-1 ring-inset ring-black/10";

  const iconCls = "h-4 w-4";

  const sectionMeta = useMemo(
    () => ({
      records: {
        title: "Submitted Records",
        subtitle: "Review SK submissions and approve monthly reporting.",
      },
      assignments: {
        title: "Assign New Village",
        subtitle: "Assign villages to users and manage coverage.",
      },
      users: {
        title: "User Management",
        subtitle: "Add, update, and manage user access.",
      },
      masterData: {
        title: "Manage Master Data",
        subtitle: "Maintain core reference lists like villages and regions.",
      },
    }),
    [],
  );

  const NavButton = ({
    id,
    label,
    icon,
  }: {
    id: SectionKey;
    label: string;
    icon: ReactNode;
  }) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setActiveSection(id)}
      aria-current={activeSection === id ? "page" : undefined}
      className={`${navBtnBase} ${activeSection === id ? navBtnActive : ""}`}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </Button>
  );

  const SectionCard = ({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle?: string;
    children: ReactNode;
  }) => (
    <section className="rounded-xl border bg-white shadow-sm">
      <div className="p-4 md:p-6 border-b">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-xs md:text-sm text-gray-500 mt-1">{subtitle}</p>
        ) : null}
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </section>
  );

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive text-lg">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-white via-white to-gray-100">
      <header className="sticky top-0 z-10 border-b bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/65 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="h-8 px-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          <h1 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
            Admin Panel
          </h1>

          {/* Nav - wrap on desktop, scroll on very small screens */}
          <div className="max-w-[72vw]">
            <div className="flex flex-nowrap md:flex-wrap items-center justify-end gap-2 overflow-x-auto md:overflow-visible py-1">
              <NavButton
                id="records"
                label="View Records"
                icon={<FileText className={iconCls} />}
              />
              <NavButton
                id="assignments"
                label="Assign Villages"
                icon={<MapPin className={iconCls} />}
              />
              <NavButton
                id="users"
                label="Manage Users"
                icon={<UserPlus className={iconCls} />}
              />
              <NavButton
                id="masterData"
                label="Master Data"
                icon={<EditIcon className={iconCls} />}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {activeSection === "records" && (
          <SectionCard
            title={sectionMeta.records.title}
            subtitle={sectionMeta.records.subtitle}
          >
            <AdminRecordReview />
          </SectionCard>
        )}

        {activeSection === "assignments" && (
          <SectionCard
            title={sectionMeta.assignments.title}
            subtitle={sectionMeta.assignments.subtitle}
          >
            <VillageAssignment />
          </SectionCard>
        )}

        {activeSection === "users" && (
          <SectionCard
            title={sectionMeta.users.title}
            subtitle={sectionMeta.users.subtitle}
          >
            <UserManagement />
          </SectionCard>
        )}

        {activeSection === "masterData" && (
          <SectionCard
            title={sectionMeta.masterData.title}
            subtitle={sectionMeta.masterData.subtitle}
          >
            <p className="text-sm text-gray-600">
              Add or update master data here (e.g., villages, regions).
            </p>
          </SectionCard>
        )}
      </main>
    </div>
  );
};

export default Admin;
