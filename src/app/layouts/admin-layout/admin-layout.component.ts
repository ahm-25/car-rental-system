import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
    <div class="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <!-- Desktop sidebar -->
      <aside
        class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:start-0 lg:w-72 bg-slate-950 text-slate-100 overflow-hidden border-e border-slate-800 z-50"
      >
        <!-- Subtle Glow Decoration -->
        <div class="absolute top-0 end-0 -me-24 -mt-24 w-64 h-64 bg-brand-500/20 rounded-full blur-[80px] pointer-events-none"></div>

        <ng-container *ngTemplateOutlet="sidebarInner" />
      </aside>

      <!-- Mobile drawer -->
      @if (drawerOpen()) {
        <div class="lg:hidden fixed inset-0 z-[60]">
          <div
            class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            aria-hidden="true"
            (click)="closeDrawer()"
          ></div>
          <aside
            class="absolute inset-y-0 start-0 w-72 bg-slate-950 text-slate-100 shadow-2xl flex flex-col overflow-hidden border-e border-slate-800"
          >
            <div class="absolute top-0 end-0 -me-24 -mt-24 w-64 h-64 bg-brand-500/20 rounded-full blur-[80px] pointer-events-none"></div>
            <ng-container *ngTemplateOutlet="sidebarInner" />
          </aside>
        </div>
      }

      <!-- Content column -->
      <div class="flex-1 lg:ps-72 flex flex-col min-h-screen relative">
        <header class="h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <div class="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div class="flex items-center gap-4 min-w-0">
              <button
                type="button"
                class="lg:hidden inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm border border-slate-200 dark:border-slate-800"
                aria-label="Open navigation"
                (click)="openDrawer()"
              >
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {{ 'nav.admin_panel' | t }}
              </h1>
            </div>
            
            <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <app-language-toggle />
              <app-theme-toggle />
            </div>
          </div>
        </header>

        <main class="flex-1 overflow-x-hidden">
          <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-screen-2xl mx-auto">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>

    <ng-template #sidebarInner>
      <div class="relative h-20 flex items-center gap-3 px-8 z-10">
        <div class="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <span class="text-2xl font-black tracking-tight text-white">Vroom<span class="text-brand-500 text-3xl leading-none">.</span></span>
      </div>

      <nav class="relative flex-1 py-6 px-4 space-y-1.5 overflow-y-auto z-10 mt-4">
        @for (item of nav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-brand-600/10 text-brand-400 font-semibold shadow-[0_0_15px_-3px_rgba(79,70,229,0.1)] border border-brand-500/20"
            [routerLinkActiveOptions]="{ exact: false }"
            #rla="routerLinkActive"
            class="group flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all duration-200 border border-transparent"
            (click)="closeDrawer()"
          >
            <span class="flex items-center justify-center">
              @switch (item.icon) {
                @case ('users') {
                  <svg class="h-5 w-5 transition-transform group-hover:scale-110" [class.text-brand-400]="rla.isActive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                @case ('car') {
                  <svg class="h-5 w-5 transition-transform group-hover:scale-110" [class.text-brand-400]="rla.isActive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2M5 13v4a1 1 0 001 1h1a1 1 0 001-1v-1m8 1a1 1 0 001-1v-4" />
                  </svg>
                }
                @case ('receipt') {
                  <svg class="h-5 w-5 transition-transform group-hover:scale-110" [class.text-brand-400]="rla.isActive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h4M7 3h10a2 2 0 012 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 012-2z" />
                  </svg>
                }
              }
            </span>
            <span>{{ item.labelKey | t }}</span>
          </a>
        }
      </nav>

      <div class="relative p-6 z-10 border-t border-slate-800/80 mt-auto bg-slate-950">
        <div class="flex items-center gap-3 mb-6 bg-slate-900/50 p-3 rounded-2xl border border-slate-800/50">
          <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {{ initials() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold text-white truncate">
              {{ auth.user()?.name ?? 'Admin' }}
            </div>
            <div class="text-[11px] font-medium text-slate-400 uppercase tracking-widest truncate mt-0.5">
              {{ 'admin.administrator' | t }}
            </div>
          </div>
        </div>
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900/50 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all"
          (click)="logout()"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || 'A';
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
