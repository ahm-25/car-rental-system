import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Car } from '../../../models/car.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { CustomerCarsService } from './customer-cars.service';

@Component({
  selector: 'app-car-details',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, SpinnerComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="mb-6 flex items-center gap-2 text-sm text-slate-500">
      <a routerLink="/cars" class="hover:text-brand-600 transition">{{ 'customer_cars.hero_title' | t }}</a>
      <span class="rtl:-scale-x-100">/</span>
      <span class="text-slate-900 font-medium">
        {{ car()?.name ?? ('common.loading' | t) }}
      </span>
    </nav>

    @if (loading()) {
      <div class="card flex items-center justify-center py-20">
        <app-spinner size="lg" />
      </div>
    } @else if (error()) {
      <div class="card flex flex-col items-center gap-3 py-16 text-center">
        <svg class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-medium text-slate-900">{{ error() }}</p>
        <div class="flex items-center gap-2 mt-2">
          <a routerLink="/cars" class="btn-secondary">{{ 'customer_cars.details.back' | t }}</a>
          <button type="button" class="btn-primary" (click)="load()">{{ 'common.retry' | t }}</button>
        </div>
      </div>
    } @else {
      @if (car(); as c) {
      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Left: Gallery + Info -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Showcase image -->
          <div
            class="aspect-[16/9] md:aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-brand-500 to-brand-900 shadow-sm border border-slate-200 relative"
          >
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.18),transparent_60%)]"></div>

            <div class="absolute inset-0 flex items-center justify-center">
              <svg class="h-40 w-40 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2M5 13v4a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-4" />
              </svg>
            </div>

            <div class="absolute bottom-8 left-8 right-8 text-white">
              <p class="text-sm uppercase tracking-[0.25em] opacity-80">
                {{ c.brand }}
              </p>
              <p class="text-4xl md:text-5xl font-black mt-2">{{ c.name }}</p>
              <p class="text-sm opacity-80 mt-1">{{ 'cars.fields.model' | t }} {{ c.model }}</p>
            </div>
          </div>

          <!-- Info card -->
          <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {{ c.name }}
                </h1>
                <p class="text-slate-500 dark:text-slate-400 text-lg">
                  {{ c.brand }} · {{ c.model }}
                </p>
              </div>
              <span
                class="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-sm font-semibold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50 whitespace-nowrap"
              >
                {{ 'customer_cars.details.available' | t }}
              </span>
            </div>

            <!-- Specs from API -->
            <div
              class="grid grid-cols-2 md:grid-cols-3 gap-4 py-6 border-y border-slate-100 dark:border-slate-800 mb-8"
            >
              <div class="flex flex-col gap-1">
                <span class="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  {{ 'cars.fields.brand' | t }}
                </span>
                <span class="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ c.brand }}
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  {{ 'cars.fields.model' | t }}
                </span>
                <span class="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ c.model }}
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  {{ 'customer_cars.details.mileage' | t }}
                </span>
                <span class="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {{ c.kilometers | number }} {{ 'customer_cars.kilometers' | t }}
                </span>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ 'customer_cars.details.about' | t }}</h3>
              <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
                {{ 'customer_cars.details.about_text' | t: {
                  brand: c.brand,
                  name: c.name,
                  model: c.model,
                  price: '$ ' + (+c.price_per_day | number: '1.2-2'),
                  date: (c.created_at | date: 'longDate') || ''
                } }}
              </p>
            </div>
          </div>
        </div>

        <!-- Right: sticky sidebar -->
        <div class="lg:col-span-1">
          <div
            class="sticky top-24 bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-200 dark:border-slate-800 p-6 sm:p-8"
          >
            <div class="pb-6 border-b border-slate-100 dark:border-slate-800">
              <span class="text-sm font-semibold text-brand-600 tracking-wider uppercase">
                {{ 'customer_cars.details.price_label' | t }}
              </span>
              <div class="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {{ +c.price_per_day | number: '1.2-2' }}
                <span class="text-lg text-slate-500 dark:text-slate-400 font-normal">{{ 'customer_cars.per_day' | t }}</span>
              </div>
            </div>

            <dl class="py-6 space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 dark:text-slate-400">ID</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">#{{ c.id }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 dark:text-slate-400">{{ 'customer_cars.details.mileage' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ c.kilometers | number }} {{ 'customer_cars.kilometers' | t }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 dark:text-slate-400">{{ 'cars.table.added' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ c.created_at | date: 'mediumDate' }}
                </dd>
              </div>
            </dl>

            <a
              [routerLink]="['/cars', c.id, 'book']"
              class="btn-primary w-full py-3 text-base font-semibold flex items-center justify-center"
            >
              {{ 'customer_cars.details.book' | t }}
            </a>
            <p class="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
              {{ 'customer_cars.details.book_hint' | t }}
            </p>
          </div>
        </div>
      </div>
      }
    }
  `,
})
export class CarDetailsComponent implements OnInit {
  private readonly service = inject(CustomerCarsService);
  private readonly lang = inject(LanguageService);

  @Input() id?: string;

  protected readonly car = signal<Car | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) {
      this.error.set(this.lang.translate('customer_cars.details.not_found'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.service.getById(this.id).subscribe({
      next: (car) => {
        this.car.set(car);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.car.set(null);
        if (err.status === 404) {
          this.error.set(this.lang.translate('customer_cars.details.not_found'));
        } else {
          this.error.set(
            (err.error as { message?: string } | null)?.message ??
              this.lang.translate('customer_cars.details.error_default'),
          );
        }
      },
    });
  }
}
