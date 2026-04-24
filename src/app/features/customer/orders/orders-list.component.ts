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
    <section class="flex flex-col gap-6">
      <header class="flex items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{{ 'customer_orders.title' | t }}</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {{ 'customer_orders.subtitle' | t }}
          </p>
        </div>
        @if (meta(); as m) {
          <span class="text-sm text-slate-500 dark:text-slate-400">
            {{ m.from ?? 0 }}–{{ m.to ?? 0 }} {{ 'orders.of' | t }} {{ m.total }}
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
          <div class="card flex flex-col items-center gap-2 py-16 text-center">
            <svg class="h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h4M7 3h10a2 2 0 012 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 012-2z" />
            </svg>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ 'customer_orders.empty_title' | t }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ 'customer_orders.empty_subtitle' | t }}</p>
            <a routerLink="/cars" class="btn-primary mt-2">{{ 'customer_orders.browse_cars' | t }}</a>
          </div>
        } @else {
          <div class="grid gap-3">
            @for (order of orders(); track order.id) {
              <a
                [routerLink]="['/orders', order.id]"
                class="card flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-elevated dark:hover:border-slate-700 transition-all group"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900 dark:text-slate-100">
                      #{{ order.id }}
                    </span>
                    <span
                      class="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                      [ngClass]="order.payment_status === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'"
                    >
                      {{ 'orders.statuses.' + order.payment_status | t }}
                    </span>
                    <span class="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {{ 'orders.statuses.' + order.order_type | t }}
                    </span>
                  </div>
                  <p class="mt-2 text-lg text-slate-900 dark:text-slate-100 font-black group-hover:text-brand-600 transition-colors">
                    {{ order.car?.name ?? 'Car #' + order.car_id }}
                    <span class="text-slate-500 dark:text-slate-400 font-medium text-sm">
                      · {{ order.car?.brand }} {{ order.car?.model }}
                    </span>
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {{ order.delivery_date | date: 'mediumDate' }}
                    <span class="rtl:-scale-x-100 mx-1">→</span>
                    {{ order.receiving_date | date: 'mediumDate' }}
                    · {{ order.days }} {{ 'orders.table.days' | t }}
                  </p>
                </div>
                <div class="text-right">
                  <div class="text-xl font-black text-slate-900 dark:text-slate-100">
                    $ {{ +order.total_price | number: '1.2-2' }}
                  </div>
                  <div class="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">
                    {{ 'orders.table.payment' | t }}: {{ 'orders.statuses.' + order.payment_type | t }}
                  </div>
                </div>
              </a>
            }
          </div>
        }

        @if (loading()) {
          <div class="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-sm rounded-2xl">
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
