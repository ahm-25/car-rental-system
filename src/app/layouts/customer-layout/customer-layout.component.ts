import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  requiresAuth: boolean;
}

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-full flex flex-col">
      <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div class="container-app flex h-16 items-center gap-4">
          <a routerLink="/" class="flex items-center gap-2 font-semibold text-slate-900">
            <span class="inline-block h-8 w-8 rounded-lg bg-brand-600"></span>
            <span class="hidden sm:inline">Car Rental</span>
          </a>

          <nav class="hidden md:flex items-center gap-1 ml-6">
            @for (item of visibleNav(); track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-brand-50 text-brand-700"
                class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {{ item.label }}
              </a>
            }

            @if (auth.hasRole('admin')) {
              <a
                routerLink="/admin/users"
                class="px-3 py-2 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                Admin panel
              </a>
            }
          </nav>

          <div class="flex-1"></div>

          <div class="hidden md:flex items-center gap-2">
            @if (auth.isAuthenticated()) {
              <span class="text-sm text-slate-600">
                Hi, <span class="font-medium text-slate-900">{{ auth.user()?.name }}</span>
              </span>
              <button type="button" class="btn-ghost" (click)="logout()">Logout</button>
            } @else {
              <a routerLink="/login" class="btn-ghost">Login</a>
              <a routerLink="/register" class="btn-primary">Register</a>
            }
          </div>

          <button
            type="button"
            class="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100"
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
          <div class="md:hidden border-t border-slate-200 bg-white">
            <nav class="container-app py-3 flex flex-col gap-1">
              @for (item of visibleNav(); track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-brand-50 text-brand-700"
                  class="px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100"
                  (click)="closeMenu()"
                >
                  {{ item.label }}
                </a>
              }

              @if (auth.hasRole('admin')) {
                <a
                  routerLink="/admin/users"
                  class="px-3 py-2 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-50"
                  (click)="closeMenu()"
                >
                  Admin panel
                </a>
              }

              @if (auth.isAuthenticated()) {
                <button type="button" class="btn-secondary mt-2" (click)="logout(); closeMenu()">
                  Logout
                </button>
              } @else {
                <a routerLink="/login" class="btn-secondary mt-2" (click)="closeMenu()">Login</a>
                <a routerLink="/register" class="btn-primary" (click)="closeMenu()">Register</a>
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

      <footer class="border-t border-slate-200 bg-white">
        <div class="container-app py-4 text-xs text-slate-500">
          &copy; {{ year }} Car Rental System
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
    { label: 'Cars', path: '/cars', requiresAuth: false },
    { label: 'Orders', path: '/orders', requiresAuth: true },
    { label: 'Installments', path: '/installments', requiresAuth: true },
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
