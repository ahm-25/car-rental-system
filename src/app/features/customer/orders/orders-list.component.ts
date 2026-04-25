import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../../../models/order.model';
import { PaginationMeta } from '../../../models/pagination.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { CustomerOrdersService } from './customer-orders.service';

const PAGE_SIZES = [10, 15, 25] as const;

@Component({
  selector: 'app-customer-orders-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, NgClass, SpinnerComponent, PaginationComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ 'customer_orders.title' | t }}</h1>
          <p class="page-subtitle">{{ 'customer_orders.subtitle' | t }}</p>
        </div>
        @if (meta(); as m) {
          <span class="hidden sm:inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg">
            <span class="font-semibold text-slate-900 dark:text-slate-100 me-1">{{ m.from ?? 0 }}–{{ m.to ?? 0 }}</span>
            {{ 'orders.of' | t }}
            <span class="font-semibold text-brand-600 dark:text-brand-400 ms-1">{{ m.total }}</span>
          </span>
        }
      </header>

      @if (error()) {
        <div
          class="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300"
        >
          <p class="flex-1 font-medium">{{ error() }}</p>
          <button type="button" class="btn-secondary" (click)="load()">{{ 'common.retry' | t }}</button>
        </div>
      }

      <div class="relative">
        @if (orders().length === 0 && !loading() && !error()) {
          <div class="card empty-state">
            <div class="empty-state-icon">
              <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h4M7 3h10a2 2 0 012 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 012-2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ 'customer_orders.empty_title' | t }}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 max-w-md">{{ 'customer_orders.empty_subtitle' | t }}</p>
            <a routerLink="/cars" class="btn-primary mt-1">{{ 'customer_orders.browse_cars' | t }}</a>
          </div>
        } @else {
          <div class="grid gap-3">
            @for (order of orders(); track order.id; let i = $index) {
              <a
                [routerLink]="['/orders', order.id]"
                class="card-interactive flex flex-col sm:flex-row sm:items-center gap-4 group animate-fade-in-up"
                [style.animation-delay.ms]="i * 30"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      #{{ order.id }}
                    </span>
                    <span [ngClass]="order.payment_status === 'success' ? 'badge-success' : 'badge-warning'">
                      {{ 'orders.statuses.' + order.payment_status | t }}
                    </span>
                    <span class="badge-neutral">
                      {{ 'orders.statuses.' + order.order_type | t }}
                    </span>
                  </div>
                  <p class="mt-2 text-base text-slate-900 dark:text-slate-100 font-semibold group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {{ order.car?.name ?? 'Car #' + order.car_id }}
                    <span class="text-slate-500 dark:text-slate-400 font-normal text-sm">
                      · {{ order.car?.brand }} {{ order.car?.model }}
                    </span>
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {{ order.delivery_date | date: 'mediumDate' }}
                    <span class="rtl:-scale-x-100 mx-1">→</span>
                    {{ order.receiving_date | date: 'mediumDate' }}
                    · {{ order.days }} {{ 'orders.table.days' | t }}
                  </p>
                </div>
                <div class="text-end shrink-0">
                  <div class="text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    $ {{ +order.total_price | number: '1.2-2' }}
                  </div>
                  <div class="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">
                    {{ 'orders.statuses.' + order.payment_type | t }}
                  </div>
                </div>
              </a>
            }
          </div>
        }

        @if (loading()) {
          <div class="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-sm rounded-2xl animate-fade-in">
            <app-spinner size="lg" />
          </div>
        }
      </div>

      <div class="flex justify-center">
        <app-pagination
          [page]="page()"
          [lastPage]="meta()?.last_page ?? 1"
          [total]="meta()?.total ?? null"
          [from]="meta()?.from ?? null"
          [to]="meta()?.to ?? null"
          [loading]="loading()"
          (pageChange)="goToPage($event)"
        />
      </div>
    </section>
  `,
})
export class OrdersListComponent implements OnInit {
  private readonly service = inject(CustomerOrdersService);
  private readonly lang = inject(LanguageService);

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

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service
      .list({ page: this.page(), perPage: this.perPage() })
      .subscribe({
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
              this.lang.translate('customer_orders.load_error'),
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
}
