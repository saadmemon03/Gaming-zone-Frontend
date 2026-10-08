import type { Station, CreateStationData } from "../types/Station";
import type { Game, CreateGameData } from "../types/game";
import type { User } from "../types/user";
import type { Booking, CreateBookingData, UpdateBookingData } from "../types/booking";
import type { DashboardStats, RevenueData, StationOverview } from "../types/dashboard";

// ─────────────────────────────────────────────────────────────────────────────
//  Gaming Admin Panel — API Service
// ─────────────────────────────────────────────────────────────────────────────

// Vite Environment Variable Read Syntax
const rawUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL_BASE_URL || "http://localhost:5000/api";

// Auto-fix URL format: Ensure https:// prefix to prevent relative pathing on Vercel
const getFormattedBaseUrl = (url: string) => {
  let formatted = url.trim();
  if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
    formatted = `https://${formatted}`;
  }
  return formatted.endsWith("/") ? formatted.slice(0, -1) : formatted;
};

export const API_BASE_URL = getFormattedBaseUrl(rawUrl);

const NO_RESPONSE_MESSAGE =
  "No response received from the server. Please check your internet connection or try again later.";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError) return NO_RESPONSE_MESSAGE;
  return error instanceof Error && error.message ? error.message : fallback;
}

// ─── Token helpers ────────────────────────────────────────────────────────────
function getToken(): string {
  return localStorage.getItem("gaming_token") ?? "";
}

export function getAuthToken(): string {
  return getToken();
}

export const SOCKET_URL = new URL(API_BASE_URL).origin;

function saveToken(token: string): void {
  localStorage.setItem("gaming_token", token);
}

function clearToken(): void {
  localStorage.removeItem("gaming_token");
  localStorage.removeItem("gaming_user_id");
  localStorage.removeItem("gaming_user_name");
  localStorage.removeItem("gaming_user_role");
  window.dispatchEvent(new Event("auth_changed"));
}

function createQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const entries = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => [key, String(value)]);
  const q = new URLSearchParams(entries).toString();
  return q ? `?${q}` : "";
}

// ─── Generic fetch wrapper ────────────────────────────────────────────────────
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const res = await fetch(`${API_BASE_URL}${formattedEndpoint}`, { ...options, headers });

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Request failed with status ${res.status}`);
  }

  if (!res.ok) {
    if (res.status === 401) {
      const role = localStorage.getItem("gaming_user_role");
      clearToken();
      if (role === "admin") {
        window.location.href = "/admin/login";
      } else {
        window.location.href = "/login";
      }
    }
    throw new Error(data?.message ?? "Something went wrong");
  }

  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  page?: number;
  limit?: number;
}

export interface ApiMessage {
  success: boolean;
  message: string;
}

// ═════════════════════════════════════════════════════════════════════════════
//  AUTH
// ═════════════════════════════════════════════════════════════════════════════
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await request<{
      success: boolean;
      token: string;
      user: User;
      message: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveToken(data.token);
    localStorage.setItem("gaming_user_role", data.user.role || "user");
    localStorage.setItem("gaming_user_id", data.user._id || "");
    localStorage.setItem("gaming_user_name", data.user.name || "");
    window.dispatchEvent(new Event("auth_changed"));
    return data;
  },

  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    request<ApiMessage>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyEmail: (email: string, otp: string) =>
    request<ApiMessage>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  resendVerificationOtp: (email: string) =>
    request<ApiMessage>("/auth/resend-verification-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  me: () => request<{ success: boolean; user: User }>("/auth/me"),

  logout: () => {
    clearToken();
  },

  forgotPassword: (email: string) =>
    request<ApiMessage>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    request<ApiMessage>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ═════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
export const dashboardApi = {
  getStats: () =>
    request<ApiResponse<DashboardStats>>("/dashboard/stats"),

  getRevenue: (period: 7 | 30 | 90 = 30) =>
    request<ApiResponse<RevenueData[]>>(`/dashboard/revenue?period=${period}`),

  getStationOverview: () =>
    request<ApiResponse<StationOverview>>("/dashboard/station-overview"),

  getRecentBookings: () =>
    request<ApiResponse<Booking[]>>("/dashboard/recent-bookings"),
};

// ═════════════════════════════════════════════════════════════════════════════
//  STATIONS
// ═════════════════════════════════════════════════════════════════════════════
export const stationsApi = {
  getAll: (params?: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) => request<ApiResponse<Station[]>>(`/stations${createQueryString(params)}`),

  getById: (id: string) =>
    request<ApiResponse<Station>>(`/stations/${id}`),

  create: (data: CreateStationData) =>
    request<ApiResponse<Station>>("/stations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateStationData>) =>
    request<ApiResponse<Station>>(`/stations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<ApiMessage>(`/stations/${id}`, { method: "DELETE" }),
};

// ═════════════════════════════════════════════════════════════════════════════
//  GAMES
// ═════════════════════════════════════════════════════════════════════════════
export const gamesApi = {
  getAll: (params?: {
    search?: string;
    platform?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => request<ApiResponse<Game[]>>(`/games${createQueryString(params)}`),

  getById: (id: string) => request<ApiResponse<Game>>(`/games/${id}`),

  create: (data: CreateGameData) =>
    request<ApiResponse<Game>>("/games", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateGameData>) =>
    request<ApiResponse<Game>>(`/games/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<ApiMessage>(`/games/${id}`, { method: "DELETE" }),
};

// ═════════════════════════════════════════════════════════════════════════════
//  USERS
// ═════════════════════════════════════════════════════════════════════════════
export const usersApi = {
  getAll: (params?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) => request<ApiResponse<User[]>>(`/users${createQueryString(params)}`),

  getById: (id: string) => request<ApiResponse<User>>(`/users/${id}`),

  create: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) =>
    request<ApiResponse<User>>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<{
      name: string;
      email: string;
      password: string;
      phone: string;
      role: string;
      isActive: boolean;
    }>
  ) =>
    request<ApiResponse<User>>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<ApiMessage>(`/users/${id}`, { method: "DELETE" }),

  updateCustomer: (id: string, data: { name: string; phone: string }) =>
    request<ApiResponse<User>>(`/users/${id}/customer`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  archiveCustomer: (id: string) =>
    request<ApiMessage>(`/users/${id}/customer`, { method: "DELETE" }),
};

// ═════════════════════════════════════════════════════════════════════════════
//  BOOKINGS
// ═════════════════════════════════════════════════════════════════════════════
export const bookingsApi = {
  getAll: (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    my?: boolean;
  }) => request<ApiResponse<Booking[]>>(`/bookings${createQueryString(params)}`),

  getById: (id: string) => request<ApiResponse<Booking>>(`/bookings/${id}`),

  create: (data: CreateBookingData) =>
    request<ApiResponse<Booking>>("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateBookingData) =>
    request<ApiResponse<Booking>>(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<ApiMessage>(`/bookings/${id}`, { method: "DELETE" }),

  updateGuestCustomer: (data: {
    currentName: string;
    currentContact: string | null;
    name: string;
    contact: string;
  }) =>
    request<ApiMessage>("/bookings/customers/guest", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteGuestCustomer: (data: {
    name: string;
    contact: string | null;
  }) =>
    request<ApiMessage>("/bookings/customers/guest", {
      method: "DELETE",
      body: JSON.stringify(data),
    }),
};
