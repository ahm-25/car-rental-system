import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
    <div class="min-h-full flex flex-col">
      <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div class="container-app flex h-16 items-center gap-4">
          <a routerLink="/" class="flex items-center gap-3 font-black text-slate-900 dark:text-slate-100 group">
            <span class="inline-block h-10 w-10 rounded-xl bg-brand-600 shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform"></span>
            <span class="hidden sm:inline text-2xl tracking-tight">{{ 'common.company_name' | t }}<span class="text-brand-600 text-3xl leading-none">.</span></span>
          </a>

          <nav class="hidden md:flex items-center gap-1 ml-6">
            @for (item of visibleNav(); track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {{ item.labelKey | t }}
              </a>
            }

            @if (auth.hasRole('admin')) {
              <a
                routerLink="/admin/users"
                class="px-3 py-2 rounded-lg text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/30"
              >
                {{ 'nav.admin_panel' | t }}
              </a>
            }
          </nav>

          <div class="flex-1"></div>

          <app-language-toggle class="hidden md:inline-flex text-slate-600 dark:text-slate-300" />
          <app-theme-toggle class="hidden md:inline-flex text-slate-600 dark:text-slate-300" />

          <div class="hidden md:flex items-center gap-2">
            @if (auth.isAuthenticated()) {
              <span class="text-sm text-slate-600 dark:text-slate-400">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ auth.user()?.name }}</span>
              </span>
              <button type="button" class="btn-ghost" (click)="logout()">
                {{ 'nav.logout' | t }}
              </button>
            } @else {
              <a routerLink="/login" class="btn-ghost">{{ 'nav.login' | t }}</a>
              <a routerLink="/register" class="btn-primary">{{ 'nav.register' | t }}</a>
            }
          </div>

          <app-language-toggle class="md:hidden text-slate-600 dark:text-slate-300" />
          <app-theme-toggle class="md:hidden text-slate-600 dark:text-slate-300" />

          <button
            type="button"
            class="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            [attr.aria-expanded]="menuOpen()"
            aria-label="Toggle navigation"
            (click)="toggleMenu()"
          >
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (menuOpen()) {
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
              } @else {
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              }
            </svg>
          </button>
        </div>

        @if (menuOpen()) {
          <div class="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <nav class="container-app py-3 flex flex-col gap-1">
              @for (item of visibleNav(); track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                  class="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  (click)="closeMenu()"
                >
                  {{ item.labelKey | t }}
                </a>
              }

              @if (auth.hasRole('admin')) {
                <a
                  routerLink="/admin/users"
                  class="px-3 py-2 rounded-lg text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/30"
                  (click)="closeMenu()"
                >
                  {{ 'nav.admin_panel' | t }}
                </a>
              }

              @if (auth.isAuthenticated()) {
                <button type="button" class="btn-secondary mt-2" (click)="logout(); closeMenu()">
                  {{ 'nav.logout' | t }}
                </button>
              } @else {
                <a routerLink="/login" class="btn-secondary mt-2" (click)="closeMenu()">
                  {{ 'nav.login' | t }}
                </a>
                <a routerLink="/register" class="btn-primary" (click)="closeMenu()">
                  {{ 'nav.register' | t }}
                </a>
              }
            </nav>
          </div>
        }
      </header>

      <main class="flex-1">
        <div class="container-app py-6 sm:py-8">
          <router-outlet />
        </div>
      </main>

      <footer class="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div class="container-app py-4 text-xs text-slate-500 dark:text-slate-500">
          {{ 'footer.copyright' | t: { year: year } }}
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
