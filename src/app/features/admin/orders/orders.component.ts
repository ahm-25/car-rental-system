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
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
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
    ConfirmDialogComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ 'orders.title' | t }}</h1>
          <p class="page-subtitle">{{ 'orders.description' | t }}</p>
        </div>
        @if (meta(); as m) {
          <span class="hidden sm:inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg">
            {{ 'orders.showing' | t }}
            <span class="font-semibold text-slate-900 dark:text-slate-100 mx-1">{{ m.from ?? 0 }}–{{ m.to ?? 0 }}</span>
            {{ 'orders.of' | t }}
            <span class="font-semibold text-brand-600 dark:text-brand-400 ms-1">{{ m.total }}</span>
          </span>
        }
      </header>

      <!-- Filters -->
      <form
        [formGroup]="filters"
        class="card"
        (ngSubmit)="page.set(1); load()"
      >
        <div class="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div class="md:col-span-2 lg:col-span-2">
            <label for="search" class="label">{{ 'orders.filters.search' | t }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <svg class="h-4 w-4 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="search"
                class="input ps-9"
                [placeholder]="'orders.filters.search_placeholder' | t"
                formControlName="search"
                autocomplete="off"
              />
            </div>
          </div>

          <div>
            <label for="user_id" class="label">{{ 'orders.filters.user_id' | t }}</label>
            <input
              id="user_id"
              type="number"
              min="1"
              class="input"
              formControlName="user_id"
            />
          </div>

          <div>
            <label for="car_id" class="label">{{ 'orders.filters.car_id' | t }}</label>
            <input
              id="car_id"
              type="number"
              min="1"
              class="input"
              formControlName="car_id"
            />
          </div>

          <div>
            <label for="payment_type" class="label">{{ 'orders.filters.payment' | t }}</label>
            <select id="payment_type" class="input" formControlName="payment_type">
              <option value="">{{ 'orders.filters.all' | t }}</option>
              @for (t of paymentTypes; track t) {
                <option [value]="t">{{ 'orders.statuses.' + t | t }}</option>
              }
            </select>
          </div>

          <div>
            <label for="payment_status" class="label">{{ 'orders.filters.status' | t }}</label>
            <select id="payment_status" class="input" formControlName="payment_status">
              <option value="">{{ 'orders.filters.all' | t }}</option>
              @for (s of paymentStatuses; track s) {
                <option [value]="s">{{ 'orders.statuses.' + s | t }}</option>
              }
            </select>
          </div>
        </div>

        <div class="flex justify-end items-center gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            class="btn-ghost text-sm"
            [disabled]="!hasActiveFilters()"
            (click)="resetFilters()"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            {{ 'orders.filters.reset' | t }}
          </button>
          <button
            type="submit"
            class="btn-primary py-2 px-6"
            [disabled]="loading()"
          >
            @if (loading()) {
              <app-spinner size="sm" />
            } @else {
              <svg class="h-4 w-4 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            {{ 'common.search' | t }}
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
      <div class="table-wrap relative">
        <div class="relative overflow-x-auto min-h-[360px]">
          <table class="min-w-full text-sm">
            <thead class="thead">
              <tr>
                <th class="th">{{ 'orders.table.id' | t }}</th>
                <th class="th">{{ 'orders.table.customer' | t }}</th>
                <th class="th">{{ 'orders.table.car' | t }}</th>
                <th class="th">{{ 'orders.table.period' | t }}</th>
                <th class="th text-end">{{ 'orders.table.days' | t }}</th>
                <th class="th text-end">{{ 'orders.table.total' | t }}</th>
                <th class="th">{{ 'orders.table.payment' | t }}</th>
                <th class="th">{{ 'orders.table.status' | t }}</th>
                <th class="th">{{ 'orders.table.type' | t }}</th>
                <th class="th text-end">{{ 'orders.table.actions' | t }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              @for (order of orders(); track order.id) {
                <tr class="tr-hover group">
                  <td class="td font-semibold text-slate-900 dark:text-slate-100 tabular-nums">#{{ order.id }}</td>
                  <td class="td">
                    <div class="text-slate-900 dark:text-slate-100 font-semibold">
                      {{ order.user?.name ?? '—' }}
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">
                      {{ order.user?.email ?? 'user #' + order.user_id }}
                    </div>
                  </td>
                  <td class="td">
                    <div class="text-slate-900 dark:text-slate-100 font-semibold">
                      {{ order.car?.name ?? '—' }}
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">
                      {{ order.car?.brand }} · {{ order.car?.model }}
                    </div>
                  </td>
                  <td class="td text-slate-600 dark:text-slate-300">
                    {{ order.delivery_date | date: 'mediumDate' }}
                    <span class="mx-1 text-slate-400 dark:text-slate-500 rtl:-scale-x-100">→</span>
                    {{ order.receiving_date | date: 'mediumDate' }}
                  </td>
                  <td class="td text-end">
                    <span class="badge-neutral tabular-nums">{{ order.days }}</span>
                  </td>
                  <td class="td text-end">
                    <span class="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      $ {{ +order.total_price | number: '1.2-2' }}
                    </span>
                  </td>
                  <td class="td text-slate-600 dark:text-slate-300">{{ 'orders.statuses.' + order.payment_type | t }}</td>
                  <td class="td">
                    <span [ngClass]="order.payment_status === 'success' ? 'badge-success' : 'badge-warning'">
                      {{ 'orders.statuses.' + order.payment_status | t }}
                    </span>
                  </td>
                  <td class="td text-slate-600 dark:text-slate-300">{{ 'orders.statuses.' + order.order_type | t }}</td>
                  <td class="td">
                    <div class="flex items-center justify-end gap-1">
                      <a
                        [routerLink]="['/admin/orders', order.id]"
                        class="icon-btn-brand"
                        [title]="'common.view' | t"
                      >
                        <svg class="h-4 w-4 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                      <button
                        type="button"
                        class="icon-btn-danger"
                        [title]="'common.delete' | t"
                        (click)="askDelete(order)"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                @if (!loading() && !error()) {
                  <tr>
                    <td colspan="10" class="px-6 py-16">
                      <div class="empty-state">
                        <div class="empty-state-icon">
                          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ 'orders.empty_title' | t }}</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 max-w-md">{{ 'orders.empty_subtitle' | t }}</p>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          @if (loading()) {
            <div class="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-[2px] animate-fade-in">
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

    @if (orderToDelete(); as o) {
      <app-confirm-dialog
        [open]="true"
        [title]="'orders.delete_confirm.title' | t: { id: o.id }"
        [body]="'orders.delete_confirm.body' | t"
        [confirmLabel]="'orders.delete_confirm.delete' | t"
        [busyLabel]="'orders.delete_confirm.deleting' | t"
        [busy]="deleting()"
        tone="danger"
        (confirm)="confirmDelete(o)"
        (cancel)="cancelDelete()"
      />
    }
  `,
})
export class AdminOrdersComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminOrdersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lang = inject(LanguageService);
  private readonly notify = inject(NotificationService);

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

  protected readonly orderToDelete = signal<Order | null>(null);
  protected readonly deleting = signal(false);

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
    this.load();
  }

  load(): void {
    if (this.loading()) return;
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

  askDelete(order: Order): void {
    if (this.deleting()) return;
    this.orderToDelete.set(order);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.orderToDelete.set(null);
  }

  confirmDelete(order: Order): void {
    if (this.deleting()) return;

    this.deleting.set(true);
    this.service.delete(order.id).subscribe({
      next: (res) => {
        this.deleting.set(false);
        this.orderToDelete.set(null);
        this.notify.success(res.message);
        this.load();
      },
      error: () => {
        this.deleting.set(false);
        this.orderToDelete.set(null);
      },
    });
  }
}
