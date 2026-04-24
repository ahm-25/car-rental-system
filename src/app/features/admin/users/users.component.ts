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
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
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
    SpinnerComponent,
    PaginationComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-8">
      <header class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">{{ 'users.title' | t }}</h1>
          <p class="text-base text-slate-500 font-medium mt-1">
            {{ 'users.description' | t }}
          </p>
        </div>

        <div class="flex items-center gap-4">
          @if (meta(); as m) {
            <span class="hidden sm:inline text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              {{ 'users.showing' | t }}
              <span class="font-bold text-slate-900">{{ m.from ?? rangeFrom() }}</span>
              –
              <span class="font-bold text-slate-900">{{ m.to ?? rangeTo() }}</span>
              {{ 'users.of' | t }} <span class="font-bold text-brand-600">{{ m.total }}</span>
            </span>
          }
        </div>
      </header>

      <!-- Filters -->
      <form
        [formGroup]="filters"
        class="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
        (submit)="$event.preventDefault()"
      >
        <div class="grid gap-6 md:grid-cols-4">
          <div class="md:col-span-2">
            <label for="search" class="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 px-1">{{ 'users.search_label' | t }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 start-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg class="h-5 w-5 rtl:-scale-x-100 ms-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="search"
                [placeholder]="'users.search_placeholder' | t"
                class="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl ps-11 pe-5 py-3.5 text-slate-900 font-medium placeholder:text-slate-400 transition-all text-sm"
                formControlName="search"
                autocomplete="off"
              />
            </div>
          </div>

          <div>
            <label for="role" class="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 px-1">{{ 'users.filters.role' | t }}</label>
            <select id="role" class="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-5 py-3.5 text-slate-900 font-medium transition-all text-sm appearance-none" formControlName="role">
              <option value="all">{{ 'users.filters.role_all' | t }}</option>
              <option value="admin">{{ 'users.filters.role_admin' | t }}</option>
              <option value="customer">{{ 'users.filters.role_customer' | t }}</option>
            </select>
          </div>

          <div>
            <label for="country" class="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 px-1">{{ 'users.filters.country' | t }}</label>
            <select id="country" class="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-5 py-3.5 text-slate-900 font-medium transition-all text-sm appearance-none" formControlName="country">
              @for (c of countries; track c.value) {
                <option [value]="c.value">{{ c.labelKey | t }}</option>
              }
            </select>
          </div>
        </div>

        <div class="flex justify-end mt-6 pt-6 border-t border-slate-100">
          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            [disabled]="!hasActiveFilters()"
            (click)="resetFilters()"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            {{ 'common.reset' | t }}
          </button>
        </div>
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
          <button type="button" class="btn-secondary" (click)="load()">{{ 'common.retry' | t }}</button>
        </div>
      }

      <!-- Table -->
      <div class="card p-0 overflow-hidden">
        <div class="relative overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-start text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" class="px-4 py-3">{{ 'users.table.name' | t }}</th>
                <th scope="col" class="px-4 py-3">{{ 'users.table.email' | t }}</th>
                <th scope="col" class="px-4 py-3">{{ 'users.table.phone' | t }}</th>
                <th scope="col" class="px-4 py-3">{{ 'users.table.role' | t }}</th>
                <th scope="col" class="px-4 py-3">{{ 'users.table.country' | t }}</th>
                <th scope="col" class="px-4 py-3">{{ 'users.table.joined' | t }}</th>
                <th scope="col" class="px-4 py-3 text-end">{{ 'users.table.actions' | t }}</th>
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
                      {{ roleLabel(user.role) | t }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ user.country }}</td>
                  <td class="px-4 py-3 text-slate-500">
                    {{ user.created_at | date: 'mediumDate' }}
                  </td>
                  <td class="px-4 py-3 text-end">
                    <a
                      [routerLink]="['/admin/users', user.id]"
                      class="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
                    >
                      {{ 'users.view' | t }}
                      <svg class="h-4 w-4 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                        <p class="text-sm font-medium text-slate-700">{{ 'users.empty_title' | t }}</p>
                        <p class="text-xs text-slate-500">
                          {{ 'users.empty_subtitle' | t }}
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

        <app-pagination
          [page]="page()"
          [lastPage]="meta()?.last_page ?? 1"
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
  `,
})
export class UsersComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminUsersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lang = inject(LanguageService);

  protected readonly countries = COUNTRIES;
  protected readonly pageSizes = PAGE_SIZES;

  protected roleLabel(role: UserRole): string {
    return `users.roles.${role}`;
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
}
