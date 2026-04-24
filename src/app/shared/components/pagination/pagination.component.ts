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
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (lastPage() > 1 || showPageSize()) {
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm"
        [class.border-t]="bordered()"
        [class.border-slate-200]="bordered()"
        [class.dark:border-slate-800]="bordered()"
        [class.bg-slate-50]="bordered()"
        [class.dark:bg-slate-900]="bordered()"
        [class.px-4]="bordered()"
        [class.py-3]="bordered()"
      >
        <!-- Rows per page -->
        @if (showPageSize()) {
          <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <label for="per-page">{{ 'pagination.rows_per_page' | t }}</label>
            <select
              id="per-page"
              class="input w-20 py-1"
              [value]="perPage()"
              (change)="onPerPageChange($event)"
            >
              @for (size of pageSizes(); track size) {
                <option [value]="size">{{ size }}</option>
              }
            </select>
          </div>
        } @else {
          <div></div>
        }

        <!-- Page controls -->
        <div class="flex items-center gap-1 justify-center">
          @if (showFirstLast()) {
            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="page() === 1 || loading()"
              (click)="goTo(1)"
            >
              <span class="rtl:hidden">«</span>
              <span class="hidden rtl:inline">»</span>
            </button>
          }
          <button
            type="button"
            class="btn-ghost px-3 py-1"
            [disabled]="page() === 1 || loading()"
            (click)="goTo(page() - 1)"
          >
            {{ 'pagination.prev' | t }}
          </button>

          <span class="px-3 text-slate-600 dark:text-slate-400">
            {{
              'pagination.page_of'
                | t: { current: page(), last: lastPage() }
            }}
          </span>

          <button
            type="button"
            class="btn-ghost px-3 py-1"
            [disabled]="isLast() || loading()"
            (click)="goTo(page() + 1)"
          >
            {{ 'pagination.next' | t }}
          </button>
          @if (showFirstLast()) {
            <button
              type="button"
              class="btn-ghost px-3 py-1"
              [disabled]="isLast() || loading()"
              (click)="goTo(lastPage())"
            >
              <span class="rtl:hidden">»</span>
              <span class="hidden rtl:inline">«</span>
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class PaginationComponent {
  /** Current page (1-indexed). */
  readonly page = input.required<number>();
  /** Total number of pages. */
  readonly lastPage = input.required<number>();
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

  protected goTo(target: number): void {
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
