import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Page Missing</p>
        <h1 className="font-display mt-3 text-6xl text-foreground">404</h1>

        <p className="mt-3 text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or has been moved.
        </p>

        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-full border-border/80 bg-card/90 px-5 text-foreground hover:bg-secondary/90"
            >
              Return to Home
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Path: {location.pathname}
        </p>
      </div>
    </div>
  );
};

export default NotFound;
