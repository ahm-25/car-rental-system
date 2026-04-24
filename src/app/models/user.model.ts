export type UserRole = 'admin' | 'customer';

export interface User {
  id: number;
  name: string;
  email: string;
  /** May be null for admin accounts created without a phone */
  phone: string | null;
  /** May be null for admin accounts created without a country */
  country: string | null;
  /** Returned as a decimal string (e.g. "5000.00") or null */
  wallet: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  orders?: import('./order.model').Order[];
}

// ─── Auth payloads ────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

/** Customer self-registration – sent to POST /customer/register */
export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  /** Must match the API key exactly (snake_case) */
  password_confirmation: string;
}

/** Admin self-registration – sent to POST /admin/register */
export interface AdminRegisterPayload {
  name: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// ─── Admin CRUD payloads ──────────────────────────────────────────────────────

/** Body for POST /admin/users */
export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  wallet?: number;
  role: UserRole;
}

/** Body for PUT /admin/users/:id  (all fields optional) */
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  wallet?: number;
  role?: UserRole;
}

export interface DeleteUserResponse {
  message: string;
}

/** Response shape for GET /admin/users/:id (user + their orders) */
export interface UserWithOrders extends User {
  orders: import('./order.model').Order[];
}
