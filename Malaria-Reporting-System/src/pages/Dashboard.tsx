import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocalRecordsGrid from "@/components/LocalRecordsGrid";
import NonLocalRecordsGrid from "@/components/NonLocalRecordsGrid";
import { LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const [activeTab, setActiveTab] = useState("local");
  const userLabel = profile?.full_name || profile?.email || "User";
  const initials = userLabel
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="app-shell min-h-screen">
      <AppHeader
        title="Malaria Reporting System"
        subtitle="Review and update local and non-local reporting data from one coordinated workspace."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center rounded-full border border-border/70 bg-card/80 p-1 shadow-sm transition hover:bg-secondary/80">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 rounded-[1.5rem] border border-border/80 bg-card/95 p-2 shadow-xl backdrop-blur-xl">
                <DropdownMenuLabel className="rounded-xl px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{userLabel}</p>
                      <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem className="rounded-xl px-3 py-2.5" onClick={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-red-600 focus:text-red-600" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <main className="mx-auto w-full max-w-[1800px] p-3 sm:p-4 md:p-6">
        <section className="report-surface overflow-hidden rounded-[2rem]">
          <div className="flex flex-col gap-4 border-b border-border/70 px-4 py-4 sm:px-5 md:px-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Reporting Registers
                </p>
                <h2 className="font-display mt-2 text-3xl text-foreground">Annual case submission tables</h2>
              </div>
              <div className="status-pill inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
                {activeTab === "local" ? "Local records in focus" : "Non-local records in focus"}
              </div>
            </div>

            <TabsList className="grid h-auto w-full grid-cols-2 rounded-full bg-secondary/80 p-1 sm:w-fit">
              <TabsTrigger value="local" className="px-4 py-2">
                Local
              </TabsTrigger>
              <TabsTrigger value="non-local" className="px-4 py-2">
                Non-Local
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-3 py-3 sm:px-4 md:px-6 md:py-5">
            <TabsContent value="local" className="m-0">
              <div className="data-grid-shell overflow-hidden p-1 sm:p-2 rounded-[1.5rem]">
                <LocalRecordsGrid />
              </div>
            </TabsContent>

            <TabsContent value="non-local" className="m-0">
              <div className="data-grid-shell overflow-hidden p-1 sm:p-2 rounded-[1.5rem]">
                <NonLocalRecordsGrid />
              </div>
            </TabsContent>
          </div>
        </section>
      </main>
    </Tabs>
  );
};

export default Dashboard;
