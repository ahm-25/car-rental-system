import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../../../models/order.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CustomerOrdersService } from './customer-orders.service';

@Component({
  selector: 'app-customer-order-details',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6 max-w-4xl">
      <nav class="flex items-center gap-2 text-sm text-slate-500">
        <a routerLink="/orders" class="hover:text-brand-700">My orders</a>
        <span>/</span>
        <span class="text-slate-900 font-medium">#{{ order()?.id ?? id }}</span>
      </nav>

      @if (loading()) {
        <div class="card flex items-center justify-center py-16">
          <app-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="card flex flex-col items-center gap-3 py-12 text-center">
          <p class="font-medium text-slate-900">{{ error() }}</p>
          <div class="flex gap-2">
            <a routerLink="/orders" class="btn-secondary">Back to orders</a>
            <button type="button" class="btn-primary" (click)="load()">Retry</button>
          </div>
        </div>
      } @else {
        @if (order(); as o) {
        <header class="card flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-slate-900">Order #{{ o.id }}</h1>
            <p class="text-sm text-slate-500 mt-1">
              Created {{ o.created_at | date: 'medium' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              [class.bg-emerald-100]="o.payment_status === 'success'"
              [class.text-emerald-800]="o.payment_status === 'success'"
              [class.bg-amber-100]="o.payment_status === 'pending'"
              [class.text-amber-800]="o.payment_status === 'pending'"
            >
              {{ o.payment_status }}
            </span>
            <span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {{ o.order_type }}
            </span>
          </div>
        </header>

        <div class="grid gap-4 md:grid-cols-2">
          <article class="card">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Rental
            </h2>
            <dl class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt class="text-slate-500">Delivery</dt>
                <dd class="font-medium text-slate-900">
                  {{ o.delivery_date | date: 'mediumDate' }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Return</dt>
                <dd class="font-medium text-slate-900">
                  {{ o.receiving_date | date: 'mediumDate' }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Days</dt>
                <dd class="font-medium text-slate-900">{{ o.days }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Total</dt>
                <dd class="font-medium text-slate-900">
                  {{ +o.total_price | number: '1.2-2' }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Payment method</dt>
                <dd class="font-medium text-slate-900">{{ o.payment_type }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Points earned</dt>
                <dd class="font-medium text-slate-900">{{ o.points }}</dd>
              </div>
            </dl>
          </article>

          <article class="card">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Car
            </h2>
            @if (o.car; as c) {
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Name</dt>
                  <dd class="font-medium text-slate-900">{{ c.name }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Brand</dt>
                  <dd class="font-medium text-slate-900">{{ c.brand }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Model</dt>
                  <dd class="font-medium text-slate-900">{{ c.model }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Price / day</dt>
                  <dd class="font-medium text-slate-900">
                    {{ +c.price_per_day | number: '1.2-2' }}
                  </dd>
                </div>
              </dl>
            } @else {
              <p class="text-sm text-slate-500">Car #{{ o.car_id }}</p>
            }
          </article>
        </div>

        @if (o.installments && o.installments.length > 0) {
          <article class="card p-0 overflow-hidden">
            <div class="p-6 pb-4 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Installments
              </h2>
              <a routerLink="/installments" class="text-brand-600 text-sm font-medium hover:text-brand-700">
                Manage payments →
              </a>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th class="px-4 py-2">#</th>
                    <th class="px-4 py-2 text-right">Amount</th>
                    <th class="px-4 py-2">Due date</th>
                    <th class="px-4 py-2">Status</th>
                    <th class="px-4 py-2">Paid at</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  @for (inst of o.installments; track inst.id) {
                    <tr>
                      <td class="px-4 py-2 text-slate-700">#{{ inst.id }}</td>
                      <td class="px-4 py-2 text-right font-medium text-slate-900">
                        {{ +inst.amount | number: '1.2-2' }}
                      </td>
                      <td class="px-4 py-2 text-slate-600">
                        {{ inst.due_date | date: 'mediumDate' }}
                      </td>
                      <td class="px-4 py-2">
                        <span
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                          [class.bg-emerald-100]="inst.status === 'paid'"
                          [class.text-emerald-800]="inst.status === 'paid'"
                          [class.bg-amber-100]="inst.status === 'pending'"
                          [class.text-amber-800]="inst.status === 'pending'"
                        >
                          {{ inst.status }}
                        </span>
                      </td>
                      <td class="px-4 py-2 text-slate-600">
                        {{ inst.paid_at ? (inst.paid_at | date: 'medium') : '—' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </article>
        }
        }
      }
    </section>
  `,
})
export class OrderDetailsComponent implements OnInit {
  private readonly service = inject(CustomerOrdersService);

  @Input() id?: string;

  protected readonly order = signal<Order | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) {
      this.error.set('Invalid order id.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.service.getById(this.id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.order.set(null);
        if (err.status === 404) {
          this.error.set('This order could not be found.');
        } else if (err.status === 403) {
          this.error.set('You do not have access to this order.');
        } else {
          this.error.set(
            (err.error as { message?: string } | null)?.message ??
              'Failed to load order details.',
          );
        }
      },
    });
  }
}
