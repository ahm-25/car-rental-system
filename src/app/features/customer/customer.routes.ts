import { Routes } from '@angular/router';

export const CUSTOMER_CARS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./cars/cars-list.component').then((m) => m.CarsListComponent),
    title: 'Cars',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./cars/car-details.component').then((m) => m.CarDetailsComponent),
    title: 'Car details',
  },
  {
    path: ':id/book',
    loadComponent: () =>
      import('./orders/book-car.component').then((m) => m.BookCarComponent),
    title: 'Book car',
  },
];

export const CUSTOMER_ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./orders/orders-list.component').then(
        (m) => m.OrdersListComponent,
      ),
    title: 'My orders',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./orders/order-details.component').then(
        (m) => m.OrderDetailsComponent,
      ),
    title: 'Order details',
  },
];

export const CUSTOMER_INSTALLMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./installments/installments.component').then(
        (m) => m.InstallmentsComponent,
      ),
    title: 'Installments',
  },
];
