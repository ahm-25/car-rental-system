import { DatePipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PaginationMeta } from '../../../models/pagination.model';
import { User, UserRole } from '../../../models/user.model';
import { AdminUsersService, UsersQuery } from './admin-users.service';

type RoleFilter = UserRole | 'all';

interface FilterValue {
  search: string;
  role: RoleFilter;
  country: string;
}

const COUNTRIES = [
  { value: '', labelKey: 'users.filters.country_all' },
  { value: 'Saudi Arabia', labelKey: 'countries.saudi_arabia' },
  { value: 'UAE', labelKey: 'countries.uae' },
  { value: 'Egypt', labelKey: 'countries.egypt' },
  { value: 'Jordan', labelKey: 'countries.jordan' },
  { value: 'Kuwait', labelKey: 'countries.kuwait' },
  { value: 'Qatar', labelKey: 'countries.qatar' },
  { value: 'Bahrain', labelKey: 'countries.bahrain' },
  { value: 'Oman', labelKey: 'countries.oman' },
];

const PAGE_SIZES = [10, 25, 50] as const;

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    NgClass,
    SpinnerComponent,
    PaginationComponent,
    ConfirmDialogComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ 'users.title' | t }}</h1>
          <p class="page-subtitle">{{ 'users.description' | t }}</p>
        </div>

        <div class="flex items-center gap-3">
          @if (meta(); as m) {
            <span class="hidden sm:inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg">
              {{ 'users.showing' | t }}
              <span class="font-semibold text-slate-900 dark:text-slate-100 mx-1">{{ m.from ?? rangeFrom() }}–{{ m.to ?? rangeTo() }}</span>
              {{ 'users.of' | t }}
              <span class="font-semibold text-brand-600 dark:text-brand-400 ms-1">{{ m.total }}</span>
            </span>
          }
          <a routerLink="/admin/users/new" class="btn-primary">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {{ 'users.new_user' | t }}
          </a>
        </div>
      </header>

      <!-- Filters -->
      <form
        [formGroup]="filters"
        class="card"
        (submit)="$event.preventDefault()"
      >
        <div class="grid gap-4 md:grid-cols-4">
          <div class="md:col-span-2">
            <label for="search" class="label">{{ 'users.search_label' | t }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <svg class="h-4 w-4 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="search"
                [placeholder]="'users.search_placeholder' | t"
                class="input ps-9"
                formControlName="search"
                autocomplete="off"
              />
            </div>
          </div>

          <div>
            <label for="role" class="label">{{ 'users.filters.role' | t }}</label>
            <select id="role" class="input" formControlName="role">
              <option value="all">{{ 'users.filters.role_all' | t }}</option>
              <option value="admin">{{ 'users.filters.role_admin' | t }}</option>
              <option value="customer">{{ 'users.filters.role_customer' | t }}</option>
            </select>
          </div>

          <div>
            <label for="country" class="label">{{ 'users.filters.country' | t }}</label>
            <select id="country" class="input" formControlName="country">
              @for (c of countries; track c.value) {
                <option [value]="c.value">{{ c.labelKey | t }}</option>
              }
            </select>
          </div>
        </div>

        <div class="flex justify-end mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            class="btn-ghost text-sm"
            [disabled]="!hasActiveFilters()"
            (click)="resetFilters()"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            {{ 'common.reset' | t }}
          </button>
        </div>
      </form>

      <!-- Error banner -->
      @if (error()) {
        <div
          class="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300"
        >
          <svg class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="font-medium">{{ error() }}</p>
          </div>
          <button type="button" class="btn-secondary" (click)="load()">{{ 'common.retry' | t }}</button>
        </div>
      }

      <!-- Table -->
      <div class="table-wrap relative">
        <div class="relative overflow-x-auto min-h-[360px]">
          <table class="min-w-full text-sm">
            <thead class="thead">
              <tr>
                <th scope="col" class="th">{{ 'users.table.name' | t }}</th>
                <th scope="col" class="th">{{ 'users.table.email' | t }}</th>
                <th scope="col" class="th">{{ 'users.table.phone' | t }}</th>
                <th scope="col" class="th">{{ 'users.table.role' | t }}</th>
                <th scope="col" class="th">{{ 'users.table.country' | t }}</th>
                <th scope="col" class="th">{{ 'users.table.joined' | t }}</th>
                <th scope="col" class="th text-end">{{ 'users.table.actions' | t }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              @for (user of users(); track user.id) {
                <tr class="tr-hover">
                  <td class="td">
                    <div class="flex items-center gap-3">
                      <div class="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-semibold shadow-card">
                        {{ initialsFor(user.name) }}
                      </div>
                      <span class="font-semibold text-slate-900 dark:text-slate-100">{{ user.name }}</span>
                    </div>
                  </td>
                  <td class="td text-slate-600 dark:text-slate-300">{{ user.email }}</td>
                  <td class="td text-slate-600 dark:text-slate-300 tabular-nums">{{ user.phone ?? '—' }}</td>
                  <td class="td">
                    <span [ngClass]="user.role === 'admin' ? 'badge-brand' : 'badge-neutral'">
                      {{ roleLabel(user.role) | t }}
                    </span>
                  </td>
                  <td class="td text-slate-600 dark:text-slate-300">{{ user.country ?? '—' }}</td>
                  <td class="td text-slate-500 dark:text-slate-400">
                    {{ user.created_at | date: 'mediumDate' }}
                  </td>
                  <td class="td">
                    <div class="flex items-center justify-end gap-1">
                      <a
                        [routerLink]="['/admin/users', user.id]"
                        class="icon-btn"
                        [title]="'common.view' | t"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </a>
                      <a
                        [routerLink]="['/admin/users', user.id, 'edit']"
                        class="icon-btn-brand"
                        [title]="'common.edit' | t"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </a>
                      <button
                        type="button"
                        class="icon-btn-danger"
                        [title]="'common.delete' | t"
                        (click)="askDelete(user)"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                @if (!loading() && !error()) {
                  <tr>
                    <td colspan="7" class="px-6 py-16">
                      <div class="empty-state">
                        <div class="empty-state-icon">
                          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18" />
                          </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ 'users.empty_title' | t }}</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 max-w-md">{{ 'users.empty_subtitle' | t }}</p>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          @if (loading()) {
            <div class="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-[2px] animate-fade-in">
              <app-spinner size="lg" />
            </div>
          }
        </div>

        <app-pagination
          [page]="page()"
          [lastPage]="meta()?.last_page ?? 1"
          [total]="meta()?.total ?? null"
          [from]="meta()?.from ?? null"
          [to]="meta()?.to ?? null"
          [perPage]="perPage()"
          [pageSizes]="pageSizes"
          [loading]="loading()"
          [showFirstLast]="true"
          [bordered]="true"
          (pageChange)="goToPage($event)"
          (perPageChange)="changePageSize($event)"
        />
      </div>
    </section>

    @if (userToDelete(); as u) {
      <app-confirm-dialog
        [open]="true"
        [title]="'users.delete_confirm.title' | t: { name: u.name }"
        [body]="'users.delete_confirm.body' | t"
        [confirmLabel]="'users.delete_confirm.delete' | t"
        [busyLabel]="'users.delete_confirm.deleting' | t"
        [busy]="deleting()"
        tone="danger"
        (confirm)="confirmDelete(u)"
        (cancel)="cancelDelete()"
      />
    }
  `,
})
export class UsersComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminUsersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lang = inject(LanguageService);
  private readonly notify = inject(NotificationService);

  protected readonly countries = COUNTRIES;
  protected readonly pageSizes = PAGE_SIZES;

  protected roleLabel(role: UserRole): string {
    return `users.roles.${role}`;
  }

  protected initialsFor(name: string): string {
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join('') || '?'
    );
  }

  protected readonly filters = this.fb.group({
    search: this.fb.control(''),
    role: new FormControl<RoleFilter>('all', { nonNullable: true }),
    country: this.fb.control(''),
  });

  protected readonly page = signal(1);
  protected readonly perPage = signal<number>(PAGE_SIZES[0]);

  protected readonly users = signal<User[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly userToDelete = signal<User | null>(null);
  protected readonly deleting = signal(false);

  protected readonly isLastPage = computed(() => {
    const m = this.meta();
    return !m || this.page() >= m.last_page;
  });

  protected readonly rangeFrom = computed(() => {
    const m = this.meta();
    if (!m || m.total === 0) return 0;
    return (m.current_page - 1) * m.per_page + 1;
  });

  protected readonly rangeTo = computed(() => {
    const m = this.meta();
    if (!m) return 0;
    return Math.min(m.current_page * m.per_page, m.total);
  });

  protected readonly hasActiveFilters = computed(() => {
    const v = this.filters.getRawValue();
    return v.search !== '' || v.role !== 'all' || v.country !== '';
  });

  ngOnInit(): void {
    this.filters.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(
          (a, b) => JSON.stringify(a) === JSON.stringify(b),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const v = this.filters.getRawValue() as FilterValue;
    const query: UsersQuery = {
      page: this.page(),
      perPage: this.perPage(),
      search: v.search || undefined,
      role: v.role === 'all' ? undefined : v.role,
      country: v.country || undefined,
    };

    this.service.list(query).subscribe({
      next: (res) => {
        const { data, links, ...meta } = res;
        this.users.set(data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.users.set([]);
        this.meta.set(null);
        this.error.set(
          (err.error as { message?: string } | null)?.message ??
            this.lang.translate('users.error_default'),
        );
      },
    });
  }

  goToPage(page: number): void {
    const last = this.meta()?.last_page ?? 1;
    const next = Math.min(Math.max(1, page), last);
    if (next === this.page()) return;
    this.page.set(next);
    this.load();
  }

  changePageSize(next: number): void {
    if (!next || next === this.perPage()) return;
    this.perPage.set(next);
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.filters.reset({ search: '', role: 'all', country: '' });
  }

  askDelete(user: User): void {
    if (this.deleting()) return;
    this.userToDelete.set(user);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.userToDelete.set(null);
  }

  confirmDelete(user: User): void {
    if (this.deleting()) return;

    this.deleting.set(true);
    this.service.delete(user.id).subscribe({
      next: (res) => {
        this.deleting.set(false);
        this.userToDelete.set(null);
        this.notify.success(res.message);
        this.load();
      },
      error: () => {
        this.deleting.set(false);
        this.userToDelete.set(null);
      },
    });
  }
}
