import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, LanguageToggleComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-brand-600 to-brand-900"
    >
      <div class="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/10 text-white">
        <app-language-toggle />
        <div class="w-px h-4 bg-white/20"></div>
        <app-theme-toggle />
      </div>

      <div class="card w-full max-w-md">
        <router-outlet />
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
