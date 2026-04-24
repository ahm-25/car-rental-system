import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Paginated } from '../../../models/pagination.model';
import {
  CreateUserPayload,
  DeleteUserResponse,
  UpdateUserPayload,
  User,
  UserRole,
  UserWithOrders,
} from '../../../models/user.model';

export interface UsersQuery {
  page?: number;
  perPage?: number;
  search?: string;
  role?: UserRole;
  country?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** GET /admin/users — paginated list with optional filters */
  list(query: UsersQuery): Observable<Paginated<User>> {
    let params = new HttpParams();

    if (query.page) params = params.set('page', query.page);
    if (query.perPage) params = params.set('per_page', query.perPage);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.role) params = params.set('role', query.role);
    if (query.country?.trim()) params = params.set('country', query.country.trim());

    return this.http.get<Paginated<User>>(`${this.baseUrl}/admin/users`, {
      params,
    });
  }

  /** GET /admin/users/:id — single user with their orders */
  getById(id: number | string): Observable<UserWithOrders> {
    return this.http.get<UserWithOrders>(`${this.baseUrl}/admin/users/${id}`);
  }

  /** POST /admin/users — create a new user (admin or customer) */
  create(payload: CreateUserPayload): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/admin/users`, payload);
  }

  /** PUT /admin/users/:id — update user fields (name, wallet, etc.) */
  update(id: number | string, payload: UpdateUserPayload): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/admin/users/${id}`, payload);
  }

  /** DELETE /admin/users/:id */
  delete(id: number | string): Observable<DeleteUserResponse> {
    return this.http.delete<DeleteUserResponse>(
      `${this.baseUrl}/admin/users/${id}`,
    );
  }
}
