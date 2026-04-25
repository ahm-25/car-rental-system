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
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { CustomerCarsQuery, CustomerCarsService } from './customer-cars.service';

@Component({
  selector: 'app-cars-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, SpinnerComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-10 animate-fade-in-up">
      <!-- Hero -->
      <header
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900 text-white"
      >
        <div class="absolute inset-y-0 end-0 w-1/2 bg-gradient-to-l from-brand-500/15 to-transparent pointer-events-none"></div>
        <div class="absolute -top-24 -end-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="bg-grid absolute inset-0 opacity-[0.15] pointer-events-none"></div>

        <div class="relative px-6 sm:px-10 py-12 sm:py-16 max-w-3xl">
          <span class="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm mb-5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {{ 'customer_cars.details.available' | t }}
          </span>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white text-balance">
            {{ 'customer_cars.hero_title' | t }}
          </h1>
          <p class="mt-4 text-base sm:text-lg text-white max-w-xl text-pretty opacity-90">
            {{ 'customer_cars.hero_subtitle' | t }}
          </p>
        </div>
      </header>

      <!-- Filters -->
      <form
        [formGroup]="filters"
        (ngSubmit)="load()"
        class="card grid gap-4 md:grid-cols-4 lg:grid-cols-5 items-end -mt-16 relative z-10 mx-2 sm:mx-4 shadow-elevated"
      >
        <div class="md:col-span-1 lg:col-span-1">
          <label class="label">{{ 'customer_cars.filters.search' | t }}</label>
          <input
            type="text"
            formControlName="search"
            [placeholder]="'customer_cars.filters.search_placeholder' | t"
            class="input"
          />
        </div>
        <div>
          <label class="label">{{ 'customer_cars.filters.brand' | t }}</label>
          <input
            type="text"
            formControlName="brand"
            [placeholder]="'customer_cars.filters.brand_placeholder' | t"
            class="input"
          />
        </div>
        <div>
          <label class="label">{{ 'customer_cars.filters.min_price' | t }}</label>
          <input
            type="number"
            formControlName="min_price"
            placeholder="0"
            min="0"
            class="input"
          />
        </div>
        <div>
          <label class="label">{{ 'customer_cars.filters.max_price' | t }}</label>
          <input
            type="number"
            formControlName="max_price"
            placeholder="1000"
            min="0"
            class="input"
          />
        </div>
        <div class="md:col-span-4 lg:col-span-1">
          <button
            type="submit"
            class="btn-primary w-full py-3"
            [disabled]="loading()"
          >
            @if (loading()) {
              <app-spinner size="sm" />
              <span>{{ 'customer_cars.searching' | t }}...</span>
            } @else {
              <svg class="w-4 h-4 rtl:-scale-x-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{{ 'customer_cars.search' | t }}</span>
            }
          </button>
        </div>
      </form>

      <!-- Grid -->
      <div>
        <div class="flex items-end justify-between mb-6">
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {{ 'customer_cars.available_title' | t }}
          </h2>
          @if (!loading()) {
            <p class="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              {{ cars().length }} {{ cars().length === 1 ? ('customer_cars.result' | t) : ('customer_cars.results' | t) }}
            </p>
          }
        </div>

        @if (error()) {
          <div class="card empty-state">
            <div class="empty-state-icon text-red-500">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-base font-medium text-slate-900 dark:text-slate-100">{{ error() }}</p>
            <button (click)="load()" class="btn-primary">{{ 'customer_cars.retry' | t }}</button>
          </div>
        } @else if (loading() && cars().length === 0) {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (i of skeletons; track i) {
              <div class="card p-4">
                <div class="skeleton w-full h-48 mb-5"></div>
                <div class="skeleton h-5 w-1/3 mb-3"></div>
                <div class="skeleton h-4 w-2/3 mb-6"></div>
                <div class="skeleton h-10 w-full"></div>
              </div>
            }
          </div>
        } @else {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (car of cars(); track car.id; let i = $index) {
              <div
                class="group card-interactive p-4 flex flex-col animate-fade-in-up"
                [style.animation-delay.ms]="i * 40"
              >
                <div class="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 mb-5">
                  <div class="absolute inset-0 bg-gradient-to-tr from-brand-500/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div class="absolute inset-0 flex items-center justify-center p-8 transition-transform duration-500 group-hover:scale-110">
                    <svg class="w-full h-full text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2M5 13v4a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-4" />
                    </svg>
                  </div>
                  <div class="absolute top-3 end-3 bg-slate-950/90 backdrop-blur-sm text-white rounded-lg px-3 py-1.5 text-sm font-semibold">
                    $ {{ +car.price_per_day | number: '1.0-0' }}
                    <span class="text-[10px] font-medium text-slate-300 ms-0.5">{{ 'customer_cars.per_day' | t }}</span>
                  </div>
                </div>

                <div class="flex-1 flex flex-col">
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <span class="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-[0.1em]">{{ car.brand }}</span>
                    <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ car.model }}</span>
                  </div>
                  <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                    {{ car.name }}
                  </h3>

                  <div class="flex items-center gap-4 mt-3 mb-5 text-xs text-slate-500 dark:text-slate-400">
                    <span class="inline-flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {{ car.kilometers | number }} {{ 'customer_cars.kilometers' | t }}
                    </span>
                    <span class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {{ 'customer_cars.details.available' | t }}
                    </span>
                  </div>

                  <a
                    [routerLink]="['/cars', car.id]"
                    class="btn-secondary mt-auto w-full"
                  >
                    {{ 'customer_cars.details.header' | t }}
                    <svg class="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            } @empty {
              <div class="sm:col-span-2 lg:col-span-3 card empty-state">
                <div class="empty-state-icon">
                  <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2M5 13v4a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-4" />
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ 'customer_cars.empty_title' | t }}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 max-w-md">{{ 'customer_cars.empty_subtitle' | t }}</p>
                <button (click)="resetFilters()" class="btn-secondary mt-1">
                  {{ 'customer_cars.clear_filters' | t }}
                </button>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class CarsListComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(CustomerCarsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lang = inject(LanguageService);

  protected readonly skeletons = [0, 1, 2, 3, 4, 5] as const;

  protected readonly filters = this.fb.group({
    search: this.fb.control(''),
    brand: this.fb.control(''),
    min_price: this.fb.control<number | null>(null),
    max_price: this.fb.control<number | null>(null),
  });

  protected readonly cars = signal<Car[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly hasActiveFilters = computed(() => {
    const current = this.filters.getRawValue();
    return (
      !!current.search ||
      !!current.brand ||
      current.min_price !== null ||
      current.max_price !== null
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    const v = this.filters.getRawValue();
    const query: CustomerCarsQuery = {
      search: v.search || undefined,
      brand: v.brand || undefined,
      min_price: v.min_price ?? undefined,
      max_price: v.max_price ?? undefined,
    };

    this.service.list(query).subscribe({
      next: (res) => {
        this.cars.set(res.data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          (err.error as { message?: string } | null)?.message ??
            this.lang.translate('customer_cars.error_default'),
        );
      },
    });
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
