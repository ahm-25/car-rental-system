import { DatePipe, DecimalPipe, NgClass, UpperCasePipe } from '@angular/common';
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

const PAYMENT_OPTIONS: { value: PaymentType; label: string; hint: string }[] = [
  { value: 'visa', label: 'Visa', hint: 'Credit or debit card' },
  { value: 'cash', label: 'Cash', hint: 'Pay on delivery' },
  { value: 'tamara', label: 'Tamara', hint: 'Buy now, pay later' },
];

const ORDER_TYPE_OPTIONS: { value: OrderType; label: string; hint: string }[] = [
  { value: 'full', label: 'Pay in full', hint: 'Single charge now' },
  { value: 'installments', label: 'Installments', hint: 'Split into monthly payments' },
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
    UpperCasePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="mb-6 flex items-center gap-2 text-sm text-slate-500">
      <a routerLink="/cars" class="hover:text-brand-600 transition">{{ 'nav.cars' | t }}</a>
      <span class="rtl:-scale-x-100">/</span>
      <a
        [routerLink]="['/cars', id]"
        class="hover:text-brand-600 transition font-medium"
      >
        {{ car()?.name ?? ('common.loading' | t) }}
      </a>
      <span class="rtl:-scale-x-100">/</span>
      <span class="text-slate-900 dark:text-slate-100 font-black">Book</span>
    </nav>

    @if (loadingCar()) {
      <div class="card flex items-center justify-center py-16">
        <app-spinner size="lg" />
      </div>
    } @else if (loadError()) {
      <div class="card flex flex-col items-center gap-3 py-12 text-center">
        <p class="font-medium text-slate-900 dark:text-slate-100">{{ loadError() }}</p>
        <div class="flex gap-2">
          <a routerLink="/cars" class="btn-secondary">{{ 'customer_orders.details.back' | t }}</a>
          <button type="button" class="btn-primary" (click)="loadCar()">{{ 'common.retry' | t }}</button>
        </div>
      </div>
    } @else {
      @if (car(); as c) {
      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Form -->
        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="lg:col-span-2 flex flex-col gap-6"
          novalidate
        >
          <!-- Car preview -->
          <header class="card flex items-center gap-4 bg-slate-900 text-white border-none shadow-2xl overflow-hidden relative">
            <div class="absolute inset-0 bg-gradient-to-r from-brand-600/20 to-transparent pointer-events-none"></div>
            <div class="h-16 w-16 min-h-[4rem] min-w-[4rem] rounded-2xl bg-white/10 flex items-center justify-center relative z-10">
              <svg class="h-8 w-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2" />
              </svg>
            </div>
            <div class="flex-1 min-w-0 relative z-10">
              <p class="text-[10px] uppercase font-black tracking-widest text-brand-400">
                {{ 'customer_orders.booking.title' | t: { name: '' } }}
              </p>
              <h1 class="text-xl font-black truncate">
                {{ c.brand }} {{ c.name }} <span class="text-white/40 font-bold ml-1">{{ c.model }}</span>
              </h1>
              <p class="text-xs text-white/60 font-medium">
                $ {{ +c.price_per_day | number: '1.2-2' }} {{ 'customer_cars.per_day' | t }}
              </p>
            </div>
          </header>

          <!-- Dates -->
          <section class="card">
            <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
              {{ 'customer_orders.booking.delivery_date' | t | uppercase }} & {{ 'customer_orders.booking.receiving_date' | t | uppercase }}
            </h2>
            <div class="grid gap-6 sm:grid-cols-2">
              <div>
                <label for="delivery_date" class="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{{ 'customer_orders.booking.delivery_date' | t }}</label>
                <input
                  id="delivery_date"
                  type="date"
                  class="input bg-slate-50 border-slate-100 font-bold"
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
              <div>
                <label for="receiving_date" class="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{{ 'customer_orders.booking.receiving_date' | t }}</label>
                <input
                  id="receiving_date"
                  type="date"
                  class="input bg-slate-50 border-slate-100 font-bold"
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

            <!-- Live summary -->
            <div
              class="mt-6 rounded-2xl border-2 p-5 transition-all"
              [ngClass]="days() > 0
                ? 'border-brand-500/20 bg-brand-50/50'
                : 'border-slate-100 bg-slate-50/50'"
            >
              @if (days() > 0) {
                <div class="flex items-center justify-between gap-4">
                  <span class="text-slate-600 font-bold">
                    {{ days() }} {{ days() === 1 ? ('orders.table.day' | t) : ('orders.table.days' | t) }} &times;
                    $ {{ +c.price_per_day | number: '1.2-2' }}
                  </span>
                  <span class="text-xl font-black text-slate-950">
                    $ {{ estimatedTotal() | number: '1.2-2' }}
                  </span>
                </div>
              } @else {
                <p class="text-slate-400 text-sm font-medium italic">
                  Choose dates to see estimates...
                </p>
              }
            </div>
          </section>

          <!-- Payment type -->
          <section class="card">
            <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
              {{ 'customer_orders.booking.payment_type' | t | uppercase }}
            </h2>
            <div
              class="grid gap-4 sm:grid-cols-3"
              role="radiogroup"
            >
              @for (opt of paymentOptions; track opt.value) {
                <label
                  class="relative flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-4 transition-all"
                  [ngClass]="form.controls.payment_type.value === opt.value
                    ? 'border-brand-600 bg-brand-50/50'
                    : 'border-slate-100 hover:border-slate-200'"
                >
                  <input
                    type="radio"
                    class="sr-only"
                    formControlName="payment_type"
                    [value]="opt.value"
                  />
                  <span class="font-black text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest">
                    {{ 'orders.statuses.' + opt.value | t }}
                  </span>
                  <span class="text-lg font-black text-slate-900 dark:text-slate-100 mt-1 capitalize">{{ opt.label }}</span>
                </label>
              }
            </div>
          </section>

          <!-- Order type -->
          <section class="card">
            <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
              {{ 'customer_orders.booking.order_type' | t | uppercase }}
            </h2>
            <div
              class="grid gap-4 sm:grid-cols-2"
              role="radiogroup"
            >
              @for (opt of orderTypeOptions; track opt.value) {
                <label
                  class="relative flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-4 transition-all"
                  [ngClass]="form.controls.order_type.value === opt.value
                    ? 'border-brand-600 bg-brand-50/50'
                    : 'border-slate-100 hover:border-slate-200'"
                >
                  <input
                    type="radio"
                    class="sr-only"
                    formControlName="order_type"
                    [value]="opt.value"
                  />
                  <span class="font-black text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest">
                    {{ 'orders.statuses.' + opt.value | t }}
                  </span>
                  <span class="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{{ opt.label }}</span>
                </label>
              }
            </div>

            <!-- Installment details -->
            @if (isInstallments()) {
              <div class="mt-8 pt-8 border-t border-slate-100 grid gap-6 sm:grid-cols-2">
                <div>
                  <label for="down_payment" class="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Down payment</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      id="down_payment"
                      type="number"
                      min="0"
                      step="0.01"
                      class="input pl-8 bg-slate-50 border-brand-100 focus:ring-brand-500/20 font-black"
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
                <div>
                  <label for="number_of_installments" class="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                    Installments count
                  </label>
                  <input
                    id="number_of_installments"
                    type="number"
                    min="2"
                    step="1"
                    class="input bg-slate-50 border-brand-100 focus:ring-brand-500/20 font-black"
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
                    class="sm:col-span-2 rounded-2xl bg-brand-600 text-white p-5 flex items-center justify-between shadow-xl shadow-brand-500/30"
                  >
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-brand-200">Monthly Payment Estimate</p>
                      <p class="text-2xl font-black mt-1">$ {{ perInstallmentPreview() | number: '1.2-2' }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-black">{{ form.controls.number_of_installments.value }}</p>
                      <p class="text-[10px] font-black uppercase tracking-widest text-brand-200">Months</p>
                    </div>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Submit error -->
          @if (submitError()) {
            <div
              class="flex items-start gap-3 rounded-2xl border-2 border-red-100 bg-red-50 p-4 text-sm text-red-800"
            >
              <svg class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="flex-1 font-bold">{{ submitError() }}</p>
            </div>
          }

          <!-- Submit -->
          <div class="flex items-center justify-between gap-4 mt-4">
            <a [routerLink]="['/cars', c.id]" class="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600 transition-colors">{{ 'common.cancel' | t }}</a>
            <button
              type="submit"
              class="btn-primary flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-black group"
              [disabled]="!canSubmit()"
            >
              @if (submitting()) {
                <app-spinner size="sm" />
                <span>{{ 'customer_orders.booking.booking' | t }}</span>
              } @else {
                <span>{{ 'customer_orders.booking.confirm' | t }}</span>
                @if (estimatedTotal() > 0) {
                  <span class="opacity-30">|</span>
                  <span>$ {{ estimatedTotal() | number: '1.2-2' }}</span>
                }
                <svg class="h-5 w-5 group-hover:translate-x-1 transition-transform rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              }
            </button>
          </div>
        </form>

        <!-- Summary sidebar -->
        <aside class="lg:col-span-1">
          <div
            class="sticky top-24 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8"
          >
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
              {{ 'customer_orders.details.info' | t | uppercase }}
            </h3>
            <dl class="space-y-6 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">{{ 'cars.form.name_label' | t }}</dt>
                <dd class="font-black text-slate-950 dark:text-slate-100 text-right">{{ c.name }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_cars.price_label' | t }}</dt>
                <dd class="font-black text-slate-950 dark:text-slate-100">
                  $ {{ +c.price_per_day | number: '1.2-2' }} {{ 'customer_cars.per_day' | t }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_orders.booking.delivery_date' | t }}</dt>
                <dd class="font-black text-slate-950 dark:text-slate-100">
                  {{
                    form.controls.delivery_date.value
                      ? (form.controls.delivery_date.value | date: 'mediumDate')
                      : '—'
                  }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_orders.booking.receiving_date' | t }}</dt>
                <dd class="font-black text-slate-950 dark:text-slate-100">
                  {{
                    form.controls.receiving_date.value
                      ? (form.controls.receiving_date.value | date: 'mediumDate')
                      : '—'
                  }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_orders.details.days' | t }}</dt>
                <dd class="font-black text-slate-950 dark:text-slate-100">
                  {{ days() > 0 ? days() : '—' }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_orders.booking.payment_type' | t }}</dt>
                <dd class="font-black text-brand-600 uppercase tracking-widest text-[10px]">
                  {{ 'orders.statuses.' + form.controls.payment_type.value | t }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">{{ 'customer_orders.booking.order_type' | t }}</dt>
                <dd class="font-black text-brand-600 uppercase tracking-widest text-[10px]">
                   {{ 'orders.statuses.' + form.controls.order_type.value | t }}
                </dd>
              </div>
            </dl>

            <div class="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ 'customer_orders.booking.total_price' | t }}</span>
                <span class="text-3xl font-black text-slate-950 dark:text-slate-100">
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
        this.notify.success(this.lang.translate('customer_orders.booking.success') || 'Booking successful!');
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
        } else {
          this.submitError.set(this.lang.translate('customer_orders.booking.error') || 'Failed to create booking.');
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
