import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly lang = inject(LanguageService);

  transform(key: string, params?: Record<string, string | number>): string {
    // Read a signal so OnPush components re-render on language changes.
    this.lang.language();
    this.lang.translations();
    return this.lang.translate(key, params);
  }
}
