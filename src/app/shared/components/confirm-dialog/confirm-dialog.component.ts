import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type ConfirmTone = 'danger' | 'primary';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [SpinnerComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
        role="dialog"
        aria-modal="true"
        (click)="onBackdrop($event)"
      >
        <div
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-elevated max-w-md w-full p-6 animate-scale-in"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start gap-4">
            <div
              class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
              [class.bg-red-50]="tone() === 'danger'"
              [class.text-red-600]="tone() === 'danger'"
              [class.dark:bg-red-500]="tone() === 'danger'"
              [class.dark:bg-opacity-15]="tone() === 'danger'"
              [class.dark:text-red-300]="tone() === 'danger'"
              [class.bg-brand-50]="tone() === 'primary'"
              [class.text-brand-600]="tone() === 'primary'"
              [class.dark:bg-brand-500]="tone() === 'primary'"
              [class.dark:text-brand-300]="tone() === 'primary'"
            >
              @if (tone() === 'danger') {
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
                </svg>
              } @else {
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              }
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">
                {{ title() }}
              </h3>
              <p class="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {{ body() }}
              </p>
            </div>
          </div>

          <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              class="btn-secondary"
              [disabled]="busy()"
              (click)="cancel.emit()"
            >
              {{ cancelLabel() || ('common.cancel' | t) }}
            </button>
            <button
              type="button"
              [class.btn-danger]="tone() === 'danger'"
              [class.btn-primary]="tone() === 'primary'"
              class="inline-flex items-center gap-2"
              [disabled]="busy()"
              (click)="confirm.emit()"
            >
              @if (busy()) {
                <app-spinner size="sm" />
                <span>{{ busyLabel() || ('common.loading' | t) }}</span>
              } @else {
                <span>{{ confirmLabel() }}</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly open = input.required<boolean>();
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input<string>('');
  readonly busyLabel = input<string>('');
  readonly busy = input<boolean>(false);
  readonly tone = input<ConfirmTone>('danger');

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  protected onBackdrop(event: MouseEvent): void {
    if (this.busy()) return;
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }
}
