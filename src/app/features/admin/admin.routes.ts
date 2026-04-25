import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'users',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/users.component').then((m) => m.UsersComponent),
    title: 'Admin · Users',
  },
  {
    path: 'users/new',
    loadComponent: () =>
      import('./users/user-form.component').then(
        (m) => m.AdminUserFormComponent,
      ),
    title: 'Admin · New user',
  },
  {
    path: 'users/:id',
    loadComponent: () =>
      import('./users/user-details.component').then(
        (m) => m.UserDetailsComponent,
      ),
    title: 'Admin · User details',
  },
  {
    path: 'users/:id/edit',
    loadComponent: () =>
      import('./users/user-form.component').then(
        (m) => m.AdminUserFormComponent,
      ),
    title: 'Admin · Edit user',
  },
  {
    path: 'cars',
    loadComponent: () =>
      import('./cars/cars.component').then((m) => m.AdminCarsComponent),
    title: 'Admin · Cars',
  },
  {
    path: 'cars/new',
    loadComponent: () =>
      import('./cars/car-form.component').then((m) => m.AdminCarFormComponent),
    title: 'Admin · New car',
  },
  {
    path: 'cars/:id',
    loadComponent: () =>
      import('./cars/car-details.component').then(
        (m) => m.AdminCarDetailsComponent,
      ),
    title: 'Admin · Car details',
  },
  {
    path: 'cars/:id/edit',
    loadComponent: () =>
      import('./cars/car-form.component').then((m) => m.AdminCarFormComponent),
    title: 'Admin · Edit car',
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./orders/orders.component').then((m) => m.AdminOrdersComponent),
    title: 'Admin · Orders',
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./orders/order-details.component').then(
        (m) => m.AdminOrderDetailsComponent,
      ),
    title: 'Admin · Order details',
  },
];
