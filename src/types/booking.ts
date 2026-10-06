export type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

export interface Booking {
  id: string;
  _id?: string;

  userId?: string;
  userName?: string;
  guestName?: string;
  contactNumber?: string;
  customerEmail?: string;

  stationId?: string;
  stationName?: string;
  station?: {
    _id?: string;
    id?: string;
    name?: string;
    platform?: string;
  };

  gameId?: string;
  gameName?: string;
  game?: { _id?: string; id?: string; name?: string } | string;

  startTime: string;
  endTime: string;

  amount: number;
  addons?: Array<{ name: string; price: number; quantity: number }>;
  pointsEarned?: number;

  status: BookingStatus;
  bookingSource?: "Online" | "Walk-in";

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingData {
  userId?: string;
  guestName?: string;
  contactNumber?: string;
  customerEmail?: string;
  stationId: string;
  station?: string;
  gameId?: string;

  startTime: string;
  endTime: string;

  amount: number;
  addons?: Array<{ name: string; price: number; quantity: number }>;
  pointsEarned?: number;
  bookingSource?: "Online" | "Walk-in";
}

export interface UpdateBookingData {
  status?: BookingStatus;
  startTime?: string;
  endTime?: string;
}