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
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
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
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-8">
      <header class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Orders</h1>
          <p class="text-base text-slate-500 font-medium mt-1">
            Review, update status, and remove customer orders.
          </p>
        </div>
        <div class="flex items-center gap-4">
          @if (meta(); as m) {
            <span class="hidden sm:inline text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              Showing
              <span class="font-bold text-slate-900">{{ m.from ?? 0 }}</span>
              –
              <span class="font-bold text-slate-900">{{ m.to ?? 0 }}</span>
              of <span class="font-bold text-brand-600">{{ m.total }}</span>
            </span>
          }
        </div>
      </header>

      <!-- Filters -->
      <form
        [formGroup]="filters"
        class="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 grid gap-6 md:grid-cols-3 lg:grid-cols-6"
        (submit)="$event.preventDefault()"
      >
        <div class="md:col-span-2 lg:col-span-2">
          <label for="search" class="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 px-1">Search</label>
          <div class="relative">
            <div class="absolute inset-y-0 start-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <svg class="h-5 w-5 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search"
              type="search"
              class="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl ps-11 pe-5 py-3.5 text-slate-900 font-medium placeholder:text-slate-400 transition-all text-sm"
              placeholder="Customer, car…"
              formControlName="search"
              autocomplete="off"
            />
          </div>
        </div>

        <div>
          <label for="user_id" class="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 px-1">User ID</label>
          <input
            id="user_id"
            type="number"
            min="1"
            class="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-5 py-3.5 text-slate-900 font-medium placeholder:text-slate-400 transition-all text-sm"
            formControlName="user_id"
          />
        </div>

        <div>
          <label for="car_id" class="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 px-1">Car ID</label>
          <input
            id="car_id"
            type="number"
            min="1"
            class="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-5 py-3.5 text-slate-900 font-medium placeholder:text-slate-400 transition-all text-sm"
            formControlName="car_id"
          />
        </div>

        <div>
          <label for="payment_type" class="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 px-1">Payment</label>
          <select id="payment_type" class="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-5 py-3.5 text-slate-900 font-medium transition-all text-sm appearance-none" formControlName="payment_type">
            <option value="">All</option>
            @for (t of paymentTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>

        <div>
          <label for="payment_status" class="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 px-1">Status</label>
          <select id="payment_status" class="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-5 py-3.5 text-slate-900 font-medium transition-all text-sm appearance-none" formControlName="payment_status">
            <option value="">All</option>
            @for (s of paymentStatuses; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </div>

        <div class="md:col-span-3 lg:col-span-6 flex justify-end mt-2 pt-6 border-t border-slate-100">
          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            [disabled]="!hasActiveFilters()"
            (click)="resetFilters()"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
      <div class="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
        <div class="relative overflow-x-auto min-h-[400px]">
          <table class="min-w-full text-sm text-start">
            <thead class="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-6 py-5 whitespace-nowrap">#</th>
                <th class="px-6 py-5 whitespace-nowrap">Customer</th>
                <th class="px-6 py-5 whitespace-nowrap">Car</th>
                <th class="px-6 py-5 whitespace-nowrap">Period</th>
                <th class="px-6 py-5 text-right whitespace-nowrap">Days</th>
                <th class="px-6 py-5 text-right whitespace-nowrap">Total</th>
                <th class="px-6 py-5 whitespace-nowrap">Payment</th>
                <th class="px-6 py-5 whitespace-nowrap">Status</th>
                <th class="px-6 py-5 whitespace-nowrap">Type</th>
                <th class="px-6 py-5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (order of orders(); track order.id) {
                <tr class="hover:bg-slate-50/80 transition-colors group">
                  <td class="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">#{{ order.id }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-slate-900 font-bold">
                      {{ order.user?.name ?? '—' }}
                    </div>
                    <div class="text-xs text-slate-500 font-medium">
                      {{ order.user?.email ?? 'user #' + order.user_id }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-slate-900 font-bold">
                      {{ order.car?.name ?? '—' }}
                    </div>
                    <div class="text-xs text-slate-500 font-medium">
                      {{ order.car?.brand }} · {{ order.car?.model }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                    {{ order.delivery_date | date: 'mediumDate' }}
                    <span class="mx-1 text-slate-400">→</span>
                    {{ order.receiving_date | date: 'mediumDate' }}
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <span class="inline-flex items-center rounded-lg px-2 py-1 bg-slate-100 text-slate-700 font-bold text-xs">
                      {{ order.days }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <div class="font-bold text-slate-900 text-base">
                      $ {{ +order.total_price | number: '1.2-2' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">{{ order.payment_type }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold transition-colors"
                      [class.bg-emerald-50]="order.payment_status === 'success'"
                      [class.text-emerald-700]="order.payment_status === 'success'"
                      [class.bg-amber-50]="order.payment_status === 'pending'"
                      [class.text-amber-700]="order.payment_status === 'pending'"
                    >
                      {{ order.payment_status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">{{ order.order_type }}</td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end">
                      <a
                        [routerLink]="['/admin/orders', order.id]"
                        class="p-2 text-brand-500 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all"
                        title="View"
                      >
                        <svg class="h-5 w-5 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    </div>
                  </td>
                </tr>
              } @empty {
                @if (!loading() && !error()) {
                  <tr>
                    <td colspan="10" class="px-6 py-20">
                      <div class="flex flex-col items-center justify-center text-center">
                        <div class="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center mb-5">
                          <svg class="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p class="text-xl font-bold text-slate-900 mb-2">No orders found</p>
                        <p class="text-sm font-medium text-slate-500 max-w-sm">Try adjusting your filters.</p>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          @if (loading()) {
            <div class="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <app-spinner size="lg" />
            </div>
          }
        </div>

        <app-pagination
          class="border-t border-slate-200 bg-slate-50/50 block"
          [page]="page()"
          [lastPage]="meta()?.last_page ?? 1"
          [perPage]="perPage()"
          [pageSizes]="pageSizes"
          [loading]="loading()"
          [showFirstLast]="true"
          [bordered]="false"
          (pageChange)="goToPage($event)"
          (perPageChange)="changePageSize($event)"
        />
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

  changePageSize(next: number): void {
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
}
