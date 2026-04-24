import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
    >
      @for (t of notify.items(); track t.id) {
        <div
          class="pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 text-sm shadow-elevated"
          [class.bg-white]="t.kind === 'info'"
          [class.border-slate-200]="t.kind === 'info'"
          [class.text-slate-800]="t.kind === 'info'"
          [class.bg-emerald-50]="t.kind === 'success'"
          [class.border-emerald-200]="t.kind === 'success'"
          [class.text-emerald-800]="t.kind === 'success'"
          [class.bg-amber-50]="t.kind === 'warning'"
          [class.border-amber-200]="t.kind === 'warning'"
          [class.text-amber-800]="t.kind === 'warning'"
          [class.bg-red-50]="t.kind === 'error'"
          [class.border-red-200]="t.kind === 'error'"
          [class.text-red-800]="t.kind === 'error'"
        >
          <div class="flex items-start gap-3">
            <span class="flex-1">{{ t.message }}</span>
            <button
              type="button"
              class="text-xs font-semibold uppercase tracking-wide opacity-70 hover:opacity-100"
              (click)="notify.dismiss(t.id)"
            >
              Close
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  protected readonly notify = inject(NotificationService);
}
