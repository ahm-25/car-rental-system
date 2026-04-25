import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { passwordsMatchValidator } from '../../../shared/validators/passwords-match.validator';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type ServerErrors = Record<string, string[]>;

@Component({
  selector: 'app-register',
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
    <div class="space-y-2 mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {{ 'auth.create_account' | t }}
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        {{ 'auth.register_subtitle' | t }}
      </p>
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">
      <div class="form-row">
        <label for="name" class="label">{{ 'auth.full_name' | t }}</label>
        <input
          id="name"
          type="text"
          autocomplete="name"
          class="input"
          [class.input-error]="showError('name')"
          formControlName="name"
        />
        <app-field-error
          [control]="form.controls.name"
          [serverErrors]="serverErrors()?.['name']"
        />
      </div>

      <div class="form-row">
        <label for="email" class="label">{{ 'auth.email' | t }}</label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          class="input"
          [class.input-error]="showError('email')"
          formControlName="email"
          placeholder="you@example.com"
        />
        <app-field-error
          [control]="form.controls.email"
          [serverErrors]="serverErrors()?.['email']"
        />
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div class="form-row">
          <label for="phone" class="label">{{ 'auth.phone' | t }}</label>
          <input
            id="phone"
            type="tel"
            autocomplete="tel"
            class="input"
            [class.input-error]="showError('phone')"
            formControlName="phone"
            placeholder="+966…"
          />
          <app-field-error
            [control]="form.controls.phone"
            [serverErrors]="serverErrors()?.['phone']"
            [messages]="{ pattern: 'Enter a valid phone number (8–15 digits).' }"
          />
        </div>

        <div class="form-row">
          <label for="country" class="label">{{ 'auth.country' | t }}</label>
          <input
            id="country"
            type="text"
            autocomplete="country-name"
            class="input"
            [class.input-error]="showError('country')"
            formControlName="country"
          />
          <app-field-error
            [control]="form.controls.country"
            [serverErrors]="serverErrors()?.['country']"
          />
        </div>
      </div>

      <div class="form-row">
        <label for="password" class="label">{{ 'auth.password' | t }}</label>
        <input
          id="password"
          type="password"
          autocomplete="new-password"
          class="input"
          [class.input-error]="showError('password')"
          formControlName="password"
          placeholder="••••••••"
        />
        <app-field-error
          [control]="form.controls.password"
          [serverErrors]="serverErrors()?.['password']"
        />
      </div>

      <div class="form-row">
        <label for="passwordConfirmation" class="label">{{ 'auth.password_confirm' | t }}</label>
        <input
          id="passwordConfirmation"
          type="password"
          autocomplete="new-password"
          class="input"
          [class.input-error]="showError('passwordConfirmation')"
          formControlName="passwordConfirmation"
          placeholder="••••••••"
        />
        <app-field-error
          [control]="form.controls.passwordConfirmation"
          [serverErrors]="serverErrors()?.['password_confirmation']"
        />
      </div>

      <button
        type="submit"
        class="btn-primary mt-2 py-3"
        [disabled]="form.invalid || submitting()"
      >
        @if (submitting()) {
          <app-spinner size="sm" />
          <span>{{ 'auth.creating_account' | t }}</span>
        } @else {
          <span>{{ 'auth.create_account' | t }}</span>
        }
      </button>
    </form>

    <p class="text-sm text-slate-600 dark:text-slate-400 mt-6 text-center">
      {{ 'auth.already_registered' | t }}
      <a
        routerLink="/login"
        class="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 ms-1"
      >
        {{ 'auth.sign_in' | t }}
      </a>
    </p>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly serverErrors = signal<ServerErrors | null>(null);

  protected readonly form = this.fb.group(
    {
      name: this.fb.control('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(60),
      ]),
      email: this.fb.control('', [Validators.required, Validators.email]),
      phone: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^\+?[0-9]{8,15}$/),
      ]),
      country: this.fb.control('', [
        Validators.required,
        Validators.maxLength(60),
      ]),
      password: this.fb.control('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      passwordConfirmation: this.fb.control('', [Validators.required]),
    },
    { validators: [passwordsMatchValidator('password', 'passwordConfirmation')] },
  );

  showError(
    field:
      | 'name'
      | 'email'
      | 'phone'
      | 'country'
      | 'password'
      | 'passwordConfirmation',
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

    const { passwordConfirmation, ...rest } = this.form.getRawValue();
    const payload = { ...rest, password_confirmation: passwordConfirmation };

    this.auth.register(payload).subscribe({
      next: () => {
        this.router.navigateByUrl(this.auth.defaultRouteForRole());
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
}
