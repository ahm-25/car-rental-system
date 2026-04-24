import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../../../models/order.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { CustomerOrdersService } from './customer-orders.service';

@Component({
  selector: 'app-customer-order-details',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, NgClass, SpinnerComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6 max-w-4xl">
      <nav class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <a routerLink="/orders" class="hover:text-brand-700 dark:hover:text-brand-400 text-sm font-bold uppercase tracking-wider">{{ 'customer_orders.details.nav' | t }}</a>
        <span class="rtl:-scale-x-100">/</span>
        <span class="text-slate-900 dark:text-slate-100 font-black">#{{ order()?.id ?? id }}</span>
      </nav>

      @if (loading()) {
        <div class="card flex items-center justify-center py-16">
          <app-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="card flex flex-col items-center gap-3 py-12 text-center">
          <p class="font-medium text-slate-900 dark:text-slate-100">{{ error() }}</p>
          <div class="flex gap-2">
            <a routerLink="/orders" class="btn-secondary">{{ 'customer_orders.details.back' | t }}</a>
            <button type="button" class="btn-primary" (click)="load()">{{ 'common.retry' | t }}</button>
          </div>
        </div>
      } @else {
        @if (order(); as o) {
        <header class="card flex flex-wrap items-start justify-between gap-4 border-l-4 border-brand-600">
          <div>
            <h1 class="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{{ 'customer_orders.details.title' | t }} #{{ o.id }}</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              {{ 'orders.details.created' | t }} {{ o.created_at | date: 'medium' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider"
              [ngClass]="{
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300': o.payment_status === 'success',
                'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300': o.payment_status === 'pending'
              }"
            >
              {{ 'orders.statuses.' + o.payment_status | t }}
            </span>
            <span class="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {{ 'orders.statuses.' + o.order_type | t }}
            </span>
          </div>
        </header>

        <div class="grid gap-4 md:grid-cols-2">
          <article class="card">
            <h2 class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
              {{ 'customer_orders.details.info' | t }}
            </h2>
            <dl class="grid gap-4 text-sm">
              <div class="flex justify-between items-center group">
                <dt class="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_orders.details.delivery' | t }}</dt>
                <dd class="font-black text-slate-900 dark:text-slate-100">
                  {{ o.delivery_date | date: 'mediumDate' }}
                </dd>
              </div>
              <div class="flex justify-between items-center group">
                <dt class="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_orders.details.receiving' | t }}</dt>
                <dd class="font-black text-slate-900 dark:text-slate-100">
                  {{ o.receiving_date | date: 'mediumDate' }}
                </dd>
              </div>
              <div class="flex justify-between items-center group">
                <dt class="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_orders.details.days' | t }}</dt>
                <dd class="font-black text-slate-900 dark:text-slate-100">{{ o.days }}</dd>
              </div>
              <div class="flex justify-between items-center group">
                <dt class="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_orders.details.total' | t }}</dt>
                <dd class="font-black text-brand-600 text-lg">
                  $ {{ +o.total_price | number: '1.2-2' }}
                </dd>
              </div>
              <div class="flex justify-between items-center group">
                <dt class="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_orders.details.payment' | t }}</dt>
                <dd class="font-black text-slate-900 dark:text-slate-100">{{ 'orders.statuses.' + o.payment_type | t }}</dd>
              </div>
              <div class="flex justify-between items-center group">
                <dt class="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_orders.details.points' | t }}</dt>
                <dd class="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-black">+{{ o.points }}</dd>
              </div>
            </dl>
          </article>

          <article class="card">
            <h2 class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
              {{ 'customer_cars.details' | t }}
            </h2>
            @if (o.car; as c) {
              <dl class="space-y-4 text-sm">
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'cars.form.name_label' | t }}</dt>
                  <dd class="font-black text-slate-900 dark:text-slate-100">{{ c.name }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'cars.form.brand_label' | t }}</dt>
                  <dd class="font-black text-slate-900 dark:text-slate-100">{{ c.brand }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'cars.form.model_label' | t }}</dt>
                  <dd class="font-black text-slate-900 dark:text-slate-100">{{ c.model }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'cars.table.price_day' | t }}</dt>
                  <dd class="font-black text-slate-900 dark:text-slate-100">
                    $ {{ +c.price_per_day | number: '1.2-2' }}
                  </dd>
                </div>
              </dl>
              <a [routerLink]="['/cars', c.id]" class="btn-secondary w-full mt-6 text-xs">{{ 'customer_cars.details' | t }}</a>
            } @else {
              <p class="text-sm text-slate-500 dark:text-slate-400">Car #{{ o.car_id }}</p>
            }
          </article>
        </div>

        @if (o.installments && o.installments.length > 0) {
          <article class="card p-0 overflow-hidden">
            <div class="p-6 pb-4 flex items-center justify-between">
              <h2 class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {{ 'customer_orders.details.installments' | t }}
              </h2>
              <a routerLink="/installments" class="text-brand-600 dark:text-brand-400 text-[10px] font-black uppercase tracking-widest hover:text-brand-700 dark:hover:text-brand-300">
                {{ 'common.view' | t }} →
              </a>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                <thead class="bg-slate-50 dark:bg-slate-900/60 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <tr>
                    <th class="px-6 py-3">#</th>
                    <th class="px-6 py-3 text-right">{{ 'customer_orders.details.inst_amount' | t }}</th>
                    <th class="px-6 py-3">{{ 'customer_orders.details.inst_due' | t }}</th>
                    <th class="px-6 py-3">{{ 'customer_orders.details.inst_status' | t }}</th>
                    <th class="px-6 py-3">{{ 'customer_orders.details.inst_paid_at' | t }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
                  @for (inst of o.installments; track inst.id) {
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td class="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">#{{ inst.id }}</td>
                      <td class="px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100">
                        $ {{ +inst.amount | number: '1.2-2' }}
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                        {{ inst.due_date | date: 'mediumDate' }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300': inst.status === 'paid',
                            'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300': inst.status === 'pending'
                          }"
                        >
                          {{ 'customer_orders.details.inst_' + inst.status | t }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium italic">
                        {{ inst.paid_at ? (inst.paid_at | date: 'medium') : '—' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </article>
        }
        }
      }
    </section>
  `,
})
export class OrderDetailsComponent implements OnInit {
  private readonly service = inject(CustomerOrdersService);
  private readonly lang = inject(LanguageService);

  @Input() id?: string;

  protected readonly order = signal<Order | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) {
      this.error.set(this.lang.translate('customer_orders.details.not_found'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.service.getById(this.id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.order.set(null);
        if (err.status === 404) {
          this.error.set(this.lang.translate('customer_orders.details.not_found'));
        } else if (err.status === 403) {
          this.error.set(this.lang.translate('common.error_forbidden') || 'You do not have access to this order.');
        } else {
          this.error.set(
            (err.error as { message?: string } | null)?.message ??
              (this.lang.translate('customer_orders.details.error_default') ||
                'Failed to load order details.'),
          );
        }
      },
    });
  }
}
