import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
  UserRole,
} from '../../models/user.model';

const TOKEN_KEY = 'crs_token';
const USER_KEY = 'crs_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private readonly _user = signal<User | null>(this.readStoredUser());
  private readonly _token = signal<string | null>(this.readStoredToken());

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly role = computed<UserRole | null>(() => this._user()?.role ?? null);

  getToken(): string | null {
    return this._token();
  }

  hasRole(role: UserRole): boolean {
    return this._user()?.role === role;
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/customer/login`, payload)
      .pipe(tap((res) => this.setSession(res.token, res.user)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/customer/register`, payload)
      .pipe(tap((res) => this.setSession(res.token, res.user)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/customer/logout`, {}).pipe(
      catchError(() => of(void 0)),
      tap(() => this.clearSession()),
    );
  }

  loadCurrentUser(): Observable<User> {
    return this.http
      .get<User>(`${this.baseUrl}/customer/me`)
      .pipe(tap((user) => this._user.set(user)));
  }

  setSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  defaultRouteForRole(): string {
    return this._user()?.role === 'admin' ? '/admin/users' : '/cars';
  }

  private readStoredToken(): string | null {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem(TOKEN_KEY)
      : null;
  }

  private readStoredUser(): User | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
