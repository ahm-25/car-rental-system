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
      let message = 'errors.server_error';
      const serverMessage = (err.error as { message?: string } | null)?.message;

      switch (err.status) {
        case 0:
          message = 'errors.network_error';
          break;
        case 401:
          if (isAuthEndpoint(req.url)) {
            message = serverMessage === 'Invalid credentials' ? 'errors.invalid_credentials' : (serverMessage ?? 'errors.invalid_credentials');
          } else {
            message = 'errors.session_expired';
            auth.clearSession();
            router.navigate(['/login']);
          }
          break;
        case 403:
          message = serverMessage ?? 'errors.forbidden';
          break;
        case 404:
          message = serverMessage ?? 'errors.resource_not_found';
          break;
        case 422:
          message = serverMessage ?? 'errors.validation_failed';
          break;
        case 500:
          message = 'errors.server_error';
          break;
        default:
          message = serverMessage ?? message;
      }

      notify.error(message);
      return throwError(() => err);
    }),
  );
};
