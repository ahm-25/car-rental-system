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
import { NotificationService } from '../../../core/services/notification.service';
import { Installment } from '../../../models/order.model';
import { PaginationMeta } from '../../../models/pagination.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { CustomerInstallmentsService } from './customer-installments.service';

const PAGE_SIZES = [10, 15, 25] as const;

@Component({
  selector: 'app-customer-installments',
  standalone: true,
  imports: [
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
          <h1 class="page-title">{{ 'customer_orders.details.installments' | t }}</h1>
          <p class="page-subtitle">Upcoming and past installment payments. Paying deducts from your wallet.</p>
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
        @if (installments().length === 0 && !loading() && !error()) {
          <div class="card empty-state">
            <div class="empty-state-icon">
              <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ 'customer_orders.details.not_found' | t }}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 max-w-md">{{ 'customer_orders.empty_subtitle' | t }}</p>
            <a routerLink="/orders" class="btn-secondary mt-1">{{ 'customer_orders.details.nav' | t }}</a>
          </div>
        } @else {
          <div class="table-wrap">
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="thead">
                  <tr>
                    <th class="th">{{ 'customer_orders.table.id' | t }}</th>
                    <th class="th">{{ 'customer_orders.table.car' | t }}</th>
                    <th class="th text-end">{{ 'customer_orders.details.inst_amount' | t }}</th>
                    <th class="th">{{ 'customer_orders.details.inst_due' | t }}</th>
                    <th class="th">{{ 'customer_orders.details.inst_status' | t }}</th>
                    <th class="th">{{ 'customer_orders.details.inst_paid_at' | t }}</th>
                    <th class="th text-end">{{ 'customer_orders.table.actions' | t }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  @for (inst of installments(); track inst.id) {
                    <tr class="tr-hover group">
                      <td class="td">
                        <a
                          [routerLink]="['/orders', inst.order_id]"
                          class="badge-neutral tabular-nums hover:ring-brand-300 dark:hover:ring-brand-500/40"
                        >
                          #{{ inst.order_id }}
                        </a>
                      </td>
                      <td class="td">
                        <div class="text-slate-900 dark:text-slate-100 font-semibold">
                          {{ inst.order?.car?.name ?? '—' }}
                        </div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">
                          {{ inst.order?.car?.brand }} · {{ inst.order?.car?.model }}
                        </div>
                      </td>
                      <td class="td text-end font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        $ {{ +inst.amount | number: '1.2-2' }}
                      </td>
                      <td class="td text-slate-600 dark:text-slate-300">
                        {{ inst.due_date | date: 'mediumDate' }}
                      </td>
                      <td class="td">
                        <span [ngClass]="inst.status === 'paid' ? 'badge-success' : 'badge-warning'">
                          {{ 'customer_orders.details.inst_' + inst.status | t }}
                        </span>
                      </td>
                      <td class="td text-slate-500 dark:text-slate-400">
                        {{ inst.paid_at ? (inst.paid_at | date: 'medium') : '—' }}
                      </td>
                      <td class="td text-end">
                        @if (inst.status === 'pending') {
                          <button
                            type="button"
                            class="btn-primary text-xs px-3 py-2"
                            [disabled]="payingId() === inst.id"
                            (click)="pay(inst)"
                          >
                            @if (payingId() === inst.id) {
                              <app-spinner size="sm" />
                              <span>{{ 'common.loading' | t }}</span>
                            } @else {
                              <span>{{ 'customer_orders.details.pay_now' | t }}</span>
                            }
                          </button>
                        } @else {
                          <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {{ 'customer_orders.details.inst_paid' | t }}
                          </span>
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

    @if (pendingPayment(); as pending) {
      <app-confirm-dialog
        [open]="true"
        [title]="'customer_orders.details.pay_now' | t"
        [body]="
          'customer_orders.details.pay_confirm'
            | t: { amount: pending.amount, id: pending.id }
        "
        [confirmLabel]="'customer_orders.details.pay_now' | t"
        [busyLabel]="'common.loading' | t"
        [busy]="payingId() === pending.id"
        tone="primary"
        (confirm)="confirmPay(pending)"
        (cancel)="cancelPay()"
      />
    }
  `,
})
export class InstallmentsComponent implements OnInit {
  private readonly service = inject(CustomerInstallmentsService);
  private readonly notify = inject(NotificationService);
  private readonly lang = inject(LanguageService);

  protected readonly page = signal(1);
  protected readonly perPage = signal<number>(PAGE_SIZES[1]);

  protected readonly installments = signal<Installment[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly payingId = signal<number | null>(null);
  protected readonly pendingPayment = signal<Installment | null>(null);

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
              this.lang.translate('customer_orders.load_error'),
          );
        },
      });
  }

  pay(inst: Installment): void {
    if (this.payingId() !== null) return;
    this.pendingPayment.set(inst);
  }

  cancelPay(): void {
    if (this.payingId() !== null) return;
    this.pendingPayment.set(null);
  }

  confirmPay(inst: Installment): void {
    if (this.payingId() !== null) return;

    this.payingId.set(inst.id);

    this.service.pay(inst.id).subscribe({
      next: (res) => {
        this.payingId.set(null);
        this.pendingPayment.set(null);
        this.notify.success(res.message);
        this.applyPaidInstallment(res.installment);
      },
      error: () => {
        this.payingId.set(null);
        this.pendingPayment.set(null);
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
