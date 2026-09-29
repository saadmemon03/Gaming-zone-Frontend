import type { Station, CreateStationData } from "../types/Station";
import type { Game, CreateGameData } from "../types/game";
import type { User } from "../types/user";
import type { Booking, CreateBookingData, UpdateBookingData } from "../types/booking";
import type { DashboardStats, RevenueData, StationOverview } from "../types/dashboard";

// ─────────────────────────────────────────────────────────────────────────────
//  Gaming Admin Panel — API Service
//  Base URL: http://localhost:5000/api
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:5000/api";

// ─── Token helpers ────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("gaming_token") ?? "";
}

function saveToken(token: string) {
  localStorage.setItem("gaming_token", token);
}

function clearToken() {
  localStorage.removeItem("gaming_token");
}

// ─── Generic fetch wrapper ────────────────────────────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    // Agar Unauthorized (401) ya Forbidden (403) aye toh token delete karke login par bhej do
    if (res.status === 401 || res.status === 403) {
      clearToken();
      window.location.href = "/login";
    }
    throw new Error(data.message ?? "Something went wrong");
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
  // POST /api/auth/login
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
    return data;
  },

  // GET /api/auth/me
  me: () => request<ApiResponse<User>>("/auth/me"),

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
  // GET /api/dashboard/stats
  getStats: () =>
    request<ApiResponse<DashboardStats>>("/dashboard/stats"),

  // GET /api/dashboard/revenue?period=30
  getRevenue: (period: 7 | 30 | 90 = 30) =>
    request<ApiResponse<RevenueData[]>>(`/dashboard/revenue?period=${period}`),

  // GET /api/dashboard/station-overview
  getStationOverview: () =>
    request<ApiResponse<StationOverview>>("/dashboard/station-overview"),

  // GET /api/dashboard/recent-bookings
  getRecentBookings: () =>
    request<ApiResponse<Booking[]>>("/dashboard/recent-bookings"),
};

// ═════════════════════════════════════════════════════════════════════════════
//  STATIONS
// ═════════════════════════════════════════════════════════════════════════════
export const stationsApi = {
  // GET /api/stations?search=&status=&type=&page=1&limit=50
  getAll: (params?: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<ApiResponse<Station[]>>(`/stations${q ? "?" + q : ""}`);
  },

  // GET /api/stations/:id
  getById: (id: string) =>
    request<ApiResponse<Station>>(`/stations/${id}`),

  // POST /api/stations
  create: (data: CreateStationData) =>
    request<ApiResponse<Station>>("/stations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // PUT /api/stations/:id
  update: (id: string, data: Partial<CreateStationData>) =>
    request<ApiResponse<Station>>(`/stations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // DELETE /api/stations/:id
  delete: (id: string) =>
    request<ApiMessage>(`/stations/${id}`, { method: "DELETE" }),
};

// ═════════════════════════════════════════════════════════════════════════════
//  GAMES
// ═════════════════════════════════════════════════════════════════════════════
export const gamesApi = {
  // GET /api/games?search=&platform=&isActive=true
  getAll: (params?: {
    search?: string;
    platform?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return request<ApiResponse<Game[]>>(`/games${q ? "?" + q : ""}`);
  },

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
  // GET /api/users?search=&role=&page=1&limit=20
  getAll: (params?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<ApiResponse<User[]>>(`/users${q ? "?" + q : ""}`);
  },

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
};

// ═════════════════════════════════════════════════════════════════════════════
//  BOOKINGS
// ═════════════════════════════════════════════════════════════════════════════
export const bookingsApi = {
  // GET /api/bookings?search=&status=&page=1&limit=20
  getAll: (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<ApiResponse<Booking[]>>(`/bookings${q ? "?" + q : ""}`);
  },

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
};

