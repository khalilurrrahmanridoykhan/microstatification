import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { role, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If authenticated, go to dashboard
    if (role && profile) {
      navigate("/dashboard", { replace: true });
    } else {
      // Otherwise go to login
      navigate("/login", { replace: true });
    }
  }, [role, profile, navigate]);

  // Minimal neutral loading state (no blank flash)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-sm text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
};

export default Index;
