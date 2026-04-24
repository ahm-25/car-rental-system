import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

const TONE_CLASSES: Record<string, string> = {
  info: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100',
  success:
    'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
  warning:
    'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
  error:
    'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
};

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [NgClass, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
    >
      @for (t of notify.items(); track t.id) {
        <div
          class="pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 text-sm shadow-elevated"
          [ngClass]="toneClass(t.kind)"
        >
          <div class="flex items-start gap-3">
            <span class="flex-1">{{ t.message }}</span>
            <button
              type="button"
              class="text-xs font-semibold uppercase tracking-wide opacity-70 hover:opacity-100"
              (click)="notify.dismiss(t.id)"
            >
              {{ 'toast.close' | t }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  protected readonly notify = inject(NotificationService);

  toneClass(kind: string): string {
    return TONE_CLASSES[kind] ?? TONE_CLASSES['info'];
  }
}
