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
import { NotificationService } from '../../../core/services/notification.service';
import { Installment } from '../../../models/order.model';
import { PaginationMeta } from '../../../models/pagination.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CustomerInstallmentsService } from './customer-installments.service';

const PAGE_SIZES = [10, 15, 25] as const;

@Component({
  selector: 'app-customer-installments',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, SpinnerComponent, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6">
      <header class="flex items-end justify-between gap-4">
        <div>
          <h1>Installments</h1>
          <p class="text-sm text-slate-500 mt-1">
            Upcoming and past installment payments. Paying deducts from your wallet.
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
        @if (installments().length === 0 && !loading() && !error()) {
          <div class="card flex flex-col items-center gap-2 py-16 text-center">
            <p class="text-sm font-medium text-slate-700">No installments</p>
            <p class="text-xs text-slate-500">
              You don't have any installment plans at the moment.
            </p>
            <a routerLink="/orders" class="btn-secondary mt-2">View orders</a>
          </div>
        } @else {
          <div class="card p-0 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Order</th>
                    <th class="px-4 py-3">Car</th>
                    <th class="px-4 py-3 text-right">Amount</th>
                    <th class="px-4 py-3">Due date</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Paid at</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  @for (inst of installments(); track inst.id) {
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="px-4 py-3">
                        <a
                          [routerLink]="['/orders', inst.order_id]"
                          class="text-brand-600 hover:text-brand-700 font-medium"
                        >
                          #{{ inst.order_id }}
                        </a>
                      </td>
                      <td class="px-4 py-3">
                        <div class="text-slate-900 font-medium">
                          {{ inst.order?.car?.name ?? '—' }}
                        </div>
                        <div class="text-xs text-slate-500">
                          {{ inst.order?.car?.brand }}
                          {{ inst.order?.car?.model }}
                        </div>
                      </td>
                      <td class="px-4 py-3 text-right font-medium text-slate-900">
                        {{ +inst.amount | number: '1.2-2' }}
                      </td>
                      <td class="px-4 py-3 text-slate-600">
                        {{ inst.due_date | date: 'mediumDate' }}
                      </td>
                      <td class="px-4 py-3">
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
                      <td class="px-4 py-3 text-slate-600">
                        {{ inst.paid_at ? (inst.paid_at | date: 'medium') : '—' }}
                      </td>
                      <td class="px-4 py-3 text-right">
                        @if (inst.status === 'pending') {
                          <button
                            type="button"
                            class="btn-primary px-3 py-1 text-xs"
                            [disabled]="payingId() === inst.id"
                            (click)="pay(inst)"
                          >
                            @if (payingId() === inst.id) {
                              <app-spinner size="sm" />
                              Paying…
                            } @else {
                              Pay now
                            }
                          </button>
                        } @else {
                          <span class="text-xs text-slate-400">—</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (loading()) {
          <div class="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl">
            <app-spinner size="lg" />
          </div>
        }
      </div>

      <div class="flex justify-center">
        <app-pagination
          [page]="page()"
          [lastPage]="meta()?.last_page ?? 1"
          [loading]="loading()"
          (pageChange)="goToPage($event)"
        />
      </div>
    </section>
  `,
})
export class InstallmentsComponent implements OnInit {
  private readonly service = inject(CustomerInstallmentsService);
  private readonly notify = inject(NotificationService);

  protected readonly page = signal(1);
  protected readonly perPage = signal<number>(PAGE_SIZES[1]);

  protected readonly installments = signal<Installment[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly payingId = signal<number | null>(null);

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
          this.installments.set(data);
          this.meta.set(meta);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.installments.set([]);
          this.meta.set(null);
          this.error.set(
            (err.error as { message?: string } | null)?.message ??
              'Failed to load installments.',
          );
        },
      });
  }

  pay(inst: Installment): void {
    if (this.payingId() !== null) return;
    if (!confirm(`Pay ${inst.amount} for installment #${inst.id}? This deducts from your wallet.`)) {
      return;
    }

    this.payingId.set(inst.id);

    this.service.pay(inst.id).subscribe({
      next: (res) => {
        this.payingId.set(null);
        this.notify.success(res.message);
        this.applyPaidInstallment(res.installment);
      },
      error: () => {
        this.payingId.set(null);
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

  private applyPaidInstallment(updated: Installment): void {
    this.installments.update((list) =>
      list.map((i) =>
        i.id === updated.id
          ? {
              ...i,
              status: updated.status,
              paid_at: updated.paid_at,
              updated_at: updated.updated_at,
            }
          : i,
      ),
    );
  }
}
