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
import {
  Car,
  CreateCarPayload,
  UpdateCarPayload,
} from '../../../models/car.model';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6 max-w-3xl">
      <nav class="flex items-center gap-2 text-sm text-slate-500">
        <a routerLink="/admin/cars" class="hover:text-brand-700">Cars</a>
        <span>/</span>
        <span class="text-slate-900 font-medium">{{ title() }}</span>
      </nav>

      <header>
        <h1 class="text-2xl font-semibold text-slate-900">{{ title() }}</h1>
        <p class="text-sm text-slate-500 mt-1">
          {{
            isEdit()
              ? 'Update the car details below.'
              : 'Add a new car to the fleet.'
          }}
        </p>
      </header>

      @if (loadingCar()) {
        <div class="card flex items-center justify-center py-16">
          <app-spinner size="lg" />
        </div>
      } @else if (loadError()) {
        <div class="card flex flex-col items-center gap-3 py-12 text-center">
          <p class="font-medium text-slate-900">{{ loadError() }}</p>
          <div class="flex gap-2">
            <a routerLink="/admin/cars" class="btn-secondary">Back to cars</a>
            <button type="button" class="btn-primary" (click)="loadCar()">
              Retry
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
            <label for="name" class="label">Name</label>
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
            <label for="brand" class="label">Brand</label>
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
            <label for="model" class="label">Model</label>
            <input
              id="model"
              type="text"
              class="input"
              placeholder="e.g. 2024"
              [class.border-red-400]="showError('model')"
              formControlName="model"
            />
            <app-field-error
              [control]="form.controls.model"
              [serverErrors]="serverErrors()?.['model']"
            />
          </div>

          <div>
            <label for="kilometers" class="label">Kilometers</label>
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
              [messages]="{ min: 'Must be 0 or greater.' }"
            />
          </div>

          <div>
            <label for="price_per_day" class="label">Price per day</label>
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
              [messages]="{ min: 'Must be greater than zero.' }"
            />
          </div>

          <div class="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <a routerLink="/admin/cars" class="btn-secondary">Cancel</a>
            <button
              type="submit"
              class="btn-primary inline-flex items-center gap-2"
              [disabled]="form.invalid || submitting()"
            >
              @if (submitting()) {
                <app-spinner size="sm" />
                {{ isEdit() ? 'Saving…' : 'Creating…' }}
              } @else {
                {{ isEdit() ? 'Save changes' : 'Create car' }}
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

  @Input() id?: string;

  protected readonly submitting = signal(false);
  protected readonly serverErrors = signal<ServerErrors | null>(null);

  protected readonly loadingCar = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly isEdit = computed(() => !!this.id);
  protected readonly title = computed(() =>
    this.isEdit() ? 'Edit car' : 'New car',
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
            ? 'This car no longer exists.'
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
        this.notify.success(
          this.isEdit()
            ? `"${car.name}" was updated.`
            : `"${car.name}" was added to the fleet.`,
        );
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
