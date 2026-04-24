import { DecimalPipe } from '@angular/common';
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
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Car } from '../../../models/car.model';
import { PaginationMeta } from '../../../models/pagination.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import {
  CustomerCarsQuery,
  CustomerCarsService,
} from './customer-cars.service';

@Component({
  selector: 'app-cars-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
    SpinnerComponent,
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero -->
    <section class="relative">
      <div class="absolute inset-0 bg-brand-900 rounded-[3rem] overflow-hidden shadow-2xl shadow-brand-900/40">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,_rgba(99,102,241,0.25),transparent)]"></div>
        <div class="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-brand-400/10 rounded-full blur-[100px]"></div>
        <svg class="absolute inset-0 w-full h-full opacity-[0.05]" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
          <path d="M0 100 L100 0" stroke="white" stroke-width="0.2" />
          <path d="M0 80 L80 0" stroke="white" stroke-width="0.2" />
          <path d="M20 100 L100 20" stroke="white" stroke-width="0.2" />
        </svg>
      </div>

      <div class="relative py-28 md:py-36 px-6 sm:px-12 max-w-5xl mx-auto text-center">
        <h1 class="text-6xl md:text-8xl font-black tracking-tight text-white leading-tight mb-8">
          Find Your <span class="text-brand-400">Perfect</span> Ride
        </h1>
        <p class="text-brand-100/80 text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed">
          Premium car rental experience for your next journey.
        </p>
      </div>
    </section>

    <!-- Search Bar -->
    <form
      [formGroup]="filters"
      class="relative z-40 -mt-16 mx-auto w-[96%] max-w-6xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_100px_-15px_rgba(0,0,0,0.6)] p-4 md:p-6 border border-slate-100 dark:border-slate-800 mb-16"
      (submit)="$event.preventDefault(); search()"
    >
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">

        <!-- Search -->
        <div class="flex-[1.4] p-6 group transition-all duration-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 first:rounded-t-[2.5rem] lg:first:rounded-l-[2.5rem] lg:first:rounded-tr-none">
          <label class="block text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.25em] mb-4">
            Search
          </label>
          <div class="relative flex items-center">
            <div class="absolute left-0 w-12 h-12 bg-brand-100/50 dark:bg-brand-500/15 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 transition-all group-hover:bg-brand-600 group-hover:text-white dark:group-hover:bg-brand-500">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              class="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 text-2xl font-bold pl-16 placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="Name or model"
              formControlName="search"
              autocomplete="off"
            />
          </div>
        </div>

        <!-- Brand -->
        <div class="flex-1 p-6 transition-all duration-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
          <label class="block text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.25em] mb-4">
            Brand
          </label>
          <div class="relative flex items-center">
            <div class="absolute left-0 text-slate-400 dark:text-slate-500">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14" />
              </svg>
            </div>
            <input
              type="text"
              class="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 text-lg font-bold pl-10 placeholder:text-slate-300 dark:placeholder:text-slate-600 min-h-[48px]"
              placeholder="e.g. Toyota"
              formControlName="brand"
              autocomplete="off"
            />
          </div>
        </div>

        <!-- Price range -->
        <div class="flex-[1.4] flex divide-x divide-slate-100 dark:divide-slate-800 h-full">
          <div class="flex-1 p-6 transition-all duration-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
            <label class="block text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.25em] mb-4">
              Min / day
            </label>
            <input
              type="number"
              min="0"
              step="1"
              class="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 text-lg font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 min-h-[48px]"
              placeholder="0"
              formControlName="min_price"
            />
          </div>
          <div class="flex-1 p-6 transition-all duration-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 last:rounded-b-[2.5rem] lg:last:rounded-br-[2.5rem] lg:last:rounded-tr-none">
            <label class="block text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.25em] mb-4">
              Max / day
            </label>
            <input
              type="number"
              min="0"
              step="1"
              class="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 text-lg font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 min-h-[48px]"
              placeholder="∞"
              formControlName="max_price"
            />
          </div>
        </div>

        <!-- Button -->
        <div class="p-4 lg:p-6 flex items-center justify-center">
          <button
            type="submit"
            class="w-full lg:w-48 bg-brand-600 hover:bg-brand-700 text-white px-8 py-6 rounded-[2.5rem] font-black text-lg shadow-2xl shadow-brand-500/40 transition-all duration-300 hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            [disabled]="loading()"
          >
            @if (loading()) {
              <app-spinner size="sm" />
              Searching
            } @else {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            }
          </button>
        </div>
      </div>
    </form>

    <!-- Header -->
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Available cars</h2>
        @if (meta(); as m) {
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {{ m.total }} {{ m.total === 1 ? 'result' : 'results' }}
          </p>
        }
      </div>
      @if (hasActiveFilters()) {
        <button
          type="button"
          class="btn-secondary gap-2"
          (click)="resetFilters()"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear filters
        </button>
      }
    </div>

    <!-- Error -->
    @if (error()) {
      <div
        class="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300 mb-6"
      >
        <p class="flex-1 font-medium">{{ error() }}</p>
        <button type="button" class="btn-secondary" (click)="load()">Retry</button>
      </div>
    }

    <!-- Grid -->
    <div class="relative min-h-[240px]">
      @if (cars().length === 0 && !loading() && !error()) {
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <svg class="h-14 w-14 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14" />
          </svg>
          <p class="text-lg font-semibold text-slate-800 dark:text-slate-100">No cars match your search</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters.</p>
          @if (hasActiveFilters()) {
            <button type="button" class="btn-secondary mt-4" (click)="resetFilters()">
              Clear filters
            </button>
          }
        </div>
      } @else {
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          @for (car of cars(); track car.id) {
            <article
              class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm dark:shadow-none hover:shadow-xl dark:hover:shadow-brand-500/10 hover:-translate-y-1.5 transition-all duration-300"
            >
              <a
                [routerLink]="['/cars', car.id]"
                class="relative h-56 bg-gradient-to-br from-brand-500 to-brand-900 overflow-hidden block group"
              >
                <div class="absolute inset-0 flex items-center justify-center">
                  <svg class="h-24 w-24 text-white/30 transition-transform duration-700 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2M5 13v4a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-4" />
                  </svg>
                </div>
                <div
                  class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm"
                >
                  {{ car.model }}
                </div>
                <div class="absolute bottom-4 left-4 right-4 text-white">
                  <p class="text-xs uppercase tracking-wider opacity-80">
                    {{ car.brand }}
                  </p>
                  <p class="text-xl font-bold truncate">{{ car.name }}</p>
                </div>
              </a>

              <div class="p-6 flex flex-col flex-1">
                <div class="mb-4">
                  <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 leading-tight">
                    <a
                      [routerLink]="['/cars', car.id]"
                      class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      {{ car.name }}
                    </a>
                  </h3>
                  <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ car.brand }}</p>
                </div>

                <div class="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mb-6 py-4 border-y border-slate-100 dark:border-slate-800">
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-brand-500 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span class="font-medium">
                      {{ car.kilometers | number }} km
                    </span>
                  </div>
                </div>

                <div class="mt-auto flex items-end justify-between">
                  <div class="flex flex-col">
                    <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                      Price
                    </span>
                    <div class="flex items-baseline gap-1">
                      <span class="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {{ +car.price_per_day | number: '1.2-2' }}
                      </span>
                      <span class="text-sm font-medium text-slate-500 dark:text-slate-400">/day</span>
                    </div>
                  </div>
                  <a
                    [routerLink]="['/cars', car.id]"
                    class="px-5 py-2.5 bg-slate-900 dark:bg-brand-600 hover:bg-brand-600 dark:hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
                  >
                    Details
                  </a>
                </div>
              </div>
            </article>
          }
        </div>
      }

      @if (loading()) {
        <div
          class="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-sm rounded-2xl"
        >
          <app-spinner size="lg" />
        </div>
      }
    </div>

    <!-- Pagination -->
    <div class="mt-12 flex justify-center">
      <app-pagination
        [page]="page()"
        [lastPage]="meta()?.last_page ?? 1"
        [total]="meta()?.total ?? null"
        [from]="meta()?.from ?? null"
        [to]="meta()?.to ?? null"
        [loading]="loading()"
        (pageChange)="goToPage($event)"
      />
    </div>
  `,
})
export class CarsListComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(CustomerCarsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly filters = this.fb.group({
    search: this.fb.control(''),
    brand: this.fb.control(''),
    min_price: this.fb.control<number | null>(null),
    max_price: this.fb.control<number | null>(null),
  });

  protected readonly page = signal(1);
  protected readonly perPage = signal(12);

  protected readonly cars = signal<Car[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly isLastPage = computed(() => {
    const m = this.meta();
    return !m || this.page() >= m.last_page;
  });

  protected readonly hasActiveFilters = computed(() => {
    const v = this.filters.getRawValue();
    return (
      !!v.search || !!v.brand || v.min_price !== null || v.max_price !== null
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
    const query: CustomerCarsQuery = {
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

  search(): void {
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    const last = this.meta()?.last_page ?? 1;
    const next = Math.min(Math.max(1, page), last);
    if (next === this.page()) return;
    this.page.set(next);
    this.load();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  resetFilters(): void {
    this.filters.reset({
      search: '',
      brand: '',
      min_price: null,
      max_price: null,
    });
  }
}
