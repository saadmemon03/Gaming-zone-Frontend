export type UserRole =
  | "admin"
  | "manager"
  | "staff"
  | "user";

export interface User {
  id: string;
  _id?: string;

  name: string;
  email: string;

  phone?: string;

  role: UserRole;

  isActive: boolean;

  createdAt: string;
  updatedAt?: string;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;

  token: string;

  user: User;
}