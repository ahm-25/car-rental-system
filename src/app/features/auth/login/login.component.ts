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
    <div class="space-y-2 mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {{ 'auth.sign_in' | t }}
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        {{ 'auth.welcome_back' | t }}
      </p>
    </div>

    <!-- Role toggle -->
    <div
      class="flex rounded-xl bg-slate-100/80 dark:bg-slate-800/60 p-1 mb-6"
      role="tablist"
      aria-label="Account type"
    >
      @for (opt of roleOptions; track opt.value) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="loginAs() === opt.value"
          class="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-smooth"
          [class.bg-white]="loginAs() === opt.value"
          [class.dark:bg-slate-900]="loginAs() === opt.value"
          [class.shadow-card]="loginAs() === opt.value"
          [class.text-slate-900]="loginAs() === opt.value"
          [class.dark:text-slate-100]="loginAs() === opt.value"
          [class.text-slate-500]="loginAs() !== opt.value"
          [class.dark:text-slate-400]="loginAs() !== opt.value"
          [class.hover:text-slate-700]="loginAs() !== opt.value"
          [class.dark:hover:text-slate-200]="loginAs() !== opt.value"
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

      <div class="form-row">
        <label for="password" class="label">{{ 'auth.password' | t }}</label>
        <input
          id="password"
          type="password"
          autocomplete="current-password"
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

      <button
        type="submit"
        class="btn-primary mt-2 py-3"
        [disabled]="form.invalid || submitting()"
      >
        @if (submitting()) {
          <app-spinner size="sm" />
          <span>{{ 'common.loading' | t }}</span>
        } @else {
          <span>{{ 'auth.sign_in_as' | t: { role: (('auth.' + loginAs()) | t) } }}</span>
        }
      </button>
    </form>

    @if (loginAs() === 'customer') {
      <p class="text-sm text-slate-600 dark:text-slate-400 mt-6 text-center">
        {{ 'auth.no_account' | t }}
        <a routerLink="/register" class="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 ms-1">
          {{ 'auth.create_one' | t }}
        </a>
      </p>
    } @else {
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-6 text-center">
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
