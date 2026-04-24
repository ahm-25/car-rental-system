import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Paginated } from '../../../models/pagination.model';
import { User, UserRole } from '../../../models/user.model';

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

  getById(id: number | string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/admin/users/${id}`);
  }
}
