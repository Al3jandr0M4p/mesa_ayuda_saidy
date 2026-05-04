import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRedirect } from "./components/RoleRedirect";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RoleRedirect />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
