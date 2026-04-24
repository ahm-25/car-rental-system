import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Installment,
  PayInstallmentResponse,
} from '../../../models/order.model';
import { Paginated } from '../../../models/pagination.model';

export interface CustomerInstallmentsQuery {
  page?: number;
  perPage?: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerInstallmentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  list(query: CustomerInstallmentsQuery): Observable<Paginated<Installment>> {
    let params = new HttpParams();

    if (query.page) params = params.set('page', query.page);
    if (query.perPage) params = params.set('per_page', query.perPage);

    return this.http.get<Paginated<Installment>>(
      `${this.baseUrl}/customer/installments`,
      { params },
    );
  }

  pay(id: number | string): Observable<PayInstallmentResponse> {
    return this.http.post<PayInstallmentResponse>(
      `${this.baseUrl}/customer/installments/${id}/pay`,
      {},
    );
  }
}
