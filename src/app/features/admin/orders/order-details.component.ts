import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import {
  Order,
  PaymentStatus,
} from '../../../models/order.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { AdminOrdersService } from './admin-orders.service';

const STATUSES: readonly PaymentStatus[] = ['success', 'pending'];

@Component({
  selector: 'app-admin-order-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
    SpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6 max-w-5xl">
      <nav class="flex items-center gap-2 text-sm text-slate-500">
        <a routerLink="/admin/orders" class="hover:text-brand-700">Orders</a>
        <span>/</span>
        <span class="text-slate-900 font-medium">
          #{{ order()?.id ?? id }}
        </span>
      </nav>

      @if (loading()) {
        <div class="card flex items-center justify-center py-16">
          <app-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="card flex flex-col items-center gap-3 py-12 text-center">
          <p class="font-medium text-slate-900">{{ error() }}</p>
          <div class="flex gap-2">
            <a routerLink="/admin/orders" class="btn-secondary">Back to orders</a>
            <button type="button" class="btn-primary" (click)="load()">Retry</button>
          </div>
        </div>
      } @else if (order(); as o) {
        <header class="card flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-slate-900">
              Order #{{ o.id }}
            </h1>
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
            <button
              type="button"
              class="btn inline-flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
              [disabled]="deleting()"
              (click)="deleteOrder(o)"
            >
              @if (deleting()) {
                <app-spinner size="sm" />
                Deleting…
              } @else {
                Delete
              }
            </button>
          </div>
        </header>

        <div class="grid gap-4 md:grid-cols-3">
          <article class="card md:col-span-2">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Order
            </h2>
            <dl class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt class="text-slate-500">Delivery</dt>
                <dd class="font-medium text-slate-900">
                  {{ o.delivery_date | date: 'mediumDate' }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Receiving</dt>
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
                <dt class="text-slate-500">Points</dt>
                <dd class="font-medium text-slate-900">{{ o.points }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Payment</dt>
                <dd class="font-medium text-slate-900">{{ o.payment_type }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Type</dt>
                <dd class="font-medium text-slate-900">{{ o.order_type }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Updated</dt>
                <dd class="font-medium text-slate-900">
                  {{ o.updated_at | date: 'medium' }}
                </dd>
              </div>
            </dl>
          </article>

          <!-- Status update -->
          <article class="card">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Update status
            </h2>
            <form
              [formGroup]="statusForm"
              (ngSubmit)="submitStatus()"
              class="flex flex-col gap-3"
            >
              <div>
                <label for="payment_status" class="label">Payment status</label>
                <select
                  id="payment_status"
                  class="input"
                  formControlName="payment_status"
                >
                  @for (s of statuses; track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
              </div>
              <button
                type="submit"
                class="btn-primary inline-flex items-center justify-center gap-2"
                [disabled]="!canSaveStatus() || updating()"
              >
                @if (updating()) {
                  <app-spinner size="sm" />
                  Saving…
                } @else {
                  Save
                }
              </button>
            </form>
          </article>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <article class="card">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Customer
            </h2>
            @if (o.user; as u) {
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Name</dt>
                  <dd class="font-medium text-slate-900">{{ u.name }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Email</dt>
                  <dd class="font-medium text-slate-900 break-all text-right">{{ u.email }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Phone</dt>
                  <dd class="font-medium text-slate-900">{{ u.phone }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Country</dt>
                  <dd class="font-medium text-slate-900">{{ u.country }}</dd>
                </div>
                <div class="pt-2">
                  <a
                    [routerLink]="['/admin/users', u.id]"
                    class="text-brand-600 hover:text-brand-700 text-sm font-medium"
                  >
                    View customer →
                  </a>
                </div>
              </dl>
            } @else {
              <p class="text-sm text-slate-500">User #{{ o.user_id }}</p>
            }
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
                <div class="pt-2">
                  <a
                    [routerLink]="['/admin/cars', c.id]"
                    class="text-brand-600 hover:text-brand-700 text-sm font-medium"
                  >
                    View car →
                  </a>
                </div>
              </dl>
            } @else {
              <p class="text-sm text-slate-500">Car #{{ o.car_id }}</p>
            }
          </article>
        </div>

        @if (o.installments && o.installments.length > 0) {
          <article class="card p-0 overflow-hidden">
            <div class="p-6 pb-4">
              <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Installments
              </h2>
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
    </section>
  `,
})
export class AdminOrderDetailsComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminOrdersService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  @Input() id?: string;

  protected readonly statuses = STATUSES;

  protected readonly order = signal<Order | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly updating = signal(false);
  protected readonly deleting = signal(false);

  protected readonly statusForm = this.fb.group({
    payment_status: this.fb.control<PaymentStatus>('pending'),
  });

  protected readonly canSaveStatus = computed(() => {
    const current = this.order()?.payment_status;
    return current !== this.statusForm.controls.payment_status.value;
  });

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
        this.statusForm.patchValue({ payment_status: order.payment_status });
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.order.set(null);
        this.error.set(
          err.status === 404
            ? 'This order no longer exists.'
            : (err.error as { message?: string } | null)?.message ??
                'Failed to load order details.',
        );
      },
    });
  }

  submitStatus(): void {
    if (!this.id || this.updating() || !this.canSaveStatus()) return;

    this.updating.set(true);
    const status = this.statusForm.controls.payment_status.value;

    this.service.update(this.id, { payment_status: status }).subscribe({
      next: (order) => {
        this.order.set(order);
        this.updating.set(false);
        this.notify.success(`Order #${order.id} status set to "${order.payment_status}".`);
      },
      error: () => {
        this.updating.set(false);
      },
    });
  }

  deleteOrder(order: Order): void {
    if (this.deleting()) return;
    if (!confirm(`Delete order #${order.id}? This cannot be undone.`)) return;

    this.deleting.set(true);
    this.service.delete(order.id).subscribe({
      next: (res) => {
        this.deleting.set(false);
        this.notify.success(res.message);
        this.router.navigate(['/admin/orders']);
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }
}
