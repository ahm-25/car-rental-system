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
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
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
    ConfirmDialogComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ 'cars.title' | t }}</h1>
          <p class="page-subtitle">{{ 'cars.description' | t }}</p>
        </div>
        <div class="flex items-center gap-3">
          @if (meta(); as m) {
            <span class="hidden sm:inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg">
              {{ 'cars.showing' | t }}
              <span class="font-semibold text-slate-900 dark:text-slate-100 mx-1">{{ m.from ?? 0 }}–{{ m.to ?? 0 }}</span>
              {{ 'cars.of' | t }}
              <span class="font-semibold text-brand-600 dark:text-brand-400 ms-1">{{ m.total }}</span>
            </span>
          }
          <a routerLink="/admin/cars/new" class="btn-primary">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {{ 'cars.new_car' | t }}
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
            <label for="search" class="label">{{ 'cars.filters.search' | t }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <svg class="h-4 w-4 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="search"
                class="input ps-9"
                [placeholder]="'cars.filters.search_placeholder' | t"
                formControlName="search"
                autocomplete="off"
              />
            </div>
          </div>

          <div>
            <label for="brand" class="label">{{ 'cars.filters.brand' | t }}</label>
            <input
              id="brand"
              type="text"
              class="input"
              [placeholder]="'cars.filters.brand_placeholder' | t"
              formControlName="brand"
              autocomplete="off"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="min_price" class="label">{{ 'cars.filters.min_day' | t }}</label>
              <input
                id="min_price"
                type="number"
                min="0"
                step="1"
                class="input"
                placeholder="$0"
                formControlName="min_price"
              />
            </div>
            <div>
              <label for="max_price" class="label">{{ 'cars.filters.max_day' | t }}</label>
              <input
                id="max_price"
                type="number"
                min="0"
                step="1"
                class="input"
                placeholder="∞"
                formControlName="max_price"
              />
            </div>
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
            {{ 'cars.filters.reset' | t }}
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
          <button type="button" class="btn-secondary" (click)="load()">{{ 'common.retry' | t }}</button>
        </div>
      }

      <!-- Table -->
      <div class="table-wrap relative">
        <div class="relative overflow-x-auto min-h-[360px]">
          <table class="min-w-full text-sm">
            <thead class="thead">
              <tr>
                <th class="th">{{ 'cars.table.name' | t }}</th>
                <th class="th">{{ 'cars.table.brand_model' | t }}</th>
                <th class="th text-end">{{ 'cars.table.mileage' | t }}</th>
                <th class="th text-end">{{ 'cars.table.price_day' | t }}</th>
                <th class="th">{{ 'cars.table.added' | t }}</th>
                <th class="th text-end">{{ 'cars.table.actions' | t }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              @for (car of cars(); track car.id) {
                <tr class="tr-hover group">
                  <td class="td">
                    <div class="font-semibold text-slate-900 dark:text-slate-100">{{ car.name }}</div>
                  </td>
                  <td class="td">
                    <div class="text-slate-700 dark:text-slate-200 font-medium">{{ car.brand }}</div>
                    <div class="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{{ car.model }}</div>
                  </td>
                  <td class="td text-end">
                    <span class="badge-neutral">
                      {{ car.kilometers | number }} {{ 'cars.table.km' | t }}
                    </span>
                  </td>
                  <td class="td text-end">
                    <span class="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      $ {{ +car.price_per_day | number: '1.2-2' }}
                    </span>
                  </td>
                  <td class="td text-slate-500 dark:text-slate-400 font-medium">
                    {{ car.created_at | date: 'mediumDate' }}
                  </td>
                  <td class="td">
                    <div class="flex items-center justify-end gap-1">
                      <a
                        [routerLink]="['/admin/cars', car.id]"
                        class="icon-btn"
                        [title]="'cars.actions.view' | t"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </a>
                      <a
                        [routerLink]="['/admin/cars', car.id, 'edit']"
                        class="icon-btn-brand"
                        [title]="'cars.actions.edit' | t"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </a>
                      <button
                        type="button"
                        class="icon-btn-danger"
                        [title]="'cars.actions.delete' | t"
                        (click)="askDelete(car)"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                @if (!loading() && !error()) {
                  <tr>
                    <td colspan="6" class="px-6 py-16">
                      <div class="empty-state">
                        <div class="empty-state-icon">
                          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2" />
                          </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ 'cars.empty_title' | t }}</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 max-w-md">{{ 'cars.empty_subtitle' | t }}</p>
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

    @if (carToDelete(); as c) {
      <app-confirm-dialog
        [open]="true"
        [title]="'cars.delete_confirm.title' | t: { name: c.name }"
        [body]="'cars.delete_confirm.body' | t"
        [confirmLabel]="'cars.delete_confirm.delete' | t"
        [busyLabel]="'cars.delete_confirm.deleting' | t"
        [busy]="deleting()"
        tone="danger"
        (confirm)="submitDelete()"
        (cancel)="cancelDelete()"
      />
    }
  `,
})
export class AdminCarsComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AdminCarsService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lang = inject(LanguageService);

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
            this.lang.translate('cars.error_default'),
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
