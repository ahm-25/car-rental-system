import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  Order,
  OrderType,
  PaymentStatus,
  PaymentType,
} from '../../../models/order.model';
import { PaginationMeta } from '../../../models/pagination.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { AdminOrdersQuery, AdminOrdersService } from './admin-orders.service';

const PAGE_SIZES = [10, 15, 25, 50] as const;

const PAYMENT_TYPES: readonly PaymentType[] = ['visa', 'cash', 'tamara'];
const PAYMENT_STATUSES: readonly PaymentStatus[] = ['success', 'pending'];
const ORDER_TYPES: readonly OrderType[] = ['full', 'installments'];

@Component({
  selector: 'app-admin-orders',
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
    <section class="flex flex-col gap-6">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Orders</h1>
          <p class="text-sm text-slate-500 mt-1">
            Review, update status, and remove customer orders.
          </p>
        </div>
        @if (meta(); as m) {
          <span class="text-sm text-slate-500">
            Showing
            <span class="font-medium text-slate-900">{{ m.from ?? 0 }}</span>
            –
            <span class="font-medium text-slate-900">{{ m.to ?? 0 }}</span>
            of
            <span class="font-medium text-slate-900">{{ m.total }}</span>
          </span>
        }
      </header>

      <!-- Filters -->
      <form
        [formGroup]="filters"
        class="card grid gap-4 md:grid-cols-3 lg:grid-cols-6"
        (submit)="$event.preventDefault()"
      >
        <div class="md:col-span-2 lg:col-span-2">
          <label for="search" class="label">Search</label>
          <input
            id="search"
            type="search"
            class="input"
            placeholder="Customer, car…"
            formControlName="search"
            autocomplete="off"
          />
        </div>

        <div>
          <label for="user_id" class="label">User ID</label>
          <input
            id="user_id"
            type="number"
            min="1"
            class="input"
            formControlName="user_id"
          />
        </div>

        <div>
          <label for="car_id" class="label">Car ID</label>
          <input
            id="car_id"
            type="number"
            min="1"
            class="input"
            formControlName="car_id"
          />
        </div>

        <div>
          <label for="payment_type" class="label">Payment</label>
          <select id="payment_type" class="input" formControlName="payment_type">
            <option value="">All</option>
            @for (t of paymentTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>

        <div>
          <label for="payment_status" class="label">Status</label>
          <select
            id="payment_status"
            class="input"
            formControlName="payment_status"
          >
            <option value="">All</option>
            @for (s of paymentStatuses; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </div>

        <div>
          <label for="order_type" class="label">Type</label>
          <select id="order_type" class="input" formControlName="order_type">
            <option value="">All</option>
            @for (t of orderTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>

        <div class="md:col-span-3 lg:col-span-6 flex justify-end">
          <button
            type="button"
            class="btn-ghost"
            [disabled]="!hasActiveFilters()"
            (click)="resetFilters()"
          >
            Reset filters
          </button>
        </div>
      </form>

      <!-- Error -->
      @if (error()) {
        <div
          class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p class="flex-1 font-medium">{{ error() }}</p>
          <button type="button" class="btn-secondary" (click)="load()">Retry</button>
        </div>
      }

      <!-- Table -->
      <div class="card p-0 overflow-hidden">
        <div class="relative overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-4 py-3">#</th>
                <th class="px-4 py-3">Customer</th>
                <th class="px-4 py-3">Car</th>
                <th class="px-4 py-3">Period</th>
                <th class="px-4 py-3 text-right">Days</th>
                <th class="px-4 py-3 text-right">Total</th>
                <th class="px-4 py-3">Payment</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Type</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (order of orders(); track order.id) {
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-slate-900">#{{ order.id }}</td>
                  <td class="px-4 py-3">
                    <div class="text-slate-900 font-medium">
                      {{ order.user?.name ?? '—' }}
                    </div>
                    <div class="text-xs text-slate-500">
                      {{ order.user?.email ?? 'user #' + order.user_id }}
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-slate-900 font-medium">
                      {{ order.car?.name ?? '—' }}
                    </div>
                    <div class="text-xs text-slate-500">
                      {{ order.car?.brand }} · {{ order.car?.model }}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {{ order.delivery_date | date: 'mediumDate' }}
                    →
                    {{ order.receiving_date | date: 'mediumDate' }}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-600">
                    {{ order.days }}
                  </td>
                  <td class="px-4 py-3 text-right font-medium text-slate-900">
                    {{ +order.total_price | number: '1.2-2' }}
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ order.payment_type }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                      [class.bg-emerald-100]="order.payment_status === 'success'"
                      [class.text-emerald-800]="order.payment_status === 'success'"
                      [class.bg-amber-100]="order.payment_status === 'pending'"
                      [class.text-amber-800]="order.payment_status === 'pending'"
                    >
                      {{ order.payment_status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ order.order_type }}</td>
                  <td class="px-4 py-3 text-right">
                    <a
                      [routerLink]="['/admin/orders', order.id]"
                      class="text-brand-600 hover:text-brand-700 font-medium"
                    >
                      View
                    </a>
                  </td>
                </tr>
              } @empty {
                @if (!loading() && !error()) {
                  <tr>
                    <td colspan="10" class="px-4 py-12">
                      <div class="flex flex-col items-center gap-2 text-center">
                        <p class="text-sm font-medium text-slate-700">No orders found</p>
                        <p class="text-xs text-slate-500">Try adjusting your filters.</p>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          @if (loading()) {
            <div class="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <app-spinner size="lg" />
            </div>
          }
        </div>

        <!-- Pagination -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div class="flex items-center gap-2 text-slate-600">
            <label for="perPage">Rows per page:</label>
            <select
              id="perPage"
              class="input w-20 py-1"
              [value]="perPage()"
              (change)="changePageSize(asSelect($event.target).value)"
            >
              @for (size of pageSizes; track size) {
                <option [value]="size">{{ size }}</option>
              }
            </select>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="page() === 1 || loading()"
              (click)="goToPage(1)"
            >
              «
            </button>
            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="page() === 1 || loading()"
              (click)="goToPage(page() - 1)"
            >
              Prev
            </button>
            <span class="px-3 text-slate-600">
              Page
              <span class="font-medium text-slate-900">{{ page() }}</span>
              of
              <span class="font-medium text-slate-900">{{ meta()?.last_page ?? 1 }}</span>
            </span>
            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="isLastPage() || loading()"
              (click)="goToPage(page() + 1)"
            >
              Next
            </button>
            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="isLastPage() || loading()"
              (click)="goToPage(meta()?.last_page ?? 1)"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminOrdersService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly paymentTypes = PAYMENT_TYPES;
  protected readonly paymentStatuses = PAYMENT_STATUSES;
  protected readonly orderTypes = ORDER_TYPES;

  protected readonly filters = this.fb.group({
    search: this.fb.control(''),
    user_id: this.fb.control<number | null>(null),
    car_id: this.fb.control<number | null>(null),
    payment_type: this.fb.control<PaymentType | ''>(''),
    payment_status: this.fb.control<PaymentStatus | ''>(''),
    order_type: this.fb.control<OrderType | ''>(''),
  });

  protected readonly page = signal(1);
  protected readonly perPage = signal<number>(PAGE_SIZES[1]);

  protected readonly orders = signal<Order[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly isLastPage = computed(() => {
    const m = this.meta();
    return !m || this.page() >= m.last_page;
  });

  protected readonly hasActiveFilters = computed(() => {
    const v = this.filters.getRawValue();
    return (
      !!v.search ||
      v.user_id !== null ||
      v.car_id !== null ||
      !!v.payment_type ||
      !!v.payment_status ||
      !!v.order_type
    );
  });

  ngOnInit(): void {
    this.filters.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(
          (a, b) => JSON.stringify(a) === JSON.stringify(b),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const v = this.filters.getRawValue();
    const query: AdminOrdersQuery = {
      page: this.page(),
      perPage: this.perPage(),
      search: v.search || undefined,
      user_id: v.user_id ?? undefined,
      car_id: v.car_id ?? undefined,
      payment_type: v.payment_type || undefined,
      payment_status: v.payment_status || undefined,
      order_type: v.order_type || undefined,
    };

    this.service.list(query).subscribe({
      next: (res) => {
        const { data, links, ...meta } = res;
        this.orders.set(data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.orders.set([]);
        this.meta.set(null);
        this.error.set(
          (err.error as { message?: string } | null)?.message ??
            'Failed to load orders. Please try again.',
        );
      },
    });
  }

  goToPage(page: number): void {
    const last = this.meta()?.last_page ?? 1;
    const next = Math.min(Math.max(1, page), last);
    if (next === this.page()) return;
    this.page.set(next);
    this.load();
  }

  changePageSize(value: string | number): void {
    const next = Number(value);
    if (!next || next === this.perPage()) return;
    this.perPage.set(next);
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.filters.reset({
      search: '',
      user_id: null,
      car_id: null,
      payment_type: '',
      payment_status: '',
      order_type: '',
    });
  }

  /** Typed cast for DOM event targets in templates (avoids `$any`). */
  asSelect(target: EventTarget | null): HTMLSelectElement {
    return target as HTMLSelectElement;
  }
}
