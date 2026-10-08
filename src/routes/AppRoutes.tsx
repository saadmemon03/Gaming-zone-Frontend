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
import AdminChatPage from "../pages/AdminChatPage";
import UserChatWidget from "../components/chat/UserChatWidget";
import { Toaster } from "react-hot-toast";
import AdminLayout from "../components/layout/AdminLayout";

function AdminProtectedLayout() {
  const token = localStorage.getItem("gaming_token");
  const role = localStorage.getItem("gaming_user_role")?.toLowerCase();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (role !== "admin" && role !== "manager" && role !== "staff") {
    return <Navigate to="/user" replace />;
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
      <Toaster position="top-right" />
      <Routes>
        {/* The public user site is the default landing page. */}
        <Route path="/" element={<Navigate to="/user" replace />} />
        
        {/* Public / Common Login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/verify-email" element={<VerifyOTPPage />} />

        {/* User site is open by default; booking/account actions handle sign-in in the UI. */}
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/gallery" element={<GalleryPage />} />

        {/* Admin System */}
        <Route path="/admin" element={<AdminProtectedLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="stations" element={<StationsPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="chat" element={<AdminChatPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/user" replace />} />
      </Routes>
      <UserChatWidget />
    </BrowserRouter>
  );
}