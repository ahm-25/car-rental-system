export interface Car {
  id: number;
  name: string;
  brand: string;
  model: string;
  kilometers: number;
  price_per_day: number | string;
  created_at: string;
  updated_at: string;
}

export interface CreateCarPayload {
  name: string;
  brand: string;
  model: string;
  kilometers: number;
  price_per_day: number;
}

export type UpdateCarPayload = Partial<CreateCarPayload>;

export interface DeleteCarResponse {
  message: string;
}
