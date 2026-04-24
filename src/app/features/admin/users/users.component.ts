import { DatePipe } from '@angular/common';
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
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
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
  { value: '', label: 'All countries' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'UAE', label: 'UAE' },
  { value: 'Egypt', label: 'Egypt' },
  { value: 'Jordan', label: 'Jordan' },
  { value: 'Kuwait', label: 'Kuwait' },
  { value: 'Qatar', label: 'Qatar' },
  { value: 'Bahrain', label: 'Bahrain' },
  { value: 'Oman', label: 'Oman' },
];

const PAGE_SIZES = [10, 25, 50] as const;

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Users</h1>
          <p class="text-sm text-slate-500 mt-1">
            Manage customer and admin accounts.
          </p>
        </div>

        <div class="flex items-center gap-3 text-sm text-slate-500">
          @if (meta(); as m) {
            <span>
              Showing
              <span class="font-medium text-slate-900">{{ m.from ?? rangeFrom() }}</span>
              –
              <span class="font-medium text-slate-900">{{ m.to ?? rangeTo() }}</span>
              of
              <span class="font-medium text-slate-900">{{ m.total }}</span>
            </span>
          }
        </div>
      </header>

      <!-- Filters -->
      <form
        [formGroup]="filters"
        class="card flex flex-col md:flex-row md:items-end gap-4"
        (submit)="$event.preventDefault()"
      >
        <div class="flex-1 min-w-0">
          <label for="search" class="label">Search</label>
          <input
            id="search"
            type="search"
            placeholder="Name, email or phone…"
            class="input"
            formControlName="search"
            autocomplete="off"
          />
        </div>

        <div class="w-full md:w-48">
          <label for="role" class="label">Role</label>
          <select id="role" class="input" formControlName="role">
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        <div class="w-full md:w-56">
          <label for="country" class="label">Country</label>
          <select id="country" class="input" formControlName="country">
            @for (c of countries; track c.value) {
              <option [value]="c.value">{{ c.label }}</option>
            }
          </select>
        </div>

        <button
          type="button"
          class="btn-ghost md:self-center md:ml-auto"
          [disabled]="!hasActiveFilters()"
          (click)="resetFilters()"
        >
          Reset
        </button>
      </form>

      <!-- Error banner -->
      @if (error()) {
        <div
          class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <svg class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="font-medium">{{ error() }}</p>
          </div>
          <button type="button" class="btn-secondary" (click)="load()">Retry</button>
        </div>
      }

      <!-- Table -->
      <div class="card p-0 overflow-hidden">
        <div class="relative overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" class="px-4 py-3">Name</th>
                <th scope="col" class="px-4 py-3">Email</th>
                <th scope="col" class="px-4 py-3">Phone</th>
                <th scope="col" class="px-4 py-3">Role</th>
                <th scope="col" class="px-4 py-3">Country</th>
                <th scope="col" class="px-4 py-3">Joined</th>
                <th scope="col" class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (user of users(); track user.id) {
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-slate-900">{{ user.name }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ user.email }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ user.phone }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                      [class.bg-brand-50]="user.role === 'admin'"
                      [class.text-brand-700]="user.role === 'admin'"
                      [class.bg-slate-100]="user.role !== 'admin'"
                      [class.text-slate-700]="user.role !== 'admin'"
                    >
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ user.country }}</td>
                  <td class="px-4 py-3 text-slate-500">
                    {{ user.created_at | date: 'mediumDate' }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <a
                      [routerLink]="['/admin/users', user.id]"
                      class="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
                    >
                      View
                      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </td>
                </tr>
              } @empty {
                @if (!loading() && !error()) {
                  <tr>
                    <td colspan="7" class="px-4 py-12">
                      <div class="flex flex-col items-center gap-2 text-center">
                        <svg class="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18" />
                        </svg>
                        <p class="text-sm font-medium text-slate-700">No users found</p>
                        <p class="text-xs text-slate-500">
                          Try adjusting your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          @if (loading()) {
            <div
              class="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm"
            >
              <app-spinner size="lg" />
            </div>
          }
        </div>

        <!-- Pagination footer -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm"
        >
          <div class="flex items-center gap-2 text-slate-600">
            <label for="perPage">Rows per page:</label>
            <select
              id="perPage"
              class="input w-20 py-1"
              [value]="perPage()"
              (change)="changePageSize(asSelect($event.target).value)"
            >
              @for (size of pageSizes; track size) {
                <option [value]="size">{{ size }}</option>
              }
            </select>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="page() === 1 || loading()"
              (click)="goToPage(1)"
            >
              «
            </button>
            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="page() === 1 || loading()"
              (click)="goToPage(page() - 1)"
            >
              Prev
            </button>

            <span class="px-3 text-slate-600">
              Page <span class="font-medium text-slate-900">{{ page() }}</span>
              of <span class="font-medium text-slate-900">{{ meta()?.last_page ?? 1 }}</span>
            </span>

            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="isLastPage() || loading()"
              (click)="goToPage(page() + 1)"
            >
              Next
            </button>
            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="isLastPage() || loading()"
              (click)="goToPage(meta()?.last_page ?? 1)"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class UsersComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminUsersService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly countries = COUNTRIES;
  protected readonly pageSizes = PAGE_SIZES;

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
            'Failed to load users. Please try again.',
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

  changePageSize(value: string | number): void {
    const next = Number(value);
    if (!next || next === this.perPage()) return;
    this.perPage.set(next);
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.filters.reset({ search: '', role: 'all', country: '' });
  }

  /** Typed cast for DOM event targets in templates (avoids `$any`). */
  asSelect(target: EventTarget | null): HTMLSelectElement {
    return target as HTMLSelectElement;
  }
}
