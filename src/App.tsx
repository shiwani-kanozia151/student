import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import AdminLogin from "./components/auth/AdminLogin";
import AdminRoleSelector from "./components/admin/AdminRoleSelector";
import ContentAdmin from "./components/admin/ContentAdmin";
import VerificationAdmin from "./components/admin/VerificationAdmin";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/super-admin"
            element={<Navigate to="/super-admin/login" />}
          />
          <Route
            path="/super-admin/login"
            element={<AdminLogin adminType="super" />}
          />
          <Route
            path="/content-admin"
            element={<Navigate to="/content-admin/login" />}
          />
          <Route
            path="/content-admin/login"
            element={<AdminLogin adminType="content" />}
          />
          <Route
            path="/verification-admin"
            element={<Navigate to="/verification-admin/login" />}
          />
          <Route
            path="/verification-admin/login"
            element={<AdminLogin adminType="verification" />}
          />
          <Route path="/admin/content" element={<ContentAdmin />} />
          <Route path="/admin/verification" element={<VerificationAdmin />} />
          <Route
            path="/admin/select-role"
            element={
              <AdminRoleSelector
                onRoleSelect={(role) => {
                  if (role === "content") {
                    window.location.href = "/admin/content";
                  } else if (role === "verification") {
                    window.location.href = "/admin/verification";
                  }
                }}
              />
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/select-role" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </>
    </Suspense>
  );
}

export default App;
