export type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

export interface Booking {
  id: string;

  userId: string;
  userName: string;

  stationId: string;
  stationName: string;

  gameId?: string;
  gameName?: string;

  startTime: string;
  endTime: string;

  amount: number;

  status: BookingStatus;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingData {
  userId: string;
  stationId: string;
  gameId?: string;

  startTime: string;
  endTime: string;

  amount: number;
}

export interface UpdateBookingData {
  status?: BookingStatus;
  startTime?: string;
  endTime?: string;
}