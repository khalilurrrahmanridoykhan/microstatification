import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Login = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
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
    <div className="relative flex min-h-screen items-center justify-center bg-white p-4">
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <Card className="w-full max-w-sm border-muted/50 bg-white/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-xl tracking-tight">
            Malaria Annual Reporting
          </CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="rounded-lg border border-muted/60 bg-white/60 p-3 backdrop-blur-md">
            <p className="text-xs font-medium text-foreground">Demo credentials</p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Admin:</span>{" "}
                admin@test.com / 123456
              </p>
              <p>
                <span className="font-semibold text-foreground">SK:</span>{" "}
                sk1@test.com / 123456
              </p>
            </div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Authorized access only. Contact Admin for account support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
