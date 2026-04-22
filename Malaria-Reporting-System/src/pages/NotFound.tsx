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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm p-8 text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-gray-900">
          404
        </h1>

        <p className="mt-3 text-sm text-gray-600">
          The page you’re looking for doesn’t exist or has been moved.
        </p>

        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
            >
              Return to Home
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Path: {location.pathname}
        </p>
      </div>
    </div>
  );
};

export default NotFound;
