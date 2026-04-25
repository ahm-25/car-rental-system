import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { Car } from '../../../models/car.model';
import {
  CreateOrderPayload,
  OrderType,
  PaymentType,
} from '../../../models/order.model';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import {
  dateAfterValidator,
  notInPastValidator,
} from '../../../shared/validators/date.validators';
import { CustomerCarsService } from '../cars/customer-cars.service';
import { CustomerOrdersService } from './customer-orders.service';

type ServerErrors = Record<string, string[]>;

interface PaymentOption {
  value: PaymentType;
  label: string;
  hint: string;
  icon: 'card' | 'cash' | 'lightning';
}

interface OrderTypeOption {
  value: OrderType;
  label: string;
  hint: string;
  icon: 'wallet' | 'calendar';
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { value: 'visa', label: 'Visa', hint: 'Credit or debit card', icon: 'card' },
  { value: 'cash', label: 'Cash', hint: 'Pay on delivery', icon: 'cash' },
  {
    value: 'tamara',
    label: 'Tamara',
    hint: 'Buy now, pay later',
    icon: 'lightning',
  },
];

const ORDER_TYPE_OPTIONS: OrderTypeOption[] = [
  {
    value: 'full',
    label: 'Pay in full',
    hint: 'Single charge now',
    icon: 'wallet',
  },
  {
    value: 'installments',
    label: 'Installments',
    hint: 'Split into monthly payments',
    icon: 'calendar',
  },
];

function todayISODate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function diffInDays(startIso: string, endIso: string): number {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diff = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, diff);
}

