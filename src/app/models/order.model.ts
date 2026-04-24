import { Car } from './car.model';
import { User } from './user.model';

export type PaymentType = 'visa' | 'cash' | 'tamara';
export type PaymentStatus = 'success' | 'pending';
export type OrderType = 'full' | 'installments';
export type InstallmentStatus = 'paid' | 'pending';

export interface Installment {
  id: number;
  order_id: number;
  amount: string;
  due_date: string;
  status: InstallmentStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order?: Order;
}

export interface Order {
  id: number;
  user_id: number;
  car_id: number;
  delivery_date: string;
  receiving_date: string;
  days: number;
  total_price: string;
  points: number;
  payment_type: PaymentType;
  payment_status: PaymentStatus;
  order_type: OrderType;
  created_at: string;
  updated_at: string;
  user?: User;
  car?: Car;
  installments?: Installment[];
}

interface CreateOrderCommon {
  car_id: number;
  delivery_date: string;
  receiving_date: string;
  payment_type: PaymentType;
}

export type CreateOrderPayload =
  | (CreateOrderCommon & { order_type: 'full' })
  | (CreateOrderCommon & {
      order_type: 'installments';
      down_payment: number;
      number_of_installments: number;
    });

export interface UpdateOrderPayload {
  payment_status?: PaymentStatus;
}

export interface PayInstallmentResponse {
  message: string;
  installment: Installment;
  order: Order;
}
