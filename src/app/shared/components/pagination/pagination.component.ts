import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [TranslatePipe, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (lastPage() > 1 || showPageSize()) {
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-3.5"
        [ngClass]="bordered() ? 'border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 px-6' : ''"
      >
        <!-- Info / Page Size -->
        <div class="flex flex-wrap items-center gap-4 text-sm">
          @if (total() !== null) {
            <span class="text-slate-500 dark:text-slate-400 font-medium">
              @if (displayFrom() !== null && displayTo() !== null) {
                {{ 'pagination.showing_range' | t: { from: displayFrom(), to: displayTo(), total: total() ?? 0 } }}
              } @else {
                {{ 'pagination.total_items' | t: { total: total() ?? 0 } }}
              }
            </span>
          }

          @if (showPageSize()) {
            <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400 ms-auto lg:ms-0">
              <label for="per-page" class="text-xs font-medium">{{ 'pagination.rows_per_page' | t }}</label>
              <select
                id="per-page"
                class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-semibold tabular-nums focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition cursor-pointer"
                [value]="perPage()"
                (change)="onPerPageChange($event)"
              >
                @for (size of pageSizes(); track size) {
                  <option [value]="size">{{ size }}</option>
                }
              </select>
            </div>
          }
        </div>

        <!-- Page controls -->
        <div class="flex items-center justify-center gap-1">
          <!-- First -->
          @if (showFirstLast()) {
            <button
              type="button"
              class="pagination-btn"
              [disabled]="page() === 1 || loading()"
              (click)="goTo(1)"
              title="First page"
            >
              <svg class="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
              </svg>
            </button>
          }

          <!-- Prev -->
          <button
            type="button"
            class="pagination-btn"
            [disabled]="page() === 1 || loading()"
            (click)="goTo(page() - 1)"
            title="Previous page"
          >
            <svg class="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <!-- Pages -->
          <nav class="flex items-center gap-1 px-1" aria-label="Pagination">
            @for (p of pages(); track $index) {
              @if (p === '...') {
                <span class="w-9 h-9 flex items-center justify-center text-slate-400 font-medium">
                  &hellip;
                </span>
              } @else {
                <button
                  type="button"
                  class="pagination-page-btn"
                  [class.active]="p === page()"
                  [disabled]="loading()"
                  (click)="goTo(p)"
                  [attr.aria-current]="p === page() ? 'page' : null"
                >
                  {{ p }}
                </button>
              }
            }
          </nav>

          <!-- Next -->
          <button
            type="button"
            class="pagination-btn"
            [disabled]="isLast() || loading()"
            (click)="goTo(page() + 1)"
            title="Next page"
          >
            <svg class="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <!-- Last -->
          @if (showFirstLast()) {
            <button
              type="button"
              class="pagination-btn"
              [disabled]="isLast() || loading()"
              (click)="goTo(lastPage())"
              title="Last page"
            >
              <svg class="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .pagination-btn {
      @apply inline-flex w-9 h-9 items-center justify-center rounded-lg text-slate-500
             hover:text-slate-900 hover:bg-slate-100
             dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800
             transition-all duration-150 ease-smooth
             disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent;
    }
    .pagination-page-btn {
      @apply inline-flex w-9 h-9 items-center justify-center rounded-lg text-sm font-medium tabular-nums text-slate-600
             hover:text-slate-900 hover:bg-slate-100
             dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800
             transition-all duration-150 ease-smooth
             disabled:opacity-50;
    }
    .pagination-page-btn.active {
      @apply bg-brand-600 text-white hover:bg-brand-700 hover:text-white shadow-[0_4px_12px_-2px_rgb(79_70_229_/_0.35)]
             dark:bg-brand-500 dark:hover:bg-brand-400;
    }
  `]
})
export class PaginationComponent {
  /** Current page (1-indexed). */
  readonly page = input.required<number>();
  /** Total number of pages. */
  readonly lastPage = input.required<number>();
  /** Total items count for metadata display. */
  readonly total = input<number | null>(null);
  /** Showing from item index. */
  readonly from = input<number | null>(null);
  /** Showing to item index. */
  readonly to = input<number | null>(null);
  /** When true, disables navigation (spinner state). */
  readonly loading = input(false);
  /** Optional rows-per-page selector — pass both `pageSizes` and `perPage` to enable. */
  readonly pageSizes = input<readonly number[]>([]);
  readonly perPage = input<number | null>(null);
  /** Show First / Last arrow buttons (admin-dense variant). */
  readonly showFirstLast = input(false);
  /** Apply the card-footer styling (top border + bg). */
  readonly bordered = input(false);

  readonly pageChange = output<number>();
  readonly perPageChange = output<number>();

  protected readonly isLast = computed(() => this.page() >= this.lastPage());
  protected readonly showPageSize = computed(
    () => this.pageSizes().length > 0 && this.perPage() !== null,
  );

  protected readonly displayFrom = computed(() => {
    const f = this.from();
    if (f !== null) return f;
    const total = this.total();
    if (total === null || total === 0) return 0;
    return (this.page() - 1) * (this.perPage() ?? 0) + 1;
  });

  protected readonly displayTo = computed(() => {
    const t = this.to();
    if (t !== null) return t;
    const total = this.total();
    if (total === null) return 0;
    return Math.min(this.page() * (this.perPage() ?? 0), total);
  });

  protected readonly pages = computed(() => {
    const current = this.page();
    const last = this.lastPage();
    const delta = 1;
    const range: (number | string)[] = [];

    for (let i = 1; i <= last; i++) {
      if (
        i === 1 ||
        i === last ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }
    return range;
  });

  protected goTo(target: unknown): void {
    if (typeof target !== 'number') return;
    const clamped = Math.min(Math.max(1, target), this.lastPage());
    if (clamped === this.page()) return;
    this.pageChange.emit(clamped);
  }

  protected onPerPageChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (value && value !== this.perPage()) {
      this.perPageChange.emit(value);
    }
  }
}
