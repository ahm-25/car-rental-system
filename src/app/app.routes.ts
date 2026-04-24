import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'cars',
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { role: 'admin' },
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/customer-layout/customer-layout.component').then(
        (m) => m.CustomerLayoutComponent,
      ),
    children: [
      {
        path: 'cars',
        loadChildren: () =>
          import('./features/customer/customer.routes').then(
            (m) => m.CUSTOMER_CARS_ROUTES,
          ),
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/customer/customer.routes').then(
            (m) => m.CUSTOMER_ORDERS_ROUTES,
          ),
      },
      {
        path: 'installments',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/customer/customer.routes').then(
            (m) => m.CUSTOMER_INSTALLMENTS_ROUTES,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'cars',
  },
];
