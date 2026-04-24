import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Order,
  OrderType,
  PaymentStatus,
  PaymentType,
  UpdateOrderPayload,
} from '../../../models/order.model';
import { Paginated } from '../../../models/pagination.model';

export interface AdminOrdersQuery {
  page?: number;
  perPage?: number;
  search?: string;
  user_id?: number;
  car_id?: number;
  payment_type?: PaymentType;
  payment_status?: PaymentStatus;
  order_type?: OrderType;
}

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  list(query: AdminOrdersQuery): Observable<Paginated<Order>> {
    let params = new HttpParams();

    if (query.page) params = params.set('page', query.page);
    if (query.perPage) params = params.set('per_page', query.perPage);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.user_id) params = params.set('user_id', query.user_id);
    if (query.car_id) params = params.set('car_id', query.car_id);
    if (query.payment_type) params = params.set('payment_type', query.payment_type);
    if (query.payment_status) params = params.set('payment_status', query.payment_status);
    if (query.order_type) params = params.set('order_type', query.order_type);

    return this.http.get<Paginated<Order>>(`${this.baseUrl}/admin/orders`, {
      params,
    });
  }

  getById(id: number | string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/admin/orders/${id}`);
  }

  update(id: number | string, payload: UpdateOrderPayload): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/admin/orders/${id}`, payload);
  }
}
