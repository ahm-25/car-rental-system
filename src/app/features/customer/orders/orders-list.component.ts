import { DatePipe, DecimalPipe } from '@angular/common';
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
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CustomerOrdersService } from './customer-orders.service';

const PAGE_SIZES = [10, 15, 25] as const;

@Component({
  selector: 'app-customer-orders-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6">
      <header class="flex items-end justify-between gap-4">
        <div>
          <h1>My orders</h1>
          <p class="text-sm text-slate-500 mt-1">
            Track your rentals and payment status.
          </p>
        </div>
        @if (meta(); as m) {
          <span class="text-sm text-slate-500">
            {{ m.from ?? 0 }}–{{ m.to ?? 0 }} of {{ m.total }}
          </span>
        }
      </header>

      @if (error()) {
        <div
          class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p class="flex-1 font-medium">{{ error() }}</p>
          <button type="button" class="btn-secondary" (click)="load()">Retry</button>
        </div>
      }

      <div class="relative">
        @if (orders().length === 0 && !loading() && !error()) {
          <div class="card flex flex-col items-center gap-2 py-16 text-center">
            <svg class="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h4M7 3h10a2 2 0 012 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 012-2z" />
            </svg>
            <p class="text-sm font-medium text-slate-700">No orders yet</p>
            <p class="text-xs text-slate-500">Start by browsing our fleet.</p>
            <a routerLink="/cars" class="btn-primary mt-2">Browse cars</a>
          </div>
        } @else {
          <div class="grid gap-3">
            @for (order of orders(); track order.id) {
              <a
                [routerLink]="['/orders', order.id]"
                class="card flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-elevated transition-shadow"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-slate-900">
                      #{{ order.id }}
                    </span>
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                      [class.bg-emerald-100]="order.payment_status === 'success'"
                      [class.text-emerald-800]="order.payment_status === 'success'"
                      [class.bg-amber-100]="order.payment_status === 'pending'"
                      [class.text-amber-800]="order.payment_status === 'pending'"
                    >
                      {{ order.payment_status }}
                    </span>
                    <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {{ order.order_type }}
                    </span>
                  </div>
                  <p class="mt-1 text-slate-900 font-medium">
                    {{ order.car?.name ?? 'Car #' + order.car_id }}
                    <span class="text-slate-500 font-normal">
                      · {{ order.car?.brand }} {{ order.car?.model }}
                    </span>
                  </p>
                  <p class="text-xs text-slate-500">
                    {{ order.delivery_date | date: 'mediumDate' }}
                    →
                    {{ order.receiving_date | date: 'mediumDate' }}
                    · {{ order.days }} days
                  </p>
                </div>
                <div class="text-right">
                  <div class="text-lg font-semibold text-slate-900">
                    {{ +order.total_price | number: '1.2-2' }}
                  </div>
                  <div class="text-xs text-slate-500">
                    Paid via {{ order.payment_type }}
                  </div>
                </div>
              </a>
            }
          </div>
        }

        @if (loading()) {
          <div class="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl">
            <app-spinner size="lg" />
          </div>
        }
      </div>

      @if (meta(); as m) {
        @if (m.last_page > 1) {
          <div class="flex items-center justify-center gap-1">
            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="page() === 1 || loading()"
              (click)="goToPage(page() - 1)"
            >
              Prev
            </button>
            <span class="px-3 text-slate-600 text-sm">
              Page {{ page() }} of {{ m.last_page }}
            </span>
            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="isLastPage() || loading()"
              (click)="goToPage(page() + 1)"
            >
              Next
            </button>
          </div>
        }
      }
    </section>
  `,
})
export class OrdersListComponent implements OnInit {
  private readonly service = inject(CustomerOrdersService);

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
              'Failed to load your orders.',
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
