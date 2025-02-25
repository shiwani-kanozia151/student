import { Navigate } from "react-router-dom";
import { isAuthorized } from "@/lib/adminAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: "super" | "content" | "verification";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const adminEmail = localStorage.getItem("adminEmail");
  const adminRole = localStorage.getItem("adminRole");

  if (!adminEmail || !adminRole) {
    return (
      <Navigate
        to={`/${requiredRole === "super" ? "admin" : requiredRole + "-admin"}/login`}
      />
    );
  }

  if (!isAuthorized(adminEmail, requiredRole)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
