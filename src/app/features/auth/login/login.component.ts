import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../models/user.model';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type ServerErrors = Record<string, string[]>;

@Component({
  selector: 'app-login',
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
    <h2 class="mb-1">{{ 'auth.sign_in' | t }}</h2>
    <p class="text-sm text-slate-500 mb-6">
      {{ 'auth.welcome_back' | t }}
    </p>

    <!-- Role toggle -->
    <div
      class="flex rounded-lg bg-slate-100 p-1 mb-6"
      role="tablist"
      aria-label="Account type"
    >
      @for (opt of roleOptions; track opt.value) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="loginAs() === opt.value"
          class="flex-1 py-2 rounded-md text-sm font-medium transition-colors"
          [class.bg-white]="loginAs() === opt.value"
          [class.text-slate-900]="loginAs() === opt.value"
          [class.shadow-sm]="loginAs() === opt.value"
          [class.text-slate-500]="loginAs() !== opt.value"
          [class.hover:text-slate-700]="loginAs() !== opt.value"
          (click)="setRole(opt.value)"
        >
          {{ opt.labelKey | t }}
        </button>
      }
    </div>

    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
      novalidate
      class="flex flex-col gap-4"
    >
      <div>
        <label for="email" class="label">{{ 'auth.email' | t }}</label>
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
        <label for="password" class="label">{{ 'auth.password' | t }}</label>
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
        class="btn-primary mt-2 inline-flex items-center justify-center gap-2"
        [disabled]="form.invalid || submitting()"
      >
        @if (submitting()) {
          <app-spinner size="sm" />
          {{ 'common.loading' | t }}
        } @else {
          {{ 'auth.sign_in_as' | t: { role: (('auth.' + loginAs()) | t) } }}
        }
      </button>
    </form>

    @if (loginAs() === 'customer') {
      <p class="text-sm text-slate-600 mt-6">
        {{ 'auth.no_account' | t }}
        <a routerLink="/register" class="font-medium">{{ 'auth.create_one' | t }}</a>
      </p>
    } @else {
      <p class="text-xs text-slate-500 mt-6 text-center">
        {{ 'auth.admin_provisioned' | t }}
      </p>
    }
  `,
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly roleOptions: { value: UserRole; labelKey: string }[] = [
    { value: 'customer', labelKey: 'auth.customer' },
    { value: 'admin', labelKey: 'auth.admin' },
  ];

  protected readonly loginAs = signal<UserRole>('customer');
  protected readonly submitting = signal(false);
  protected readonly serverErrors = signal<ServerErrors | null>(null);

  protected readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required, Validators.minLength(6)]),
  });

  setRole(role: UserRole): void {
    if (this.submitting()) return;
    this.loginAs.set(role);
    this.serverErrors.set(null);
  }

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

    this.auth.login(this.form.getRawValue(), this.loginAs()).subscribe({
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
