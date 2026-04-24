import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';

type ServerErrors = Record<string, string[]>;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="mb-1">Sign in</h2>
    <p class="text-sm text-slate-500 mb-6">Welcome back — please enter your credentials.</p>

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">
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
        <label for="password" class="label">Password</label>
        <input
          id="password"
          type="password"
          autocomplete="current-password"
          class="input"
          [class.border-red-400]="showError('password')"
          formControlName="password"
        />
        <app-field-error
          [control]="form.controls.password"
          [serverErrors]="serverErrors()?.['password']"
        />
      </div>

      <button
        type="submit"
        class="btn-primary mt-2"
        [disabled]="form.invalid || submitting()"
      >
        @if (submitting()) {
          Signing in…
        } @else {
          Sign in
        }
      </button>
    </form>

    <p class="text-sm text-slate-600 mt-6">
      No account?
      <a routerLink="/register" class="font-medium">Create one</a>
    </p>
  `,
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly serverErrors = signal<ServerErrors | null>(null);

  protected readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required, Validators.minLength(6)]),
  });

  showError(field: 'email' | 'password'): boolean {
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

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl ?? this.auth.defaultRouteForRole());
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
