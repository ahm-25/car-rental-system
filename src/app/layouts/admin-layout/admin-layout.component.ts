import { NgTemplateOutlet } from '@angular/common';
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

interface AdminNavItem {
  labelKey: string;
  path: string;
  icon: 'users' | 'car' | 'receipt';
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    ThemeToggleComponent,
    LanguageToggleComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex bg-surface-muted dark:bg-slate-950">
      <!-- Desktop sidebar -->
      <aside
        class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:start-0 lg:w-64 bg-slate-950 text-slate-100 overflow-hidden border-e border-slate-900 z-50"
      >
        <div class="absolute top-0 end-0 -me-24 -mt-24 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <ng-container *ngTemplateOutlet="sidebarInner" />
      </aside>

      <!-- Mobile drawer -->
      @if (drawerOpen()) {
        <div class="lg:hidden fixed inset-0 z-[60]">
          <div
            class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
            aria-hidden="true"
            (click)="closeDrawer()"
          ></div>
          <aside
            class="absolute inset-y-0 start-0 w-72 bg-slate-950 text-slate-100 shadow-2xl flex flex-col overflow-hidden border-e border-slate-900 animate-fade-in-down"
          >
            <div class="absolute top-0 end-0 -me-24 -mt-24 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl pointer-events-none"></div>
            <ng-container *ngTemplateOutlet="sidebarInner" />
          </aside>
        </div>
      }

      <!-- Content column -->
      <div class="flex-1 lg:ps-64 flex flex-col min-h-screen relative">
        <header class="h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <div class="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div class="flex items-center gap-3 min-w-0">
              <button
                type="button"
                class="lg:hidden inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Open navigation"
                (click)="openDrawer()"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <h1 class="text-base font-semibold tracking-tight text-slate-900 dark:text-white truncate">
                {{ 'nav.admin_panel' | t }}
              </h1>
            </div>

            <div class="flex items-center gap-1 flex-shrink-0 text-slate-600 dark:text-slate-300">
              <app-language-toggle />
              <app-theme-toggle />
            </div>
          </div>
        </header>

        <main class="flex-1 overflow-x-hidden">
          <div class="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full max-w-[1600px] mx-auto">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>

    <ng-template #sidebarInner>
      <!-- Brand -->
      <div class="relative h-16 flex items-center gap-3 px-6 z-10 border-b border-slate-900">
        <div class="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-brand-glow">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <span class="text-lg font-bold tracking-tight text-white">
          {{ 'common.company_name' | t }}<span class="text-brand-400">.</span>
        </span>
      </div>

      <!-- Nav -->
      <nav class="relative flex-1 py-4 px-3 space-y-0.5 overflow-y-auto z-10">
        <p class="px-3 pt-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {{ 'admin.workspace' | t }}
        </p>
        @for (item of nav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="!bg-brand-500/10 !text-white ring-1 ring-brand-500/30"
            [routerLinkActiveOptions]="{ exact: false }"
            #rla="routerLinkActive"
            class="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition-all duration-150 ease-smooth"
            (click)="closeDrawer()"
          >
            <span class="flex items-center justify-center shrink-0">
              @switch (item.icon) {
                @case ('users') {
                  <svg class="h-4.5 w-4.5 h-[18px] w-[18px]" [class.text-brand-400]="rla.isActive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                }
                @case ('car') {
                  <svg class="h-[18px] w-[18px]" [class.text-brand-400]="rla.isActive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                }
                @case ('receipt') {
                  <svg class="h-[18px] w-[18px]" [class.text-brand-400]="rla.isActive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                }
              }
            </span>
            <span>{{ item.labelKey | t }}</span>
          </a>
        }
      </nav>

      <!-- Footer user card -->
      <div class="relative p-4 z-10 border-t border-slate-900 mt-auto">
        <div class="flex items-center gap-3 mb-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div class="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-semibold text-sm shadow-md">
            {{ initials() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-white truncate">
              {{ auth.user()?.name ?? 'Admin' }}
            </div>
            <div class="text-[11px] font-medium text-slate-400 truncate">
              {{ auth.user()?.email }}
            </div>
          </div>
        </div>
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          (click)="logout()"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          {{ 'nav.logout' | t }}
        </button>
      </div>
    </ng-template>
  `,
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly drawerOpen = signal(false);

  protected readonly nav: AdminNavItem[] = [
    { labelKey: 'admin.users', path: '/admin/users', icon: 'users' },
    { labelKey: 'admin.cars', path: '/admin/cars', icon: 'car' },
    { labelKey: 'admin.orders', path: '/admin/orders', icon: 'receipt' },
  ];

  protected readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join('') || 'A'
    );
  });

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
