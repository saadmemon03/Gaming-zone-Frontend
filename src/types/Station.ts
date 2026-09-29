export type StationType =
  | "Gaming PC"
  | "PlayStation 5"
  | "Xbox";
export type StationStatus =
  | "Available"
  | "Occupied"
  | "Reserved"
  | "Maintenance";

export interface Station {
  id: string;
  _id?: string;
  name: string;
  type: StationType;
  specs?: string;
  hourlyRate: number;
  status: StationStatus;
  usageHours?: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStationData {
  name: string;
  type: StationType;
  hourlyRate: number;
  status: StationStatus;
  usageHours?: number;
  image?: string;
}

export type UpdateStationData =
  Partial<CreateStationData>;