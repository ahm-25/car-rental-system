import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface NavItem {
  labelKey: string;
  path: string;
  requiresAuth: boolean;
}

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ThemeToggleComponent,
    LanguageToggleComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-full flex flex-col bg-surface-muted dark:bg-slate-950">
      <header class="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div class="container-app flex h-16 items-center gap-3">
          <a routerLink="/" class="flex items-center gap-2.5 group">
            <span class="inline-flex h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand-glow items-center justify-center group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <span class="hidden sm:inline text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {{ 'common.company_name' | t }}<span class="text-brand-600 dark:text-brand-400">.</span>
            </span>
          </a>

          <nav class="hidden md:flex items-center gap-0.5 ms-4">
            @for (item of visibleNav(); track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="!bg-brand-50 !text-brand-700 dark:!bg-brand-500/15 dark:!text-brand-300"
                class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-150"
              >
                {{ item.labelKey | t }}
              </a>
            }

            @if (auth.hasRole('admin')) {
              <a
                routerLink="/admin/users"
                class="ms-1 px-3 py-2 rounded-lg text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-all"
              >
                {{ 'nav.admin_panel' | t }}
              </a>
            }
          </nav>

          <div class="flex-1"></div>

          <div class="hidden md:flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <app-language-toggle />
            <app-theme-toggle />
          </div>

          <div class="hidden md:flex items-center gap-2 ms-1">
            @if (auth.isAuthenticated()) {
              <div class="flex items-center gap-2.5 ps-3 border-s border-slate-200 dark:border-slate-800">
                <div class="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-semibold">
                  {{ initials() }}
                </div>
                <span class="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[140px] truncate">
                  {{ auth.user()?.name }}
                </span>
                <button type="button" class="btn-ghost text-sm" (click)="logout()">
                  {{ 'nav.logout' | t }}
                </button>
              </div>
            } @else {
              <a routerLink="/login" class="btn-ghost">{{ 'nav.login' | t }}</a>
              <a routerLink="/register" class="btn-primary">{{ 'nav.register' | t }}</a>
            }
          </div>

          <div class="md:hidden flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <app-language-toggle />
            <app-theme-toggle />
          </div>

          <button
            type="button"
            class="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            [attr.aria-expanded]="menuOpen()"
            aria-label="Toggle navigation"
            (click)="toggleMenu()"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (menuOpen()) {
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
              } @else {
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              }
            </svg>
          </button>
        </div>

        @if (menuOpen()) {
          <div class="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 animate-fade-in-down">
            <nav class="container-app py-3 flex flex-col gap-1">
              @for (item of visibleNav(); track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="!bg-brand-50 !text-brand-700 dark:!bg-brand-500/15 dark:!text-brand-300"
                  class="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  (click)="closeMenu()"
                >
                  {{ item.labelKey | t }}
                </a>
              }

              @if (auth.hasRole('admin')) {
                <a
                  routerLink="/admin/users"
                  class="px-3 py-2.5 rounded-lg text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/30"
                  (click)="closeMenu()"
                >
                  {{ 'nav.admin_panel' | t }}
                </a>
              }

              <div class="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                @if (auth.isAuthenticated()) {
                  <button type="button" class="btn-secondary" (click)="logout(); closeMenu()">
                    {{ 'nav.logout' | t }}
                  </button>
                } @else {
                  <a routerLink="/login" class="btn-secondary" (click)="closeMenu()">
                    {{ 'nav.login' | t }}
                  </a>
                  <a routerLink="/register" class="btn-primary" (click)="closeMenu()">
                    {{ 'nav.register' | t }}
                  </a>
                }
              </div>
            </nav>
          </div>
        }
      </header>

      <main class="flex-1">
        <div class="container-app py-6 sm:py-8 lg:py-10">
          <router-outlet />
        </div>
      </main>

      <footer class="border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm mt-auto">
        <div class="container-app py-5 text-xs text-slate-500 dark:text-slate-500 flex items-center justify-between">
          <span>{{ 'footer.copyright' | t: { year: year } }}</span>
          <span class="hidden sm:inline text-slate-400 dark:text-slate-600">
            {{ 'common.company_name' | t }} · Premium mobility
          </span>
        </div>
      </footer>
    </div>
  `,
})
export class CustomerLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  private readonly nav: NavItem[] = [
    { labelKey: 'nav.cars', path: '/cars', requiresAuth: false },
    { labelKey: 'nav.orders', path: '/orders', requiresAuth: true },
    { labelKey: 'nav.installments', path: '/installments', requiresAuth: true },
  ];

  protected readonly visibleNav = computed(() =>
    this.nav.filter((item) => !item.requiresAuth || this.auth.isAuthenticated()),
  );

  protected readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join('') || '?'
    );
  });

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
