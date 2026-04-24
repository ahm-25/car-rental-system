import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
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
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
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
    NgClass,
    SpinnerComponent,
    PaginationComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-8">
      <header class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{{ 'orders.title' | t }}</h1>
          <p class="text-base text-slate-500 dark:text-slate-400 font-medium mt-1">
            {{ 'orders.description' | t }}
          </p>
        </div>
        <div class="flex items-center gap-4">
          @if (meta(); as m) {
            <span class="hidden sm:inline text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              {{ 'orders.showing' | t }}
              <span class="font-bold text-slate-900 dark:text-slate-100">{{ m.from ?? 0 }}</span>
              –
              <span class="font-bold text-slate-900 dark:text-slate-100">{{ m.to ?? 0 }}</span>
              {{ 'orders.of' | t }} <span class="font-bold text-brand-600 dark:text-brand-400">{{ m.total }}</span>
            </span>
          }
        </div>
      </header>

      <!-- Filters -->
      <form
        [formGroup]="filters"
        class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 grid gap-6 md:grid-cols-3 lg:grid-cols-6"
        (submit)="$event.preventDefault()"
      >
        <div class="md:col-span-2 lg:col-span-2">
          <label for="search" class="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 px-1">{{ 'orders.filters.search' | t }}</label>
          <div class="relative">
            <div class="absolute inset-y-0 start-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <svg class="h-5 w-5 rtl:-scale-x-100 ms-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search"
              type="search"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl ps-11 pe-5 py-3.5 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-sm"
              [placeholder]="'orders.filters.search_placeholder' | t"
              formControlName="search"
              autocomplete="off"
            />
          </div>
        </div>

        <div>
          <label for="user_id" class="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 px-1">{{ 'orders.filters.user_id' | t }}</label>
          <input
            id="user_id"
            type="number"
            min="1"
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-sm"
            formControlName="user_id"
          />
        </div>

        <div>
          <label for="car_id" class="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 px-1">{{ 'orders.filters.car_id' | t }}</label>
          <input
            id="car_id"
            type="number"
            min="1"
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-sm"
            formControlName="car_id"
          />
        </div>

        <div>
          <label for="payment_type" class="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 px-1">{{ 'orders.filters.payment' | t }}</label>
          <select id="payment_type" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-slate-100 font-medium transition-all text-sm appearance-none" formControlName="payment_type">
            <option value="">{{ 'orders.filters.all' | t }}</option>
            @for (t of paymentTypes; track t) {
              <option [value]="t">{{ 'orders.statuses.' + t | t }}</option>
            }
          </select>
        </div>

        <div>
          <label for="payment_status" class="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 px-1">{{ 'orders.filters.status' | t }}</label>
          <select id="payment_status" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-slate-100 font-medium transition-all text-sm appearance-none" formControlName="payment_status">
            <option value="">{{ 'orders.filters.all' | t }}</option>
            @for (s of paymentStatuses; track s) {
              <option [value]="s">{{ 'orders.statuses.' + s | t }}</option>
            }
          </select>
        </div>

        <div class="md:col-span-3 lg:col-span-6 flex justify-end mt-2 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 px-5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            [disabled]="!hasActiveFilters()"
            (click)="resetFilters()"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            {{ 'orders.filters.reset' | t }}
          </button>
        </div>
      </form>

      <!-- Error -->
      @if (error()) {
        <div
          class="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300"
        >
          <p class="flex-1 font-medium">{{ error() }}</p>
          <button type="button" class="btn-secondary" (click)="load()">{{ 'common.retry' | t }}</button>
        </div>
      }

      <!-- Table -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none relative">
        <div class="relative overflow-x-auto min-h-[400px]">
          <table class="min-w-full text-sm text-start">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th class="px-6 py-5 whitespace-nowrap">{{ 'orders.table.id' | t }}</th>
                <th class="px-6 py-5 whitespace-nowrap">{{ 'orders.table.customer' | t }}</th>
                <th class="px-6 py-5 whitespace-nowrap">{{ 'orders.table.car' | t }}</th>
                <th class="px-6 py-5 whitespace-nowrap">{{ 'orders.table.period' | t }}</th>
                <th class="px-6 py-5 text-right whitespace-nowrap">{{ 'orders.table.days' | t }}</th>
                <th class="px-6 py-5 text-right whitespace-nowrap">{{ 'orders.table.total' | t }}</th>
                <th class="px-6 py-5 whitespace-nowrap">{{ 'orders.table.payment' | t }}</th>
                <th class="px-6 py-5 whitespace-nowrap">{{ 'orders.table.status' | t }}</th>
                <th class="px-6 py-5 whitespace-nowrap">{{ 'orders.table.type' | t }}</th>
                <th class="px-6 py-5 text-right whitespace-nowrap">{{ 'orders.table.actions' | t }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              @for (order of orders(); track order.id) {
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group">
                  <td class="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">#{{ order.id }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-slate-900 dark:text-slate-100 font-bold">
                      {{ order.user?.name ?? '—' }}
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {{ order.user?.email ?? 'user #' + order.user_id }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-slate-900 dark:text-slate-100 font-bold">
                      {{ order.car?.name ?? '—' }}
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {{ order.car?.brand }} · {{ order.car?.model }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                    {{ order.delivery_date | date: 'mediumDate' }}
                    <span class="mx-1 text-slate-400 dark:text-slate-500 rtl:-scale-x-100">→</span>
                    {{ order.receiving_date | date: 'mediumDate' }}
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <span class="inline-flex items-center rounded-lg px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                      {{ order.days }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <div class="font-bold text-slate-900 dark:text-slate-100 text-base">
                      $ {{ +order.total_price | number: '1.2-2' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">{{ 'orders.statuses.' + order.payment_type | t }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold transition-colors"
                      [ngClass]="order.payment_status === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'"
                    >
                      {{ 'orders.statuses.' + order.payment_status | t }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">{{ 'orders.statuses.' + order.order_type | t }}</td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end">
                      <a
                        [routerLink]="['/admin/orders', order.id]"
                        class="p-2 text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-all"
                        [title]="'common.view' | t"
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
                        <div class="w-20 h-20 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] flex items-center justify-center mb-5">
                          <svg class="h-10 w-10 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{{ 'orders.empty_title' | t }}</p>
                        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm">{{ 'orders.empty_subtitle' | t }}</p>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          @if (loading()) {
            <div class="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]">
              <app-spinner size="lg" />
            </div>
          }
        </div>

        <app-pagination
          class="block"
          [page]="page()"
          [lastPage]="meta()?.last_page ?? 1"
          [total]="meta()?.total ?? null"
          [from]="meta()?.from ?? null"
          [to]="meta()?.to ?? null"
          [perPage]="perPage()"
          [pageSizes]="pageSizes"
          [loading]="loading()"
          [showFirstLast]="true"
          [bordered]="true"
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
  private readonly lang = inject(LanguageService);

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
            this.lang.translate('orders.error_default'),
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
