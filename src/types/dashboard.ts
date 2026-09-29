export interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  totalStations: number;

  revenueChange: number;
  bookingChange: number;
  userChange: number;
  stationChange: number;
}

export interface RevenueData {
  label: string;
  value: number;
}

export interface StationOverview {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
}