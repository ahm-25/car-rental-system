import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Car,
  CreateCarPayload,
  DeleteCarResponse,
  UpdateCarPayload,
} from '../../../models/car.model';
import { Paginated } from '../../../models/pagination.model';

export interface CarsQuery {
  page?: number;
  perPage?: number;
  search?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminCarsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  list(query: CarsQuery): Observable<Paginated<Car>> {
    let params = new HttpParams();

    if (query.page) params = params.set('page', query.page);
    if (query.perPage) params = params.set('per_page', query.perPage);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.brand?.trim()) params = params.set('brand', query.brand.trim());
    if (query.min_price !== undefined && query.min_price !== null) {
      params = params.set('min_price', query.min_price);
    }
    if (query.max_price !== undefined && query.max_price !== null) {
      params = params.set('max_price', query.max_price);
    }

    return this.http.get<Paginated<Car>>(`${this.baseUrl}/admin/cars`, {
      params,
    });
  }

  getById(id: number | string): Observable<Car> {
    return this.http.get<Car>(`${this.baseUrl}/admin/cars/${id}`);
  }

  create(payload: CreateCarPayload): Observable<Car> {
    return this.http.post<Car>(`${this.baseUrl}/admin/cars`, payload);
  }

  update(id: number | string, payload: UpdateCarPayload): Observable<Car> {
    return this.http.put<Car>(`${this.baseUrl}/admin/cars/${id}`, payload);
  }

  delete(id: number | string): Observable<DeleteCarResponse> {
    return this.http.delete<DeleteCarResponse>(
      `${this.baseUrl}/admin/cars/${id}`,
    );
  }
}
