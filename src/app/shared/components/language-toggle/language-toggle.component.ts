import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="inline-flex h-10 items-center gap-1.5 px-3 rounded-lg text-sm font-medium hover:bg-white/10 dark:hover:bg-slate-800 transition-colors"
      [attr.aria-label]="'language.switch' | t"
      (click)="lang.toggle()"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9l5-5 2 5M10 22L20 12" />
      </svg>
      <span>
        {{ lang.language() === 'en' ? ('language.arabic' | t) : ('language.english' | t) }}
      </span>
    </button>
  `,
})
export class LanguageToggleComponent {
  protected readonly lang = inject(LanguageService);
}
