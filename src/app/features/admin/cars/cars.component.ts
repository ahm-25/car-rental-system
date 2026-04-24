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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Cars</h1>
          <p class="text-sm text-slate-500 mt-1">
            Manage the fleet available for rent.
          </p>
        </div>
        <div class="flex items-center gap-3">
          @if (meta(); as m) {
            <span class="hidden sm:inline text-sm text-slate-500">
              Showing
              <span class="font-medium text-slate-900">{{ m.from ?? 0 }}</span>
              –
              <span class="font-medium text-slate-900">{{ m.to ?? 0 }}</span>
              of
              <span class="font-medium text-slate-900">{{ m.total }}</span>
            </span>
          }
          <a routerLink="/admin/cars/new" class="btn-primary">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New car
          </a>
        </div>
      </header>

      <!-- Filters -->
      <form
        [formGroup]="filters"
        class="card grid gap-4 md:grid-cols-4"
        (submit)="$event.preventDefault()"
      >
        <div class="md:col-span-2">
          <label for="search" class="label">Search</label>
          <input
            id="search"
            type="search"
            class="input"
            placeholder="Name, brand or model…"
            formControlName="search"
            autocomplete="off"
          />
        </div>

        <div>
          <label for="brand" class="label">Brand</label>
          <input
            id="brand"
            type="text"
            class="input"
            placeholder="e.g. Toyota"
            formControlName="brand"
            autocomplete="off"
          />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="min_price" class="label">Min price</label>
            <input
              id="min_price"
              type="number"
              min="0"
              step="1"
              class="input"
              formControlName="min_price"
            />
          </div>
          <div>
            <label for="max_price" class="label">Max price</label>
            <input
              id="max_price"
              type="number"
              min="0"
              step="1"
              class="input"
              formControlName="max_price"
            />
          </div>
        </div>

        <div class="md:col-span-4 flex justify-end">
          <button
            type="button"
            class="btn-ghost"
            [disabled]="!hasActiveFilters()"
            (click)="resetFilters()"
          >
            Reset filters
          </button>
        </div>
      </form>

      <!-- Error -->
      @if (error()) {
        <div
          class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="flex-1 font-medium">{{ error() }}</p>
          <button type="button" class="btn-secondary" (click)="load()">Retry</button>
        </div>
      }

      <!-- Table -->
      <div class="card p-0 overflow-hidden">
        <div class="relative overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">Brand</th>
                <th class="px-4 py-3">Model</th>
                <th class="px-4 py-3 text-right">Kilometers</th>
                <th class="px-4 py-3 text-right">Price / day</th>
                <th class="px-4 py-3">Added</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (car of cars(); track car.id) {
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-slate-900">{{ car.name }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ car.brand }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ car.model }}</td>
                  <td class="px-4 py-3 text-right text-slate-600">
                    {{ car.kilometers | number }}
                  </td>
                  <td class="px-4 py-3 text-right font-medium text-slate-900">
                    {{ +car.price_per_day | number: '1.2-2' }}
                  </td>
                  <td class="px-4 py-3 text-slate-500">
                    {{ car.created_at | date: 'mediumDate' }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-3">
                      <a
                        [routerLink]="['/admin/cars', car.id]"
                        class="text-slate-600 hover:text-slate-900 font-medium"
                      >
                        View
                      </a>
                      <a
                        [routerLink]="['/admin/cars', car.id, 'edit']"
                        class="text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Edit
                      </a>
                      <button
                        type="button"
                        class="text-red-600 hover:text-red-700 font-medium"
                        (click)="askDelete(car)"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                @if (!loading() && !error()) {
                  <tr>
                    <td colspan="7" class="px-4 py-12">
                      <div class="flex flex-col items-center gap-2 text-center">
                        <svg class="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2" />
                        </svg>
                        <p class="text-sm font-medium text-slate-700">No cars found</p>
                        <p class="text-xs text-slate-500">Try adjusting your filters or add a new car.</p>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          @if (loading()) {
            <div class="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <app-spinner size="lg" />
            </div>
          }
        </div>

        <!-- Pagination -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
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
              Page
              <span class="font-medium text-slate-900">{{ page() }}</span>
              of
              <span class="font-medium text-slate-900">{{ meta()?.last_page ?? 1 }}</span>
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

    <!-- Delete confirmation -->
    @if (carToDelete(); as c) {
      <div
        class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60"
        role="dialog"
        aria-modal="true"
      >
        <div class="bg-white rounded-2xl shadow-elevated max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-2">
            Delete "{{ c.name }}"?
          </h3>
          <p class="text-sm text-slate-600 mb-6">
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

  changePageSize(value: string | number): void {
    const next = Number(value);
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

  /** Typed cast for DOM event targets in templates (avoids `$any`). */
  asSelect(target: EventTarget | null): HTMLSelectElement {
    return target as HTMLSelectElement;
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
