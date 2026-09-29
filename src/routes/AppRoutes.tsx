import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";

import AdminLayout from "../components/layout/AdminLayout";
import DashboardPage from "../pages/DashboardPage";
import StationsPage from "../pages/StationsPage";
import GamesPage from "../pages/GamesPage";
import BookingsPage from "../pages/BookingsPage";
import UsersPage from "../pages/UsersPage";
import CustomersPage from "../pages/CustomersPage";
import LoginPage from "../pages/LoginPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";

function ProtectedLayout() {
  const token = localStorage.getItem("gaming_token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/stations" element={<StationsPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}