import { DatePipe, DecimalPipe } from '@angular/common';
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
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { Car } from '../../../models/car.model';
import { PaginationMeta } from '../../../models/pagination.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { AdminCarsService, CarsQuery } from './admin-cars.service';

const PAGE_SIZES = [10, 15, 25, 50] as const;

@Component({
  selector: 'app-admin-cars',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
    SpinnerComponent,
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-8">
      <header class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Cars</h1>
          <p class="text-base text-slate-500 dark:text-slate-400 font-medium mt-1">
            Manage the fleet available for rent.
          </p>
        </div>
        <div class="flex items-center gap-4">
          @if (meta(); as m) {
            <span class="hidden sm:inline text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              Showing
              <span class="font-bold text-slate-900 dark:text-slate-100">{{ m.from ?? 0 }}</span>
              –
              <span class="font-bold text-slate-900 dark:text-slate-100">{{ m.to ?? 0 }}</span>
              of <span class="font-bold text-brand-600 dark:text-brand-400">{{ m.total }}</span>
            </span>
          }
          <a routerLink="/admin/cars/new" class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white font-bold text-sm shadow-xl shadow-brand-500/30 hover:bg-brand-700 hover:-translate-y-0.5 hover:shadow-brand-500/40 transition-all duration-200">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New car
          </a>
        </div>
      </header>

      <!-- Filters -->
      <form
        [formGroup]="filters"
        class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800"
        (submit)="$event.preventDefault()"
      >
        <div class="grid gap-6 md:grid-cols-4">
          <div class="md:col-span-2">
            <label for="search" class="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 px-1">Search</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="search"
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl pl-11 pr-5 py-3.5 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-sm"
                placeholder="Name, brand or model…"
                formControlName="search"
                autocomplete="off"
              />
            </div>
          </div>

          <div>
            <label for="brand" class="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 px-1">Brand</label>
            <input
              id="brand"
              type="text"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-sm"
              placeholder="e.g. Toyota"
              formControlName="brand"
              autocomplete="off"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="min_price" class="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 px-1 text-truncate">Min / day</label>
              <input
                id="min_price"
                type="number"
                min="0"
                step="1"
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-sm"
                placeholder="$0"
                formControlName="min_price"
              />
            </div>
            <div>
              <label for="max_price" class="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 px-1 text-truncate">Max / day</label>
              <input
                id="max_price"
                type="number"
                min="0"
                step="1"
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-sm"
                placeholder="∞"
                formControlName="max_price"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 px-5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            [disabled]="!hasActiveFilters()"
            (click)="resetFilters()"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Reset filters
          </button>
        </div>
      </form>

      <!-- Error -->
      @if (error()) {
        <div
          class="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="flex-1 font-medium">{{ error() }}</p>
          <button type="button" class="btn-secondary" (click)="load()">Retry</button>
        </div>
      }

      <!-- Table -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none relative">
        <div class="relative overflow-x-auto min-h-[400px]">
          <table class="min-w-full text-sm text-left">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th class="px-6 py-5 whitespace-nowrap">Name</th>
                <th class="px-6 py-5 whitespace-nowrap">Brand / Model</th>
                <th class="px-6 py-5 text-right whitespace-nowrap">Mileage</th>
                <th class="px-6 py-5 text-right whitespace-nowrap">Price / day</th>
                <th class="px-6 py-5 whitespace-nowrap">Added</th>
                <th class="px-6 py-5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              @for (car of cars(); track car.id) {
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-bold text-slate-900 dark:text-slate-100">{{ car.name }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-slate-600 dark:text-slate-300 font-medium">{{ car.brand }}</div>
                    <div class="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{{ car.model }}</div>
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold group-hover:bg-brand-50 dark:group-hover:bg-brand-500/10 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors text-xs">
                      {{ car.kilometers | number }} km
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <div class="font-bold text-slate-900 dark:text-slate-100 text-base">
                      $ {{ +car.price_per_day | number: '1.2-2' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                    {{ car.created_at | date: 'mediumDate' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center justify-end gap-2">
                      <a
                        [routerLink]="['/admin/cars', car.id]"
                        class="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        title="View"
                      >
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </a>
                      <a
                        [routerLink]="['/admin/cars', car.id, 'edit']"
                        class="p-2 text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-all"
                        title="Edit"
                      >
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </a>
                      <button
                        type="button"
                        class="p-2 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all"
                        title="Delete"
                        (click)="askDelete(car)"
                      >
                         <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                @if (!loading() && !error()) {
                  <tr>
                    <td colspan="6" class="px-6 py-20">
                      <div class="flex flex-col items-center justify-center text-center">
                        <div class="w-20 h-20 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] flex items-center justify-center mb-5">
                          <svg class="h-10 w-10 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2" />
                          </svg>
                        </div>
                        <p class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No cars found</p>
                        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm">Try adjusting your filters or add a new car.</p>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          @if (loading()) {
            <div class="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]">
              <app-spinner size="lg" />
            </div>
          }
        </div>

        <app-pagination
          class="block"
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

    <!-- Delete confirmation -->
    @if (carToDelete(); as c) {
      <div
        class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70"
        role="dialog"
        aria-modal="true"
      >
        <div class="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-2xl shadow-elevated max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Delete "{{ c.name }}"?
          </h3>
          <p class="text-sm text-slate-600 dark:text-slate-400 mb-6">
            This will permanently remove the car from the fleet. This action cannot be undone.
          </p>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="btn-secondary"
              [disabled]="deleting()"
              (click)="cancelDelete()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn inline-flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
              [disabled]="deleting()"
              (click)="submitDelete()"
            >
              @if (deleting()) {
                <app-spinner size="sm" />
                Deleting…
              } @else {
                Delete
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminCarsComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminCarsService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSizes = PAGE_SIZES;

  protected readonly filters = this.fb.group({
    search: this.fb.control(''),
    brand: this.fb.control(''),
    min_price: this.fb.control<number | null>(null),
    max_price: this.fb.control<number | null>(null, {
      validators: [Validators.min(0)],
    }),
  });

  protected readonly page = signal(1);
  protected readonly perPage = signal<number>(PAGE_SIZES[1]);

  protected readonly cars = signal<Car[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly carToDelete = signal<Car | null>(null);
  protected readonly deleting = signal(false);

  protected readonly isLastPage = computed(() => {
    const m = this.meta();
    return !m || this.page() >= m.last_page;
  });

  protected readonly hasActiveFilters = computed(() => {
    const v = this.filters.getRawValue();
    return (
      !!v.search ||
      !!v.brand ||
      v.min_price !== null ||
      v.max_price !== null
    );
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

    const v = this.filters.getRawValue();
    const query: CarsQuery = {
      page: this.page(),
      perPage: this.perPage(),
      search: v.search || undefined,
      brand: v.brand || undefined,
      min_price: v.min_price ?? undefined,
      max_price: v.max_price ?? undefined,
    };

    this.service.list(query).subscribe({
      next: (res) => {
        const { data, links, ...meta } = res;
        this.cars.set(data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.cars.set([]);
        this.meta.set(null);
        this.error.set(
          (err.error as { message?: string } | null)?.message ??
            'Failed to load cars. Please try again.',
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
    this.filters.reset({
      search: '',
      brand: '',
      min_price: null,
      max_price: null,
    });
  }

  askDelete(car: Car): void {
    this.carToDelete.set(car);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.carToDelete.set(null);
  }

  submitDelete(): void {
    const car = this.carToDelete();
    if (!car || this.deleting()) return;

    this.deleting.set(true);
    this.service.delete(car.id).subscribe({
      next: (res) => {
        this.deleting.set(false);
        this.carToDelete.set(null);
        this.notify.success(res.message);
        this.load();
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }
}
