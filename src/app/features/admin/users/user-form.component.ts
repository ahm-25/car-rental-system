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
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserRole,
} from '../../../models/user.model';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AdminUsersService } from './admin-users.service';

type ServerErrors = Record<string, string[]>;

const ROLES: readonly UserRole[] = ['customer', 'admin'];

@Component({
  selector: 'app-admin-user-form',
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
        <a routerLink="/admin/users" class="hover:text-brand-700">{{ 'users.title' | t }}</a>
        <span class="rtl:rotate-180">/</span>
        <span class="text-slate-900 dark:text-slate-100 font-bold">{{ title() | t }}</span>
      </nav>

      <header>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ title() | t }}</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {{ (isEdit() ? 'users.form.edit_subtitle' : 'users.form.new_subtitle') | t }}
        </p>
      </header>

      @if (loadingUser()) {
        <div class="card flex items-center justify-center py-16">
          <app-spinner size="lg" />
        </div>
      } @else if (loadError()) {
        <div class="card flex flex-col items-center gap-3 py-12 text-center">
          <p class="font-medium text-slate-900 dark:text-slate-100">{{ loadError() }}</p>
          <div class="flex gap-2">
            <a routerLink="/admin/users" class="btn-secondary">{{ 'users.details.back' | t }}</a>
            <button type="button" class="btn-primary" (click)="loadUser()">
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
          <div>
            <label for="name" class="label">{{ 'users.form.name_label' | t }}</label>
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
            <label for="email" class="label">{{ 'users.form.email_label' | t }}</label>
            <input
              id="email"
              type="email"
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
            <label for="phone" class="label">{{ 'users.form.phone_label' | t }}</label>
            <input
              id="phone"
              type="tel"
              class="input"
              [class.border-red-400]="showError('phone')"
              formControlName="phone"
            />
            <app-field-error
              [control]="form.controls.phone"
              [serverErrors]="serverErrors()?.['phone']"
            />
          </div>

          <div>
            <label for="country" class="label">{{ 'users.form.country_label' | t }}</label>
            <input
              id="country"
              type="text"
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
            <label for="role" class="label">{{ 'users.form.role_label' | t }}</label>
            <select id="role" class="input" formControlName="role">
              @for (r of roles; track r) {
                <option [value]="r">{{ 'users.roles.' + r | t }}</option>
              }
            </select>
            <app-field-error
              [control]="form.controls.role"
              [serverErrors]="serverErrors()?.['role']"
            />
          </div>

          <div>
            <label for="wallet" class="label">{{ 'users.form.wallet_label' | t }}</label>
            <input
              id="wallet"
              type="number"
              min="0"
              step="0.01"
              class="input"
              formControlName="wallet"
            />
            <app-field-error
              [control]="form.controls.wallet"
              [serverErrors]="serverErrors()?.['wallet']"
            />
          </div>

          @if (!isEdit()) {
            <div class="md:col-span-2">
              <label for="password" class="label">{{ 'auth.password' | t }}</label>
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
          }

          <div class="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <a routerLink="/admin/users" class="btn-secondary">{{ 'common.cancel' | t }}</a>
            <button
              type="submit"
              class="btn-primary inline-flex items-center gap-2"
              [disabled]="form.invalid || submitting()"
            >
              @if (submitting()) {
                <app-spinner size="sm" />
                {{ (isEdit() ? 'users.form.saving' : 'users.form.creating') | t }}
              } @else {
                {{ (isEdit() ? 'users.form.save' : 'users.form.create') | t }}
              }
            </button>
          </div>
        </form>
      }
    </section>
  `,
})
export class AdminUserFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminUsersService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly lang = inject(LanguageService);

  @Input() id?: string;

  protected readonly roles = ROLES;

  protected readonly submitting = signal(false);
  protected readonly serverErrors = signal<ServerErrors | null>(null);

  protected readonly loadingUser = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly isEdit = computed(() => !!this.id);
  protected readonly title = computed(() =>
    this.isEdit() ? 'users.form.edit_title' : 'users.form.new_title',
  );

  protected readonly form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(60)]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    phone: this.fb.control('', [
      Validators.required,
      Validators.pattern(/^\+?[0-9]{8,15}$/),
    ]),
    country: this.fb.control('', [Validators.required, Validators.maxLength(60)]),
    role: this.fb.control<UserRole>('customer', [Validators.required]),
    wallet: this.fb.control<number | null>(null),
    password: this.fb.control('', [Validators.minLength(6)]),
  });

  ngOnInit(): void {
    if (this.isEdit()) {
      this.loadUser();
      this.form.controls.password.clearValidators();
      this.form.controls.password.updateValueAndValidity();
    } else {
      this.form.controls.password.addValidators([Validators.required]);
      this.form.controls.password.updateValueAndValidity();
    }
  }

  loadUser(): void {
    if (!this.id) return;

    this.loadingUser.set(true);
    this.loadError.set(null);

    this.service.getById(this.id).subscribe({
      next: (user) => {
        this.patchFromUser(user);
        this.loadingUser.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingUser.set(false);
        this.loadError.set(
          err.status === 404
            ? this.lang.translate('users.details.error_not_found')
            : (err.error as { message?: string } | null)?.message ??
                this.lang.translate('users.details.error_default'),
        );
      },
    });
  }

  showError(
    field: 'name' | 'email' | 'phone' | 'country' | 'role' | 'password',
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
    const wallet =
      raw.wallet === null || Number.isNaN(Number(raw.wallet))
        ? undefined
        : Number(raw.wallet);

    const req = this.isEdit()
      ? this.service.update(this.id!, {
          name: raw.name,
          email: raw.email,
          phone: raw.phone,
          country: raw.country,
          role: raw.role,
          wallet,
        } satisfies UpdateUserPayload)
      : this.service.create({
          name: raw.name,
          email: raw.email,
          phone: raw.phone,
          country: raw.country,
          role: raw.role,
          wallet,
          password: raw.password,
        } satisfies CreateUserPayload);

    req.subscribe({
      next: (user) => {
        this.submitting.set(false);
        const msgKey = this.isEdit()
          ? 'users.form.success_updated'
          : 'users.form.success_created';
        this.notify.success(this.lang.translate(msgKey, { name: user.name }));
        this.router.navigate(['/admin/users', user.id]);
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

  private patchFromUser(user: User): void {
    this.form.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      country: user.country ?? '',
      role: user.role,
      wallet: user.wallet === null ? null : Number(user.wallet),
    });
  }
}
