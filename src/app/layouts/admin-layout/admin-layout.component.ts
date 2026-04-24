import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface AdminNavItem {
  label: string;
  path: string;
  icon: 'users' | 'car' | 'receipt';
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex bg-surface-muted">
      <!-- Desktop sidebar -->
      <aside
        class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-slate-900 text-slate-100"
      >
        <ng-container *ngTemplateOutlet="sidebarInner" />
      </aside>

      <!-- Mobile drawer -->
      @if (drawerOpen()) {
        <div class="lg:hidden fixed inset-0 z-40">
          <div
            class="absolute inset-0 bg-slate-900/60"
            aria-hidden="true"
            (click)="closeDrawer()"
          ></div>
          <aside
            class="absolute inset-y-0 left-0 w-64 bg-slate-900 text-slate-100 shadow-xl flex flex-col"
          >
            <ng-container *ngTemplateOutlet="sidebarInner" />
          </aside>
        </div>
      }

      <!-- Content column -->
      <div class="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header class="h-16 bg-white border-b border-slate-200 sticky top-0 z-20">
          <div class="h-full flex items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              class="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100"
              aria-label="Open navigation"
              (click)="openDrawer()"
            >
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <h1 class="text-base sm:text-lg font-semibold text-slate-900">Admin panel</h1>
            <div class="flex-1"></div>
            <span class="hidden sm:inline text-sm text-slate-600">
              {{ auth.user()?.name }}
            </span>
            <button type="button" class="btn-ghost" (click)="logout()">
              Logout
            </button>
          </div>
        </header>

        <main class="flex-1">
          <div class="px-4 sm:px-6 lg:px-8 py-6">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>

    <ng-template #sidebarInner>
      <div class="h-16 flex items-center gap-2 px-6 border-b border-slate-800">
        <span class="inline-block h-8 w-8 rounded-lg bg-brand-500"></span>
        <span class="font-semibold text-white">Admin</span>
      </div>

      <nav class="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        @for (item of nav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-slate-800 text-white"
            class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            (click)="closeDrawer()"
          >
            @switch (item.icon) {
              @case ('users') {
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              @case ('car') {
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M6 17h2m8 0h2M5 13v4a1 1 0 001 1h1a1 1 0 001-1v-1m8 1a1 1 0 001-1v-4" />
                </svg>
              }
              @case ('receipt') {
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h4M7 3h10a2 2 0 012 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 012-2z" />
                </svg>
              }
            }
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="p-3 border-t border-slate-800">
        <div class="flex items-center gap-3 px-2 py-2">
          <div class="h-9 w-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold">
            {{ initials() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-white truncate">
              {{ auth.user()?.name ?? 'Admin' }}
            </div>
            <div class="text-xs text-slate-400 truncate">Administrator</div>
          </div>
        </div>
        <button
          type="button"
          class="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          (click)="logout()"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
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
    { label: 'Users', path: '/admin/users', icon: 'users' },
    { label: 'Cars', path: '/admin/cars', icon: 'car' },
    { label: 'Orders', path: '/admin/orders', icon: 'receipt' },
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
