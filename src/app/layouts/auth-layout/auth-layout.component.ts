import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    LanguageToggleComponent,
    ThemeToggleComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen grid lg:grid-cols-2 bg-surface-muted dark:bg-slate-950 transition-colors duration-700">
      <!-- Decorative panel (hidden on mobile) -->
      <aside
        class="hidden lg:flex relative overflow-hidden text-white p-12 xl:p-16 bg-slate-950"
      >
        <!-- Light mode gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 transition-opacity duration-700 ease-in-out dark:opacity-0"></div>
        <!-- Dark mode gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-slate-950 via-brand-950 to-brand-900 opacity-0 transition-opacity duration-700 ease-in-out dark:opacity-100"></div>

        <div class="absolute inset-0 bg-grid opacity-10 pointer-events-none z-0"></div>
        <div class="absolute top-0 end-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none z-0"></div>
        <div class="absolute bottom-0 start-0 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none z-0"></div>

        <div class="relative z-10 flex flex-col w-full h-full">
          <a routerLink="/" class="flex items-center gap-2.5 group">
            <span class="inline-flex h-9 w-9 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15 items-center justify-center group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <span class="text-lg font-bold tracking-tight">
              {{ 'common.company_name' | t }}<span class="text-brand-400">.</span>
            </span>
          </a>

          <div class="flex-1 flex flex-col justify-center max-w-lg">
            <span class="inline-flex self-start items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm mb-5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {{ 'auth.panel_badge' | t }}
            </span>
            <h2 class="text-3xl xl:text-4xl font-bold tracking-tight leading-tight text-balance">
              {{ 'auth.panel_heading' | t }}
            </h2>
            <p class="mt-4 text-base text-white/70 text-pretty">
              {{ 'auth.panel_sub' | t }}
            </p>

            <ul class="mt-10 space-y-3 text-sm">
              <li class="flex items-start gap-3 text-white/85">
                <span class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/25 ring-1 ring-brand-400/30 text-brand-300">
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {{ 'auth.panel_point_1' | t }}
              </li>
              <li class="flex items-start gap-3 text-white/85">
                <span class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/25 ring-1 ring-brand-400/30 text-brand-300">
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {{ 'auth.panel_point_2' | t }}
              </li>
              <li class="flex items-start gap-3 text-white/85">
                <span class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/25 ring-1 ring-brand-400/30 text-brand-300">
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {{ 'auth.panel_point_3' | t }}
              </li>
            </ul>
          </div>

          <p class="relative text-xs text-white/50">
            {{ 'footer.copyright' | t: { year: year } }}
          </p>
        </div>
      </aside>

      <!-- Form panel -->
      <main class="relative flex items-center justify-center p-6 sm:p-10">
        <div class="absolute top-4 end-4 flex items-center gap-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 text-slate-600 dark:text-slate-300">
          <app-language-toggle />
          <app-theme-toggle />
        </div>

        <div class="w-full max-w-md animate-fade-in-up">
          <a routerLink="/" class="lg:hidden inline-flex items-center gap-2.5 mb-8">
            <span class="inline-flex h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand-glow items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <span class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {{ 'common.company_name' | t }}<span class="text-brand-600 dark:text-brand-400">.</span>
            </span>
          </a>

          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class AuthLayoutComponent {
  protected readonly year = new Date().getFullYear();
}
