import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";

import DashboardPage from "../pages/DashboardPage";
import StationsPage from "../pages/StationsPage";
import GamesPage from "../pages/GamesPage";
import BookingsPage from "../pages/BookingsPage";
import UsersPage from "../pages/UsersPage";
import CustomersPage from "../pages/CustomersPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import VerifyOTPPage from "../pages/VerifyOTPPage";
import UserDashboard from "../pages/UserDashboard";
import AboutPage from "../pages/AboutPage";
import ContactPage from "../pages/ContactPage";
import GalleryPage from "../pages/GalleryPage";
import { Toaster } from "react-hot-toast";
import AdminLayout from "../components/layout/AdminLayout";

function AdminProtectedLayout() {
  const token = localStorage.getItem("gaming_token");
  const role = localStorage.getItem("gaming_user_role");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Allow admin, manager, or staff to access the admin panel
  if (role !== "admin" && role !== "manager" && role !== "staff") {
    return <Navigate to="/user" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

function UserProtectedLayout() {
  const token = localStorage.getItem("gaming_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Redirect Root to User Page */}
        <Route path="/" element={<Navigate to="/user" replace />} />
        
        {/* Public / Common Login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/verify-email" element={<VerifyOTPPage />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Protected User Pages */}
        <Route element={<UserProtectedLayout />}>
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
        </Route>

        {/* Admin System */}
        <Route path="/admin" element={<AdminProtectedLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="stations" element={<StationsPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="customers" element={<CustomersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/user" replace />} />
      </Routes>
    </BrowserRouter>
  );
}