@Component({
  selector: 'app-book-car',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
    SpinnerComponent,
    FieldErrorComponent,
    TranslatePipe,
    NgClass,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <a routerLink="/cars" class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{{ 'nav.cars' | t }}</a>
      <span class="text-slate-300 dark:text-slate-600 rtl:-scale-x-100">/</span>
      <a
        [routerLink]="['/cars', id]"
        class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        {{ car()?.name ?? ('common.loading' | t) }}
      </a>
      <span class="text-slate-300 dark:text-slate-600 rtl:-scale-x-100">/</span>
      <span class="text-slate-900 dark:text-slate-100 font-medium">
        {{ 'customer_orders.booking.confirm' | t }}
      </span>
    </nav>

    @if (loadingCar()) {
      <div class="card flex items-center justify-center py-16">
        <app-spinner size="lg" />
      </div>
    } @else if (loadError()) {
      <div class="card empty-state">
        <div class="empty-state-icon">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p class="text-base font-medium text-slate-900 dark:text-slate-100">{{ loadError() }}</p>
        <div class="flex gap-2">
          <a routerLink="/cars" class="btn-secondary">{{ 'customer_orders.details.back' | t }}</a>
          <button type="button" class="btn-primary" (click)="loadCar()">{{ 'common.retry' | t }}</button>
        </div>
      </div>
    } @else {
      @if (car(); as c) {
        <div class="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <!-- Form column -->
          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            class="lg:col-span-2 flex flex-col gap-6"
            novalidate
          >
            <!-- Car preview banner -->
            <header
              class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 text-white p-5 sm:p-6"
            >
              <div class="absolute inset-y-0 end-0 w-1/2 bg-gradient-to-l from-brand-500/15 to-transparent pointer-events-none"></div>
              <div class="absolute -top-16 -end-16 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div class="relative flex items-center gap-4">
                <div class="h-14 w-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/10">
                  <svg class="h-7 w-7 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-300">
                    {{ 'customer_cars.details.header' | t }}
                  </p>
                  <h1 class="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                    {{ c.brand }} {{ c.name }}
                    <span class="font-normal text-white/50">· {{ c.model }}</span>
                  </h1>
                  <p class="text-sm text-white/70 mt-1">
                    $ {{ +c.price_per_day | number: '1.2-2' }} {{ 'customer_cars.per_day' | t }}
                  </p>
                </div>
              </div>
            </header>

            <!-- Dates section -->
            <section class="card">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {{ 'customer_orders.booking.delivery_date' | t }}
                </h2>
                @if (days() > 0) {
                  <span class="badge-brand">
                    {{ days() }}
                    {{ days() === 1 ? ('orders.table.day' | t) : ('orders.table.days' | t) }}
                  </span>
                }
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="form-row">
                  <label for="delivery_date" class="label">{{ 'customer_orders.booking.delivery_date' | t }}</label>
                  <input
                    id="delivery_date"
                    type="date"
                    class="input"
                    [class.input-error]="showError('delivery_date')"
                    [min]="todayISO"
                    formControlName="delivery_date"
                  />
                  <app-field-error
                    [control]="form.controls.delivery_date"
                    [serverErrors]="serverErrors()?.['delivery_date']"
                    [messages]="{
                      dateInPast: 'Delivery date cannot be in the past.'
                    }"
                  />
                </div>
                <div class="form-row">
                  <label for="receiving_date" class="label">{{ 'customer_orders.booking.receiving_date' | t }}</label>
                  <input
                    id="receiving_date"
                    type="date"
                    class="input"
                    [class.input-error]="showError('receiving_date')"
                    [min]="minReceivingIso()"
                    formControlName="receiving_date"
                  />
                  <app-field-error
                    [control]="form.controls.receiving_date"
                    [serverErrors]="serverErrors()?.['receiving_date']"
                    [messages]="{
                      dateOrder: 'Return date must be after the delivery date.'
                    }"
                  />
                </div>
              </div>

              <div
                class="mt-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-4 py-3.5 transition-all"
                [class.border-brand-200]="days() > 0"
                [class.dark:border-brand-500]="days() > 0"
                [class.bg-brand-50]="days() > 0"
                [class.dark:bg-brand-500]="days() > 0"
                [class.dark:bg-opacity-10]="days() > 0"
              >
                @if (days() > 0) {
                  <div class="flex items-center justify-between gap-4 text-sm">
                    <span class="text-slate-600 dark:text-slate-300">
                      {{ days() }}
                      {{ days() === 1 ? ('orders.table.day' | t) : ('orders.table.days' | t) }}
                      × $ {{ +c.price_per_day | number: '1.2-2' }}
                    </span>
                    <span class="font-semibold text-slate-900 dark:text-slate-100">
                      $ {{ estimatedTotal() | number: '1.2-2' }}
                    </span>
                  </div>
                } @else {
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    Choose dates above to see your estimated total.
                  </p>
                }
              </div>
            </section>

            <!-- Payment type -->
            <section class="card">
              <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-5">
                {{ 'customer_orders.booking.payment_type' | t }}
              </h2>
              <div class="grid gap-3 sm:grid-cols-3" role="radiogroup">
                @for (opt of paymentOptions; track opt.value) {
                  <label
                    class="relative flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all duration-150 ease-smooth hover:border-slate-300 dark:hover:border-slate-600"
                    [ngClass]="form.controls.payment_type.value === opt.value
                      ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10 dark:border-brand-400 ring-1 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'"
                  >
                    <input
                      type="radio"
                      class="sr-only"
                      formControlName="payment_type"
                      [value]="opt.value"
                    />
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex h-7 w-7 items-center justify-center rounded-lg"
                        [ngClass]="form.controls.payment_type.value === opt.value
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'"
                      >
                        @switch (opt.icon) {
                          @case ('card') {
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                            </svg>
                          }
                          @case ('cash') {
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                          }
                          @case ('lightning') {
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                          }
                        }
                      </span>
                      <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ opt.label }}</span>
                    </div>
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                      {{ opt.hint }}
                    </span>
                  </label>
                }
              </div>
            </section>

            <!-- Order type -->
            <section class="card">
              <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-5">
                {{ 'customer_orders.booking.order_type' | t }}
              </h2>
              <div class="grid gap-3 sm:grid-cols-2" role="radiogroup">
                @for (opt of orderTypeOptions; track opt.value) {
                  <label
                    class="relative flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all duration-150 ease-smooth hover:border-slate-300 dark:hover:border-slate-600"
                    [ngClass]="form.controls.order_type.value === opt.value
                      ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10 dark:border-brand-400 ring-1 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'"
                  >
                    <input
                      type="radio"
                      class="sr-only"
                      formControlName="order_type"
                      [value]="opt.value"
                    />
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex h-7 w-7 items-center justify-center rounded-lg"
                        [ngClass]="form.controls.order_type.value === opt.value
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'"
                      >
                        @switch (opt.icon) {
                          @case ('wallet') {
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                            </svg>
                          }
                          @case ('calendar') {
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                          }
                        }
                      </span>
                      <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ opt.label }}</span>
                    </div>
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                      {{ opt.hint }}
                    </span>
                  </label>
                }
              </div>

              @if (isInstallments()) {
                <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid gap-4 sm:grid-cols-2">
                  <div class="form-row">
                    <label for="down_payment" class="label">Down payment</label>
                    <div class="relative">
                      <span class="absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400 dark:text-slate-500">$</span>
                      <input
                        id="down_payment"
                        type="number"
                        min="0"
                        step="0.01"
                        class="input ps-7"
                        formControlName="down_payment"
                      />
                    </div>
                    <app-field-error
                      [control]="form.controls.down_payment"
                      [serverErrors]="serverErrors()?.['down_payment']"
                      [messages]="{
                        min: 'Must be greater than zero.',
                        max: 'Must be less than the total price.'
                      }"
                    />
                  </div>
                  <div class="form-row">
                    <label for="number_of_installments" class="label">
                      Installments count
                    </label>
                    <input
                      id="number_of_installments"
                      type="number"
                      min="2"
                      step="1"
                      class="input"
                      formControlName="number_of_installments"
                    />
                    <app-field-error
                      [control]="form.controls.number_of_installments"
                      [serverErrors]="serverErrors()?.['number_of_installments']"
                      [messages]="{ min: 'At least 2 installments.' }"
                    />
                  </div>

                  @if (perInstallmentPreview() > 0) {
                    <div
                      class="sm:col-span-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white p-5 flex items-center justify-between shadow-brand-glow"
                    >
                      <div>
                        <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200">
                          Monthly estimate
                        </p>
                        <p class="text-2xl font-bold mt-1">
                          $ {{ perInstallmentPreview() | number: '1.2-2' }}
                        </p>
                      </div>
                      <div class="text-end">
                        <p class="text-2xl font-bold">{{ form.controls.number_of_installments.value }}</p>
                        <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200">
                          Months
                        </p>
                      </div>
                    </div>
                  }
                </div>
              }
            </section>

            @if (submitError()) {
              <div
                class="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-200"
              >
                <svg class="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="flex-1 font-medium">{{ submitError() }}</p>
              </div>
            }

            <div class="flex items-center justify-between gap-4 pt-2">
              <a [routerLink]="['/cars', c.id]" class="btn-ghost">{{ 'common.cancel' | t }}</a>
              <button
                type="submit"
                class="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
                [disabled]="!canSubmit()"
              >
                @if (submitting()) {
                  <app-spinner size="sm" />
                  <span>{{ 'customer_orders.booking.booking' | t }}</span>
                } @else {
                  <span>{{ 'customer_orders.booking.confirm' | t }}</span>
                  <svg class="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                }
              </button>
            </div>
          </form>

          <!-- Summary sidebar -->
          <aside class="lg:col-span-1">
            <div class="sticky top-24 card">
              <h3 class="label-eyebrow">
                {{ 'customer_orders.details.info' | t }}
              </h3>
              <dl class="space-y-4 text-sm">
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500 dark:text-slate-400">{{ 'cars.form.name_label' | t }}</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100 text-end">{{ c.name }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500 dark:text-slate-400">{{ 'customer_cars.price_label' | t }}</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">
                    $ {{ +c.price_per_day | number: '1.2-2' }} {{ 'customer_cars.per_day' | t }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500 dark:text-slate-400">{{ 'customer_orders.booking.delivery_date' | t }}</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">
                    {{ form.controls.delivery_date.value ? (form.controls.delivery_date.value | date: 'mediumDate') : '—' }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500 dark:text-slate-400">{{ 'customer_orders.booking.receiving_date' | t }}</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">
                    {{ form.controls.receiving_date.value ? (form.controls.receiving_date.value | date: 'mediumDate') : '—' }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500 dark:text-slate-400">{{ 'customer_orders.details.days' | t }}</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">
                    {{ days() > 0 ? days() : '—' }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500 dark:text-slate-400">{{ 'customer_orders.booking.payment_type' | t }}</dt>
                  <dd>
                    <span class="badge-brand">
                      {{ 'orders.statuses.' + form.controls.payment_type.value | t }}
                    </span>
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500 dark:text-slate-400">{{ 'customer_orders.booking.order_type' | t }}</dt>
                  <dd>
                    <span class="badge-neutral">
                      {{ 'orders.statuses.' + form.controls.order_type.value | t }}
                    </span>
                  </dd>
                </div>
              </dl>

              <div class="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-end justify-between">
                  <span class="label-eyebrow mb-0">
                    {{ 'customer_orders.booking.total_price' | t }}
                  </span>
                  <span class="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    $ {{ estimatedTotal() | number: '1.2-2' }}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      }
    }
  `,
})
export class BookCarComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly carsService = inject(CustomerCarsService);
  private readonly ordersService = inject(CustomerOrdersService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lang = inject(LanguageService);

  @Input() id?: string;

  protected readonly paymentOptions = PAYMENT_OPTIONS;
  protected readonly orderTypeOptions = ORDER_TYPE_OPTIONS;
  protected readonly todayISO = todayISODate();

  protected readonly car = signal<Car | null>(null);
  protected readonly loadingCar = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly submitting = signal(false);
  protected readonly serverErrors = signal<ServerErrors | null>(null);
  protected readonly submitError = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      delivery_date: this.fb.control('', [
        Validators.required,
        notInPastValidator,
      ]),
      receiving_date: this.fb.control('', [Validators.required]),
      payment_type: this.fb.control<PaymentType>('visa', [Validators.required]),
      order_type: this.fb.control<OrderType>('full', [Validators.required]),
      down_payment: this.fb.control<number | null>(null),
      number_of_installments: this.fb.control<number | null>(null),
    },
    { validators: [dateAfterValidator('delivery_date', 'receiving_date')] },
  );

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly isInstallments = computed(
    () => this.formValue().order_type === 'installments',
  );

  protected readonly days = computed(() => {
    const v = this.formValue();
    return diffInDays(v.delivery_date ?? '', v.receiving_date ?? '');
  });

  protected readonly estimatedTotal = computed(() => {
    const c = this.car();
    const d = this.days();
    if (!c || d <= 0) return 0;
    return d * Number(c.price_per_day);
  });

  protected readonly perInstallmentPreview = computed(() => {
    if (!this.isInstallments()) return 0;
    const v = this.formValue();
    const total = this.estimatedTotal();
    const down = Number(v.down_payment) || 0;
    const count = Number(v.number_of_installments) || 0;
    if (total <= 0 || count < 1) return 0;
    const remaining = Math.max(0, total - down);
    return remaining / count;
  });

  protected readonly minReceivingIso = computed(() => {
    const delivery = this.formValue().delivery_date;
    if (!delivery) return this.todayISO;
    const d = new Date(delivery);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  protected readonly canSubmit = computed(() => {
    return (
      this.form.valid &&
      this.days() > 0 &&
      !this.submitting() &&
      !!this.car()
    );
  });

  ngOnInit(): void {
    this.loadCar();

    this.form.controls.order_type.valueChanges
      .pipe(
        startWith(this.form.controls.order_type.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((type) => this.applyInstallmentValidators(type));
  }

  protected showError(
    field:
      | 'delivery_date'
      | 'receiving_date'
      | 'down_payment'
      | 'number_of_installments',
  ): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  loadCar(): void {
    if (!this.id) {
      this.loadError.set(this.lang.translate('customer_cars.details.not_found'));
      return;
    }

    this.loadingCar.set(true);
    this.loadError.set(null);

    this.carsService.getById(this.id).subscribe({
      next: (car) => {
        this.car.set(car);
        this.loadingCar.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingCar.set(false);
        this.car.set(null);
        if (err.status === 404) {
          this.loadError.set(this.lang.translate('customer_cars.details.not_found'));
        } else {
          this.loadError.set(
            (err.error as { message?: string } | null)?.message ??
              this.lang.translate('customer_cars.error_default'),
          );
        }
      },
    });
  }

  submit(): void {
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }

    const car = this.car();
    if (!car) return;

    this.submitting.set(true);
    this.serverErrors.set(null);
    this.submitError.set(null);

    const v = this.form.getRawValue();
    const base = {
      car_id: car.id,
      delivery_date: v.delivery_date,
      receiving_date: v.receiving_date,
      payment_type: v.payment_type,
    };

    const payload: CreateOrderPayload =
      v.order_type === 'installments'
        ? {
            ...base,
            order_type: 'installments',
            down_payment: Number(v.down_payment),
            number_of_installments: Number(v.number_of_installments),
          }
        : { ...base, order_type: 'full' };

    this.ordersService.create(payload).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.notify.success(
          this.lang.translate('customer_orders.booking.success') ||
            'Booking successful!',
        );
        this.router.navigate(['/orders', order.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const body = err.error as
          | { message?: string; errors?: ServerErrors }
          | null;
        if (body?.errors) {
          this.serverErrors.set(body.errors);
        }
        if (body?.message && !body.errors) {
          this.submitError.set(body.message);
        } else if (!body?.errors) {
          this.submitError.set(
            this.lang.translate('customer_orders.booking.error') ||
              'Failed to create booking.',
          );
        }
      },
    });
  }

  private applyInstallmentValidators(type: OrderType): void {
    const dp = this.form.controls.down_payment;
    const ni = this.form.controls.number_of_installments;

    if (type === 'installments') {
      dp.setValidators([Validators.required, Validators.min(0.01)]);
      ni.setValidators([
        Validators.required,
        Validators.min(2),
        Validators.pattern(/^\d+$/),
      ]);
    } else {
      dp.clearValidators();
      ni.clearValidators();
    }

    dp.updateValueAndValidity({ emitEvent: false });
    ni.updateValueAndValidity({ emitEvent: false });
  }
}
