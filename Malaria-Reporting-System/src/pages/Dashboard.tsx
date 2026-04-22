import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import LocalRecordsGrid from "@/components/LocalRecordsGrid";
import NonLocalRecordsGrid from "@/components/NonLocalRecordsGrid";
import { LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <h1 className="text-base md:text-lg font-semibold tracking-tight text-gray-900">
            Malaria Reporting System
          </h1>

          <div className="flex items-center gap-2 md:gap-3">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
                className="h-8 px-3 border-gray-200 bg-white text-gray-800 hover:bg-gray-50 shadow-sm"
              >
                <Shield className="h-4 w-4 mr-2" /> Admin
              </Button>
            )}

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-700 truncate max-w-[260px]">
                {profile?.full_name || profile?.email}
              </span>

              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border border-gray-200 bg-gray-50 text-gray-700">
                {role}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="h-8 px-2 md:px-3 gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="px-4 md:px-6 py-4 border-b">
              <Tabs defaultValue="local" className="w-full">
                <TabsList className="w-fit rounded-lg bg-gray-100 p-1">
                  <TabsTrigger
                    value="local"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Local
                  </TabsTrigger>
                  <TabsTrigger
                    value="non-local"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Non-Local
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  <TabsContent value="local" className="m-0">
                    <LocalRecordsGrid />
                  </TabsContent>

                  <TabsContent value="non-local" className="m-0">
                    <NonLocalRecordsGrid />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
