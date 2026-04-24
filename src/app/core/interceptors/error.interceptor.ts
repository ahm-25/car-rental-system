import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

const isAuthEndpoint = (url: string): boolean =>
  /\/(customer|admin)\/(login|register)$/.test(url);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = 'An unexpected error occurred.';
      const serverMessage = (err.error as { message?: string } | null)?.message;

      switch (err.status) {
        case 0:
          message = 'Network error. Please check your connection.';
          break;
        case 401:
          if (isAuthEndpoint(req.url)) {
            message = serverMessage ?? 'Invalid credentials.';
          } else {
            message = 'Your session has expired. Please log in again.';
            auth.clearSession();
            router.navigate(['/login']);
          }
          break;
        case 403:
          message = serverMessage ?? 'You do not have permission to perform this action.';
          break;
        case 404:
          message = serverMessage ?? 'Resource not found.';
          break;
        case 422:
          message = serverMessage ?? 'Validation failed. Please review the form.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          message = serverMessage ?? message;
      }

      notify.error(message);
      return throwError(() => err);
    }),
  );
};
