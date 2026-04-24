import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { User } from '../../../models/user.model';
import { AdminUsersService } from './admin-users.service';

@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [RouterLink, DatePipe, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6">
      <nav class="flex items-center gap-2 text-sm text-slate-500">
        <a routerLink="/admin/users" class="hover:text-brand-700">Users</a>
        <span>/</span>
        <span class="text-slate-900 font-medium">
          {{ user()?.name ?? 'User details' }}
        </span>
      </nav>

      @if (loading()) {
        <div class="card flex items-center justify-center py-16">
          <app-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div
          class="card flex flex-col items-center justify-center gap-3 py-16 text-center"
        >
          <svg class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-base font-medium text-slate-900">{{ error() }}</p>
          <div class="flex items-center gap-2">
            <a routerLink="/admin/users" class="btn-secondary">Back to users</a>
            <button type="button" class="btn-primary" (click)="load()">Retry</button>
          </div>
        </div>
      } @else {
        @if (user(); as u) {
        <header class="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <div
              class="h-14 w-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-semibold"
            >
              {{ initialsFor(u.name) }}
            </div>
            <div>
              <h1 class="text-2xl font-semibold text-slate-900">{{ u.name }}</h1>
              <p class="text-sm text-slate-500">{{ u.email }}</p>
            </div>
          </div>
          <span
            class="self-start inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
            [class.bg-brand-50]="u.role === 'admin'"
            [class.text-brand-700]="u.role === 'admin'"
            [class.bg-slate-100]="u.role !== 'admin'"
            [class.text-slate-700]="u.role !== 'admin'"
          >
            {{ u.role }}
          </span>
        </header>

        <div class="grid gap-4 md:grid-cols-2">
          <article class="card">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Account
            </h2>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">ID</dt>
                <dd class="font-medium text-slate-900">{{ u.id }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Role</dt>
                <dd class="font-medium text-slate-900">{{ u.role }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Joined</dt>
                <dd class="font-medium text-slate-900">
                  {{ u.created_at | date: 'longDate' }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Wallet</dt>
                <dd class="font-medium text-slate-900">{{ u.wallet }}</dd>
              </div>
            </dl>
          </article>

          <article class="card">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Contact
            </h2>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Email</dt>
                <dd class="font-medium text-slate-900 break-all text-right">{{ u.email }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Phone</dt>
                <dd class="font-medium text-slate-900">{{ u.phone }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Country</dt>
                <dd class="font-medium text-slate-900">{{ u.country }}</dd>
              </div>
            </dl>
          </article>
        </div>
        }
      }
    </section>
  `,
})
export class UserDetailsComponent implements OnInit {
  private readonly service = inject(AdminUsersService);

  @Input() id?: string;

  protected readonly user = signal<User | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) {
      this.error.set('Invalid user id.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.service.getById(this.id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.user.set(null);
        if (err.status === 404) {
          this.error.set('This user no longer exists.');
        } else {
          this.error.set(
            (err.error as { message?: string } | null)?.message ??
              'Failed to load user details.',
          );
        }
      },
    });
  }

  protected initialsFor(name: string): string {
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join('') || '?'
    );
  }
}
