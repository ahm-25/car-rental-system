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
import { passwordsMatchValidator } from '../../../shared/validators/passwords-match.validator';

type ServerErrors = Record<string, string[]>;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="mb-1">Create an account</h2>
    <p class="text-sm text-slate-500 mb-6">Join to start renting cars in minutes.</p>

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">
      <div>
        <label for="name" class="label">Full name</label>
        <input
          id="name"
          type="text"
          autocomplete="name"
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
        <label for="email" class="label">Email</label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          class="input"
          [class.border-red-400]="showError('email')"
          formControlName="email"
        />
        <app-field-error
          [control]="form.controls.email"
          [serverErrors]="serverErrors()?.['email']"
        />
      </div>

      <div>
        <label for="phone" class="label">Phone</label>
        <input
          id="phone"
          type="tel"
          autocomplete="tel"
          class="input"
          [class.border-red-400]="showError('phone')"
          formControlName="phone"
        />
        <app-field-error
          [control]="form.controls.phone"
          [serverErrors]="serverErrors()?.['phone']"
          [messages]="{ pattern: 'Enter a valid phone number (digits only, 8–15).' }"
        />
      </div>

      <div>
        <label for="country" class="label">Country</label>
        <input
          id="country"
          type="text"
          autocomplete="country-name"
          class="input"
          [class.border-red-400]="showError('country')"
          formControlName="country"
        />
        <app-field-error
          [control]="form.controls.country"
          [serverErrors]="serverErrors()?.['country']"
        />
      </div>

      <div>
        <label for="password" class="label">Password</label>
        <input
          id="password"
          type="password"
          autocomplete="new-password"
          class="input"
          [class.border-red-400]="showError('password')"
          formControlName="password"
        />
        <app-field-error
          [control]="form.controls.password"
          [serverErrors]="serverErrors()?.['password']"
        />
      </div>

      <div>
        <label for="passwordConfirmation" class="label">Confirm password</label>
        <input
          id="passwordConfirmation"
          type="password"
          autocomplete="new-password"
          class="input"
          [class.border-red-400]="showError('passwordConfirmation')"
          formControlName="passwordConfirmation"
        />
        <app-field-error
          [control]="form.controls.passwordConfirmation"
          [serverErrors]="serverErrors()?.['password_confirmation']"
        />
      </div>

      <button
        type="submit"
        class="btn-primary mt-2"
        [disabled]="form.invalid || submitting()"
      >
        @if (submitting()) {
          Creating account…
        } @else {
          Create account
        }
      </button>
    </form>

    <p class="text-sm text-slate-600 mt-6">
      Already registered?
      <a routerLink="/login" class="font-medium">Sign in</a>
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
        Validators.minLength(8),
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

    // Map internal form control name → exact API field name
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
