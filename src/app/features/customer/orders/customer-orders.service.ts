import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateOrderPayload,
  Order,
} from '../../../models/order.model';
import { Paginated } from '../../../models/pagination.model';

export interface CustomerOrdersQuery {
  page?: number;
  perPage?: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerOrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  list(query: CustomerOrdersQuery): Observable<Paginated<Order>> {
    let params = new HttpParams();

    if (query.page) params = params.set('page', query.page);
    if (query.perPage) params = params.set('per_page', query.perPage);

    return this.http.get<Paginated<Order>>(`${this.baseUrl}/customer/orders`, {
      params,
    });
  }

  getById(id: number | string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/customer/orders/${id}`);
  }

  create(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/customer/orders`, payload);
  }
}
