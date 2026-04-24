import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import {
  Car,
  CreateCarPayload,
  UpdateCarPayload,
} from '../../../models/car.model';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AdminCarsService } from './admin-cars.service';

type ServerErrors = Record<string, string[]>;

@Component({
  selector: 'app-admin-car-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FieldErrorComponent,
    SpinnerComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6 max-w-3xl">
      <nav class="flex items-center gap-2 text-sm text-slate-500">
        <a routerLink="/admin/cars" class="hover:text-brand-700">{{ 'cars.details.nav' | t }}</a>
        <span class="rtl:rotate-180">/</span>
        <span class="text-slate-900 dark:text-slate-100 font-medium font-bold">{{ title() | t }}</span>
      </nav>

      <header>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ title() | t }}</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {{
            isEdit()
              ? ('cars.form.edit_subtitle' | t)
              : ('cars.form.new_subtitle' | t)
          }}
        </p>
      </header>

      @if (loadingCar()) {
        <div class="card flex items-center justify-center py-16">
          <app-spinner size="lg" />
        </div>
      } @else if (loadError()) {
        <div class="card flex flex-col items-center gap-3 py-12 text-center">
          <p class="font-medium text-slate-900 dark:text-slate-100">{{ loadError() }}</p>
          <div class="flex gap-2">
            <a routerLink="/admin/cars" class="btn-secondary">{{ 'cars.details.back' | t }}</a>
            <button type="button" class="btn-primary" (click)="loadCar()">
              {{ 'common.retry' | t }}
            </button>
          </div>
        </div>
      } @else {
        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="card grid gap-4 md:grid-cols-2"
          novalidate
        >
          <div class="md:col-span-2">
            <label for="name" class="label">{{ 'cars.form.name_label' | t }}</label>
            <input
              id="name"
              type="text"
              class="input"
              [class.border-red-400]="showError('name')"
              formControlName="name"
            />
            <app-field-error
              [control]="form.controls.name"
              [serverErrors]="serverErrors()?.['name']"
            />
          </div>

          <div>
            <label for="brand" class="label">{{ 'cars.form.brand_label' | t }}</label>
            <input
              id="brand"
              type="text"
              class="input"
              [class.border-red-400]="showError('brand')"
              formControlName="brand"
            />
            <app-field-error
              [control]="form.controls.brand"
              [serverErrors]="serverErrors()?.['brand']"
            />
          </div>

          <div>
            <label for="model" class="label">{{ 'cars.form.model_label' | t }}</label>
            <input
              id="model"
              type="text"
              class="input"
              [placeholder]="'cars.form.model_placeholder' | t"
              [class.border-red-400]="showError('model')"
              formControlName="model"
            />
            <app-field-error
              [control]="form.controls.model"
              [serverErrors]="serverErrors()?.['model']"
            />
          </div>

          <div>
            <label for="kilometers" class="label">{{ 'cars.form.kilometers_label' | t }}</label>
            <input
              id="kilometers"
              type="number"
              min="0"
              step="1"
              class="input"
              [class.border-red-400]="showError('kilometers')"
              formControlName="kilometers"
            />
            <app-field-error
              [control]="form.controls.kilometers"
              [serverErrors]="serverErrors()?.['kilometers']"
              [messages]="{ min: ('cars.form.error_min_km' | t) }"
            />
          </div>

          <div>
            <label for="price_per_day" class="label">{{ 'cars.form.price_label' | t }}</label>
            <input
              id="price_per_day"
              type="number"
              min="0"
              step="0.01"
              class="input"
              [class.border-red-400]="showError('price_per_day')"
              formControlName="price_per_day"
            />
            <app-field-error
              [control]="form.controls.price_per_day"
              [serverErrors]="serverErrors()?.['price_per_day']"
              [messages]="{ min: ('cars.form.error_min_price' | t) }"
            />
          </div>

          <div class="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <a routerLink="/admin/cars" class="btn-secondary">{{ 'cars.form.cancel' | t }}</a>
            <button
              type="submit"
              class="btn-primary inline-flex items-center gap-2"
              [disabled]="form.invalid || submitting()"
            >
              @if (submitting()) {
                <app-spinner size="sm" />
                {{ isEdit() ? ('cars.form.saving' | t) : ('cars.form.creating' | t) }}
              } @else {
                {{ isEdit() ? ('cars.form.save' | t) : ('cars.form.create' | t) }}
              }
            </button>
          </div>
        </form>
      }
    </section>
  `,
})
export class AdminCarFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminCarsService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly lang = inject(LanguageService);

  @Input() id?: string;

  protected readonly submitting = signal(false);
  protected readonly serverErrors = signal<ServerErrors | null>(null);

  protected readonly loadingCar = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly isEdit = computed(() => !!this.id);
  protected readonly title = computed(() =>
    this.isEdit() ? 'cars.form.edit_title' : 'cars.form.new_title',
  );

  protected readonly form = this.fb.group({
    name: this.fb.control('', [
      Validators.required,
      Validators.maxLength(100),
    ]),
    brand: this.fb.control('', [
      Validators.required,
      Validators.maxLength(60),
    ]),
    model: this.fb.control('', [
      Validators.required,
      Validators.maxLength(20),
    ]),
    kilometers: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    price_per_day: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
    ]),
  });

  ngOnInit(): void {
    if (this.isEdit()) {
      this.loadCar();
    }
  }

  loadCar(): void {
    if (!this.id) return;

    this.loadingCar.set(true);
    this.loadError.set(null);

    this.service.getById(this.id).subscribe({
      next: (car) => {
        this.patchFromCar(car);
        this.loadingCar.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingCar.set(false);
        this.loadError.set(
          err.status === 404
            ? this.lang.translate('cars.details.not_found')
            : (err.error as { message?: string } | null)?.message ??
                'Failed to load car details.',
        );
      },
    });
  }

  showError(
    field: 'name' | 'brand' | 'model' | 'kilometers' | 'price_per_day',
  ): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverErrors.set(null);

    const raw = this.form.getRawValue();
    const payload: CreateCarPayload = {
      name: raw.name,
      brand: raw.brand,
      model: raw.model,
      kilometers: Number(raw.kilometers),
      price_per_day: Number(raw.price_per_day),
    };

    const req = this.isEdit()
      ? this.service.update(this.id!, payload as UpdateCarPayload)
      : this.service.create(payload);

    req.subscribe({
      next: (car) => {
        this.submitting.set(false);
        const msgKey = this.isEdit()
          ? 'cars.form.success_updated'
          : 'cars.form.success_created';
        this.notify.success(this.lang.translate(msgKey, { name: car.name }));
        this.router.navigate(['/admin/cars']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const errors = (err.error as { errors?: ServerErrors } | null)?.errors;
        if (errors) {
          this.serverErrors.set(errors);
        }
      },
    });
  }

  private patchFromCar(car: Car): void {
    this.form.patchValue({
      name: car.name,
      brand: car.brand,
      model: car.model,
      kilometers: car.kilometers,
      price_per_day: Number(car.price_per_day),
    });
  }
}
