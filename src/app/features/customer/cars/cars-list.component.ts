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
    <section class="flex flex-col gap-12">
      <!-- Hero / Header -->
      <header class="relative py-16 px-8 rounded-[3rem] overflow-hidden bg-slate-950 text-white">
        <!-- Abstract Decoration -->
        <div class="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-600/20 to-transparent pointer-events-none"></div>
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div class="relative z-10 max-w-2xl">
          <h1 class="text-5xl md:text-6xl font-black tracking-tight leading-[1.1]">
            {{ 'customer_cars.hero_title' | t }}
          </h1>
          <p class="mt-6 text-lg text-slate-400 font-medium max-w-lg">
            {{ 'customer_cars.hero_subtitle' | t }}
          </p>
        </div>
      </header>

      <!-- Search & Filters Bar -->
      <div class="sticky top-20 z-30 -mt-20 px-4 md:px-8">
        <form
          [formGroup]="filters"
          (submit)="$event.preventDefault()"
          class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-3xl p-4 md:p-6 grid gap-4 md:grid-cols-4 lg:grid-cols-5 items-end"
        >
          <div class="md:col-span-1 lg:col-span-1">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              {{ 'customer_cars.filters.search' | t }}
            </label>
            <div class="relative">
              <input
                type="text"
                formControlName="search"
                [placeholder]="'customer_cars.filters.search_placeholder' | t"
                class="w-full bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 focus:ring-brand-500/20 rounded-2xl px-4 py-3.5 text-sm font-medium"
              />
            </div>
          </div>

          <div>
             <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              {{ 'customer_cars.filters.brand' | t }}
            </label>
            <input
              type="text"
              formControlName="brand"
              [placeholder]="'customer_cars.filters.brand_placeholder' | t"
              class="w-full bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 focus:ring-brand-500/20 rounded-2xl px-4 py-3.5 text-sm font-medium"
            />
          </div>

          <div>
             <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              {{ 'customer_cars.filters.min_price' | t }}
            </label>
            <input
              type="number"
              formControlName="min_price"
              placeholder="0"
              class="w-full bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 focus:ring-brand-500/20 rounded-2xl px-4 py-3.5 text-sm font-medium"
            />
          </div>

          <div>
             <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              {{ 'customer_cars.filters.max_price' | t }}
            </label>
            <input
              type="number"
              formControlName="max_price"
              placeholder="1000"
              class="w-full bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 focus:ring-brand-500/20 rounded-2xl px-4 py-3.5 text-sm font-medium"
            />
          </div>

          <div class="md:col-span-4 lg:col-span-1">
            <button
              type="button"
              (click)="load()"
              class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              [disabled]="loading()"
            >
              @if (loading()) {
                <app-spinner size="sm" />
                <span>{{ 'customer_cars.searching' | t }}...</span>
              } @else {
               <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>{{ 'customer_cars.search' | t }}</span>
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Main Grid Area -->
      <div class="px-4">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
            {{ 'customer_cars.available_title' | t }}
            <span class="text-brand-600 ml-2">.</span>
          </h2>
          @if (!loading()) {
            <p class="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {{ cars().length }} {{ cars().length === 1 ? ('customer_cars.result' | t) : ('customer_cars.results' | t) }}
            </p>
          }
        </div>

        @if (error()) {
          <div class="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-3xl p-12 text-center">
            <p class="text-red-900 dark:text-red-400 font-bold mb-4">{{ error() }}</p>
            <button (click)="load()" class="btn-primary px-8">{{ 'customer_cars.retry' | t }}</button>
          </div>
        } @else if (loading() && cars().length === 0) {
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             @for (i of [1,2,3,4,5,6]; track i) {
               <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 h-[440px] animate-pulse border border-slate-100 dark:border-slate-800">
                  <div class="w-full h-56 bg-slate-100 dark:bg-slate-800 rounded-[2rem] mb-6"></div>
                  <div class="h-8 bg-slate-100 dark:bg-slate-800 rounded-full w-2/3 mb-4"></div>
                  <div class="h-4 bg-slate-50 dark:bg-slate-900 rounded-full w-1/2 mb-8"></div>
                  <div class="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>
               </div>
             }
          </div>
        } @else {
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (car of cars(); track car.id) {
              <div
                class="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 border border-slate-100 dark:border-slate-800 hover:border-brand-500/30 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 relative"
              >
                <!-- Image Container -->
                <div class="relative w-full h-56 rounded-[2rem] overflow-hidden bg-slate-50 dark:bg-slate-800 mb-6">
                  <div class="absolute inset-0 bg-gradient-to-tr from-brand-600/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div class="absolute inset-0 flex items-center justify-center p-8 transform group-hover:scale-110 transition-transform duration-700">
                    <svg class="w-full h-full text-slate-200 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2M5 13v4a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-4" />
                    </svg>
                  </div>
                  <!-- Floating Price Tag -->
                  <div class="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md text-white rounded-2xl px-4 py-2 text-sm font-black tracking-tight">
                    $ {{ +car.price_per_day | number: '1.0-0' }}<span class="text-[10px] text-slate-400 font-medium ml-1">{{ 'customer_cars.per_day' | t }}</span>
                  </div>
                </div>

                <div class="px-2">
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <span class="text-[10px] font-black text-brand-600 uppercase tracking-widest">{{ car.brand }}</span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ car.model }}</span>
                  </div>
                  <h3 class="text-2xl font-black text-slate-900 dark:text-slate-100 group-hover:text-brand-600 transition-colors mb-4 line-clamp-1">
                    {{ car.name }}
                  </h3>

                  <div class="grid grid-cols-2 gap-4 mb-8">
                     <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        <span class="text-xs font-bold">{{ car.kilometers }} {{ 'customer_cars.kilometers' | t }}</span>
                     </div>
                     <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                        <span class="text-xs font-bold text-emerald-500 uppercase">{{ 'customer_cars.details.available' | t }}</span>
                     </div>
                  </div>

                  <a
                    [routerLink]="['/cars', car.id]"
                    class="block w-full bg-slate-50 dark:bg-slate-800 group-hover:bg-brand-600 text-slate-950 dark:text-slate-100 group-hover:text-white font-black py-4 rounded-2xl text-center transition-all duration-300"
                  >
                    {{ ('customer_cars.details.header' | t) || 'Details' }}
                  </a>
                </div>
              </div>
            } @empty {
              <div class="md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                 <div class="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg class="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2M5 13v4a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-4" /></svg>
                 </div>
                 <h3 class="text-3xl font-black text-slate-900 dark:text-slate-100 mb-4">{{ 'customer_cars.empty_title' | t }}</h3>
                 <p class="text-slate-500 font-medium max-w-md mx-auto mb-8">{{ 'customer_cars.empty_subtitle' | t }}</p>
                 <button (click)="resetFilters()" class="text-brand-600 font-black uppercase tracking-widest text-sm hover:text-brand-700 transition-colors">
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

    this.filters.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(
          (a, b) => JSON.stringify(a) === JSON.stringify(b),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.load());
  }

  load(): void {
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
