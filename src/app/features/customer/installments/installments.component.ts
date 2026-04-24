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
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { CustomerInstallmentsService } from './customer-installments.service';

const PAGE_SIZES = [10, 15, 25] as const;

@Component({
  selector: 'app-customer-installments',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, NgClass, SpinnerComponent, PaginationComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6">
      <header class="flex items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{{ 'customer_orders.details.installments' | t }}</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {{ ('customer_orders.details.back' | t) || 'Upcoming and past installment payments. Paying deducts from your wallet.' }}
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
        @if (installments().length === 0 && !loading() && !error()) {
          <div class="card flex flex-col items-center gap-2 py-16 text-center">
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ 'customer_orders.details.not_found' | t }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ 'customer_orders.empty_subtitle' | t }}
            </p>
            <a routerLink="/orders" class="btn-secondary mt-2">{{ 'customer_orders.details.nav' | t }}</a>
          </div>
        } @else {
          <div class="card p-0 overflow-hidden shadow-2xl border-slate-100 dark:border-slate-800">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                <thead class="bg-slate-900 dark:bg-black/60 text-left text-[10px] font-black uppercase tracking-widest text-white/50">
                  <tr>
                    <th class="px-6 py-4">{{ 'customer_orders.table.id' | t }}</th>
                    <th class="px-6 py-4">{{ 'customer_orders.table.car' | t }}</th>
                    <th class="px-6 py-4 text-right">{{ 'customer_orders.details.inst_amount' | t }}</th>
                    <th class="px-6 py-4">{{ 'customer_orders.details.inst_due' | t }}</th>
                    <th class="px-6 py-4">{{ 'customer_orders.details.inst_status' | t }}</th>
                    <th class="px-6 py-4">{{ 'customer_orders.details.inst_paid_at' | t }}</th>
                    <th class="px-6 py-4 text-right">{{ 'customer_orders.table.actions' | t }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  @for (inst of installments(); track inst.id) {
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                      <td class="px-6 py-4">
                        <a
                          [routerLink]="['/orders', inst.order_id]"
                          class="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1 rounded font-black hover:bg-brand-600 hover:text-white transition-all text-xs"
                        >
                          #{{ inst.order_id }}
                        </a>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-slate-900 dark:text-slate-100 font-bold group-hover:text-brand-600 transition-colors">
                          {{ inst.order?.car?.name ?? '—' }}
                        </div>
                        <div class="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                          {{ inst.order?.car?.brand }}
                          {{ inst.order?.car?.model }}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100">
                        $ {{ +inst.amount | number: '1.2-2' }}
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                        {{ inst.due_date | date: 'mediumDate' }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                          [ngClass]="inst.status === 'paid'
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'"
                        >
                          {{ 'customer_orders.details.inst_' + inst.status | t }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-slate-500 dark:text-slate-500 font-medium italic">
                        {{ inst.paid_at ? (inst.paid_at | date: 'medium') : '—' }}
                      </td>
                      <td class="px-6 py-4 text-right">
                        @if (inst.status === 'pending') {
                          <button
                            type="button"
                            class="btn-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20"
                            [disabled]="payingId() === inst.id"
                            (click)="pay(inst)"
                          >
                            @if (payingId() === inst.id) {
                              <app-spinner size="sm" />
                              <span>{{ 'common.loading' | t }}</span>
                            } @else {
                              {{ 'customer_orders.details.pay_now' | t }}
                            }
                          </button>
                        } @else {
                          <span class="inline-flex items-center text-emerald-500">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
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
    
    const confirmMsg = this.lang.translate('customer_orders.details.pay_confirm', { 
      amount: inst.amount, 
      id: inst.id 
    }) || `Pay ${inst.amount} for installment #${inst.id}? This deducts from your wallet.`;

    if (!confirm(confirmMsg)) {
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
