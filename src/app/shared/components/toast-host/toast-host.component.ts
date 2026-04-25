import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

const TONE_CLASSES: Record<string, string> = {
  info: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100',
  success:
    'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-100',
  warning:
    'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/60 text-slate-800 dark:text-slate-100',
  error:
    'bg-white dark:bg-slate-900 border-red-200 dark:border-red-800/60 text-slate-800 dark:text-slate-100',
};

const ACCENT_CLASSES: Record<string, string> = {
  info: 'bg-slate-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

const ICON_CLASSES: Record<string, string> = {
  info: 'text-slate-500 dark:text-slate-400',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
};

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [NgClass, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2.5 px-4 sm:items-end sm:pe-6"
      aria-live="polite"
      role="status"
    >
      @for (t of notify.items(); track t.id) {
        <div
          class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-elevated animate-slide-in-right"
          [ngClass]="toneClass(t.kind)"
        >
          <div class="flex items-stretch">
            <div class="w-1 shrink-0" [ngClass]="accentClass(t.kind)"></div>
            <div class="flex items-start gap-3 flex-1 px-4 py-3.5">
              <span
                class="mt-0.5 inline-flex h-5 w-5 items-center justify-center shrink-0"
                [ngClass]="iconClass(t.kind)"
              >
                @switch (t.kind) {
                  @case ('success') {
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  @case ('error') {
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  @case ('warning') {
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
                    </svg>
                  }
                  @default {
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  }
                }
              </span>
              <p class="flex-1 text-sm font-medium leading-5">{{ t.message | t }}</p>
              <button
                type="button"
                class="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                [attr.aria-label]="'toast.close' | t"
                (click)="notify.dismiss(t.id)"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  protected readonly notify = inject(NotificationService);

  protected toneClass(kind: string): string {
    return TONE_CLASSES[kind] ?? TONE_CLASSES['info'];
  }

  protected accentClass(kind: string): string {
    return ACCENT_CLASSES[kind] ?? ACCENT_CLASSES['info'];
  }

  protected iconClass(kind: string): string {
    return ICON_CLASSES[kind] ?? ICON_CLASSES['info'];
  }
}
