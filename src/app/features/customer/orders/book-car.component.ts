import { DatePipe, DecimalPipe } from '@angular/common';
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="mb-6 flex items-center gap-2 text-sm text-slate-500">
      <a routerLink="/cars" class="hover:text-brand-600 transition">Cars</a>
      <span>/</span>
      <a
        [routerLink]="['/cars', id]"
        class="hover:text-brand-600 transition"
      >
        {{ car()?.name ?? 'Car' }}
      </a>
      <span>/</span>
      <span class="text-slate-900 font-medium">Book</span>
    </nav>

    @if (loadingCar()) {
      <div class="card flex items-center justify-center py-16">
        <app-spinner size="lg" />
      </div>
    } @else if (loadError()) {
      <div class="card flex flex-col items-center gap-3 py-12 text-center">
        <p class="font-medium text-slate-900">{{ loadError() }}</p>
        <div class="flex gap-2">
          <a routerLink="/cars" class="btn-secondary">Back to cars</a>
          <button type="button" class="btn-primary" (click)="loadCar()">Retry</button>
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
          <div class="card flex items-center gap-4">
            <div class="h-16 w-16 flex-shrink-0 rounded-xl bg-gradient-to-br from-brand-500 to-brand-900 flex items-center justify-center">
              <svg class="h-8 w-8 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs uppercase tracking-wider text-slate-400">
                Booking
              </p>
              <p class="text-lg font-semibold text-slate-900 truncate">
                {{ c.name }} · {{ c.brand }} {{ c.model }}
              </p>
              <p class="text-sm text-slate-500">
                {{ +c.price_per_day | number: '1.2-2' }} / day
              </p>
            </div>
          </div>

          <!-- Dates -->
          <section class="card">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Rental dates
            </h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="delivery_date" class="label">Delivery date</label>
                <input
                  id="delivery_date"
                  type="date"
                  class="input"
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
                <label for="receiving_date" class="label">Receiving date</label>
                <input
                  id="receiving_date"
                  type="date"
                  class="input"
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
              class="mt-4 rounded-xl border p-4 text-sm"
              [class.border-slate-200]="days() > 0"
              [class.bg-slate-50]="days() > 0"
              [class.border-amber-200]="days() === 0"
              [class.bg-amber-50]="days() === 0"
            >
              @if (days() > 0) {
                <div class="flex items-center justify-between gap-4">
                  <span class="text-slate-600">
                    {{ days() }} {{ days() === 1 ? 'day' : 'days' }} ×
                    {{ +c.price_per_day | number: '1.2-2' }}
                  </span>
                  <span class="font-semibold text-slate-900">
                    {{ estimatedTotal() | number: '1.2-2' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  Final amount confirmed on submission.
                </p>
              } @else {
                <p class="text-amber-800">
                  Pick both dates to see the total.
                </p>
              }
            </div>
          </section>

          <!-- Payment type -->
          <section class="card">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Payment method
            </h2>
            <div
              class="grid gap-3 sm:grid-cols-3"
              role="radiogroup"
              aria-label="Payment method"
            >
              @for (opt of paymentOptions; track opt.value) {
                <label
                  class="relative flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all"
                  [class.border-brand-600]="form.controls.payment_type.value === opt.value"
                  [class.bg-brand-50]="form.controls.payment_type.value === opt.value"
                  [class.ring-2]="form.controls.payment_type.value === opt.value"
                  [class.ring-brand-500]="form.controls.payment_type.value === opt.value"
                  [class.border-slate-200]="form.controls.payment_type.value !== opt.value"
                  [class.hover:bg-slate-50]="form.controls.payment_type.value !== opt.value"
                >
                  <input
                    type="radio"
                    class="sr-only"
                    formControlName="payment_type"
                    [value]="opt.value"
                  />
                  <span class="font-semibold text-slate-900 capitalize">
                    {{ opt.label }}
                  </span>
                  <span class="text-xs text-slate-500">{{ opt.hint }}</span>
                </label>
              }
            </div>
          </section>

          <!-- Order type -->
          <section class="card">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              How to pay
            </h2>
            <div
              class="grid gap-3 sm:grid-cols-2"
              role="radiogroup"
              aria-label="Order type"
            >
              @for (opt of orderTypeOptions; track opt.value) {
                <label
                  class="relative flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all"
                  [class.border-brand-600]="form.controls.order_type.value === opt.value"
                  [class.bg-brand-50]="form.controls.order_type.value === opt.value"
                  [class.ring-2]="form.controls.order_type.value === opt.value"
                  [class.ring-brand-500]="form.controls.order_type.value === opt.value"
                  [class.border-slate-200]="form.controls.order_type.value !== opt.value"
                  [class.hover:bg-slate-50]="form.controls.order_type.value !== opt.value"
                >
                  <input
                    type="radio"
                    class="sr-only"
                    formControlName="order_type"
                    [value]="opt.value"
                  />
                  <span class="font-semibold text-slate-900">{{ opt.label }}</span>
                  <span class="text-xs text-slate-500">{{ opt.hint }}</span>
                </label>
              }
            </div>

            <!-- Installment details -->
            @if (isInstallments()) {
              <div class="mt-6 border-t border-slate-100 pt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="down_payment" class="label">Down payment</label>
                  <input
                    id="down_payment"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input"
                    formControlName="down_payment"
                  />
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
                  <label for="number_of_installments" class="label">
                    Number of installments
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
                    class="sm:col-span-2 rounded-xl bg-brand-50 border border-brand-100 p-4 text-sm"
                  >
                    <p class="text-brand-900 font-medium">
                      {{ form.controls.number_of_installments.value }}
                      installments of approximately
                      <span class="font-bold">
                        {{ perInstallmentPreview() | number: '1.2-2' }}
                      </span>
                      each
                    </p>
                    <p class="text-xs text-brand-900/70 mt-1">
                      Exact schedule is generated by the server on submission.
                    </p>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Submit error -->
          @if (submitError()) {
            <div
              class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <svg class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="flex-1 font-medium">{{ submitError() }}</p>
            </div>
          }

          <!-- Submit -->
          <div class="flex items-center justify-between gap-3">
            <a [routerLink]="['/cars', c.id]" class="btn-secondary">Cancel</a>
            <button
              type="submit"
              class="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base"
              [disabled]="!canSubmit()"
            >
              @if (submitting()) {
                <app-spinner size="sm" />
                Creating order…
              } @else {
                Confirm booking
                @if (estimatedTotal() > 0) {
                  · {{ estimatedTotal() | number: '1.2-2' }}
                }
              }
            </button>
          </div>
        </form>

        <!-- Summary sidebar -->
        <aside class="lg:col-span-1">
          <div
            class="sticky top-24 bg-white rounded-3xl shadow-card border border-slate-200 p-6 sm:p-8"
          >
            <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Summary
            </h3>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Car</dt>
                <dd class="font-medium text-slate-900 text-right">{{ c.name }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Rate</dt>
                <dd class="font-medium text-slate-900">
                  {{ +c.price_per_day | number: '1.2-2' }} / day
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Delivery</dt>
                <dd class="font-medium text-slate-900">
                  {{
                    form.controls.delivery_date.value
                      ? (form.controls.delivery_date.value | date: 'mediumDate')
                      : '—'
                  }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Return</dt>
                <dd class="font-medium text-slate-900">
                  {{
                    form.controls.receiving_date.value
                      ? (form.controls.receiving_date.value | date: 'mediumDate')
                      : '—'
                  }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Days</dt>
                <dd class="font-medium text-slate-900">
                  {{ days() > 0 ? days() : '—' }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Payment</dt>
                <dd class="font-medium text-slate-900 capitalize">
                  {{ form.controls.payment_type.value }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Plan</dt>
                <dd class="font-medium text-slate-900">
                  {{
                    form.controls.order_type.value === 'full'
                      ? 'Pay in full'
                      : 'Installments'
                  }}
                </dd>
              </div>
            </dl>

            <div class="mt-6 border-t border-slate-100 pt-6">
              <div class="flex items-baseline justify-between">
                <span class="text-sm text-slate-500">Estimated total</span>
                <span class="text-2xl font-bold text-slate-900">
                  {{ estimatedTotal() | number: '1.2-2' }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Server-confirmed on submission.
              </p>
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
      this.loadError.set('No car selected.');
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
          this.loadError.set('This car could not be found.');
        } else {
          this.loadError.set(
            (err.error as { message?: string } | null)?.message ??
              'Failed to load car details.',
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
        this.notify.success(`Order #${order.id} created.`);
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
