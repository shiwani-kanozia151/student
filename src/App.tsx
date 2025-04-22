import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import AdminLogin from "./components/auth/AdminLogin";
import AdminRoleSelector from "./components/admin/AdminRoleSelector";
import ContentAdmin from "./components/admin/ContentAdmin";
import VerificationAdmin from "./components/admin/VerificationAdmin";
import VerificationOfficerDashboard from "@/components/admin/VerificationOfficerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentDashboard from "./components/student/StudentDashboard";
import CourseSelection from "./components/student/CourseSelection";
import ApplicationForm from "./components/student/ApplicationForm";
import routes from "tempo-routes";
// Import the course editor pages
import CourseEditorLogin from "./pages/course-editor-login";
import CourseEditorDashboard from "./pages/course-editor-dashboard";
import VerificationAdminManager from "./components/admin/verification/VerificationAdminManager";
import VerificationOfficerLogin from "./components/auth/VerificationOfficerLogin";

const AboutUs = lazy(() => import("./components/about/AboutUs"));
const Administration = lazy(
  () => import("./components/administration/Administration"),
);
const Academic = lazy(() => import("./components/academic/Academic"));
const Admission = lazy(() => import("./components/admission/Admission"));
const Courses = lazy(() => import("./components/courses/Courses"));

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      <Routes>
        {/* Main Route */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/administration" element={<Administration />} />
        <Route path="/academic" element={<Academic />} />
        <Route path="/admission" element={<Admission />} />
        <Route path="/courses" element={<Courses />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/courses" element={<CourseSelection />} />
        <Route
          path="/student/application/:courseId"
          element={<ApplicationForm />}
        />

        {/* Super Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<AdminLogin adminType="super" />} />
        <Route
          path="/admin/select-role"
          element={
            <ProtectedRoute requiredRole="super">
              <AdminRoleSelector
                onRoleSelect={(role) => {
                  if (role === "content") {
                    window.location.href = "/content-admin/dashboard";
                  } else if (role === "verification") {
                    window.location.href = "/verification-admin/dashboard";
                  }
                }}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verification-management"
          element={
            <ProtectedRoute requiredRole="super">
              <VerificationAdminManager />
            </ProtectedRoute>
          }
        />

        {/* Content Admin Routes */}
        <Route
          path="/content-admin"
          element={<Navigate to="/content-admin/login" />}
        />
        <Route
          path="/content-admin/login"
          element={<AdminLogin adminType="content" />}
        />
        <Route
          path="/content-admin/dashboard"
          element={
            <ProtectedRoute requiredRole="content">
              <ContentAdmin />
            </ProtectedRoute>
          }
        />

        {/* Verification Admin Routes (for super admins using verification role) */}
        <Route
          path="/verification-admin"
          element={<Navigate to="/verification-admin/login" />}
        />
        <Route
          path="/verification-admin/login"
          element={<AdminLogin adminType="verification" />}
        />
        <Route
          path="/verification-admin/dashboard"
          element={
            <ProtectedRoute requiredRole="verification">
              <VerificationAdmin />
            </ProtectedRoute>
          }
        />
        
        {/* Verification Officer Routes (for course-specific verification officers) */}
        <Route path="/verification-officer/login" element={<VerificationOfficerLogin />} />
        <Route path="/verification-officer/dashboard" element={<VerificationOfficerDashboard />} />

        {/* Course Editor Routes */}
        <Route path="/course-editor-login" element={<CourseEditorLogin />} />
        <Route path="/course-editor-dashboard" element={<CourseEditorDashboard />} />

        {/* Tempo Routes */}
        {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;
