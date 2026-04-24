import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../models/user.model';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const requiredRole = route.data['role'] as UserRole | undefined;
  if (requiredRole && !auth.hasRole(requiredRole)) {
    return router.createUrlTree([auth.defaultRouteForRole()]);
  }

  return true;
};
