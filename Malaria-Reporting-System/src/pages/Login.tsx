import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, ShieldCheck, Stethoscope, Telescope } from "lucide-react";

const Login = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectTo = await signIn(loginId, password);
      window.location.replace(redirectTo);
    } catch (err: unknown) {
      toast({
        title: "Login failed",
        description:
          err instanceof Error
            ? err.message
            : "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute left-[7%] top-[12%] h-40 w-40 rounded-full border border-primary/10 bg-primary/10 blur-2xl" />
      <div className="pointer-events-none absolute bottom-[10%] right-[8%] h-56 w-56 rounded-full border border-accent/10 bg-accent/10 blur-3xl" />

      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.9fr]">
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="status-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
            <ShieldCheck className="h-4 w-4" />
            Directorate Workspace
          </div>

          <h1 className="font-display mt-6 max-w-3xl text-4xl leading-tight text-foreground sm:text-5xl">
            Field intelligence for malaria reporting, shaped into one operational canvas.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            A cleaner interface for annual reporting, monthly review, and administrative oversight across local and non-local case records.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <Stethoscope className="h-5 w-5" />,
                title: "Case Review",
                text: "Track reporting quality without losing district-level detail.",
              },
              {
                icon: <Telescope className="h-5 w-5" />,
                title: "Program Visibility",
                text: "Surface the right numbers quickly for supervisors and admins.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: "Controlled Access",
                text: "Keep editing, review, and administration separated by role.",
              },
            ].map((item) => (
              <div key={item.title} className="report-surface rounded-[1.5rem] p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  {item.icon}
                </div>
                <h2 className="mt-4 font-display text-2xl text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Secure Sign In
              </p>
              <h2 className="font-display mt-2 text-3xl text-foreground">Malaria Annual Reporting</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                Sign in with your existing ComMicPlan username or email and current password.
              </p>
            </div>
            <div className="rounded-full border border-border/70 bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Authorized Users
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Email or Username
              </label>
              <Input
                type="text"
                placeholder="Your ComMicPlan email or username"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className="field-shell h-12 rounded-2xl px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="field-shell h-12 rounded-2xl px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              />
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[0_12px_30px_hsl(193_72%_25%_/_0.22)] hover:bg-primary/95"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Continue to workspace
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="report-surface mt-6 rounded-[1.5rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Existing Account Access
            </p>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>Your malaria workspace now uses the current ComMicPlan login system.</p>
              <p>Use the same username or email and password you already use in the old system.</p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
            Authorized access only. Contact the system administrator for account support.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
