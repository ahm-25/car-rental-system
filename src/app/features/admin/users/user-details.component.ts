import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserWithOrders } from '../../../models/user.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AdminUsersService } from './admin-users.service';

@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    NgClass,
    SpinnerComponent,
    ConfirmDialogComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6">
      <nav class="flex items-center gap-2 text-sm text-slate-500">
        <a routerLink="/admin/users" class="hover:text-brand-700">{{ 'users.title' | t }}</a>
        <span class="rtl:rotate-180">/</span>
        <span class="text-slate-900 dark:text-slate-100 font-medium">
          {{ user()?.name ?? ('users.details.title' | t) }}
        </span>
      </nav>

      @if (loading()) {
        <div class="card flex items-center justify-center py-16">
          <app-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <svg class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-base font-medium text-slate-900 dark:text-slate-100">{{ error() }}</p>
          <div class="flex items-center gap-2">
            <a routerLink="/admin/users" class="btn-secondary">{{ 'users.details.back' | t }}</a>
            <button type="button" class="btn-primary" (click)="load()">{{ 'common.retry' | t }}</button>
          </div>
        </div>
      } @else {
        @if (user(); as u) {
        <header class="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <div
              class="h-14 w-14 rounded-full bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 flex items-center justify-center text-lg font-semibold"
            >
              {{ initialsFor(u.name) }}
            </div>
            <div>
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ u.name }}</h1>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ u.email }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="self-start inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              [ngClass]="u.role === 'admin'
                ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
            >
              {{ 'users.roles.' + u.role | t }}
            </span>
            <a [routerLink]="['/admin/users', u.id, 'edit']" class="btn-secondary">
              {{ 'common.edit' | t }}
            </a>
            <button
              type="button"
              class="btn inline-flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
              [disabled]="deleting()"
              (click)="askDelete()"
            >
              {{ 'common.delete' | t }}
            </button>
          </div>
        </header>

        <div class="grid gap-4 md:grid-cols-2">
          <article class="card">
            <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              {{ 'users.details.account' | t }}
            </h2>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 dark:text-slate-400">{{ 'users.details.id' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">#{{ u.id }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 dark:text-slate-400">{{ 'users.table.role' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ 'users.roles.' + u.role | t }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 dark:text-slate-400">{{ 'users.table.joined' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ u.created_at | date: 'longDate' }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 dark:text-slate-400">{{ 'users.details.wallet' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ u.wallet === null ? '—' : '$ ' + (+u.wallet | number: '1.2-2') }}
                </dd>
              </div>
            </dl>
          </article>

          <article class="card">
            <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              {{ 'users.details.contact' | t }}
            </h2>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 dark:text-slate-400">{{ 'users.table.email' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100 break-all text-right">{{ u.email }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 dark:text-slate-400">{{ 'users.table.phone' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ u.phone ?? '—' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500 dark:text-slate-400">{{ 'users.table.country' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ u.country ?? '—' }}</dd>
              </div>
            </dl>
          </article>
        </div>

        <article class="card p-0 overflow-hidden">
          <div class="p-6 pb-4 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {{ 'users.details.orders' | t }}
            </h2>
            @if (u.orders && u.orders.length > 0) {
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">
                {{ u.orders.length }}
              </span>
            }
          </div>
          @if (u.orders && u.orders.length > 0) {
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                <thead class="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th class="px-6 py-3 text-left">{{ 'orders.table.id' | t }}</th>
                    <th class="px-6 py-3 text-left">{{ 'orders.table.period' | t }}</th>
                    <th class="px-6 py-3 text-right">{{ 'orders.table.days' | t }}</th>
                    <th class="px-6 py-3 text-right">{{ 'orders.table.total' | t }}</th>
                    <th class="px-6 py-3 text-left">{{ 'orders.table.status' | t }}</th>
                    <th class="px-6 py-3 text-right">{{ 'orders.table.actions' | t }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (o of u.orders; track o.id) {
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="px-6 py-3 font-bold text-slate-900 dark:text-slate-100">#{{ o.id }}</td>
                      <td class="px-6 py-3 text-slate-600 dark:text-slate-300">
                        {{ o.delivery_date | date: 'mediumDate' }} → {{ o.receiving_date | date: 'mediumDate' }}
                      </td>
                      <td class="px-6 py-3 text-right text-slate-700 dark:text-slate-200">{{ o.days }}</td>
                      <td class="px-6 py-3 text-right font-medium text-slate-900 dark:text-slate-100">
                        $ {{ +o.total_price | number: '1.2-2' }}
                      </td>
                      <td class="px-6 py-3">
                        <span
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                          [ngClass]="o.payment_status === 'success'
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300'"
                        >
                          {{ 'orders.statuses.' + o.payment_status | t }}
                        </span>
                      </td>
                      <td class="px-6 py-3 text-right">
                        <a
                          [routerLink]="['/admin/orders', o.id]"
                          class="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 text-sm font-medium"
                        >
                          {{ 'common.view' | t }} →
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              {{ 'users.details.no_orders' | t }}
            </div>
          }
        </article>
        }
      }
    </section>

    @if (user(); as u) {
      <app-confirm-dialog
        [open]="confirmDeleteOpen()"
        [title]="'users.delete_confirm.title' | t: { name: u.name }"
        [body]="'users.delete_confirm.body' | t"
        [confirmLabel]="'users.delete_confirm.delete' | t"
        [busyLabel]="'users.delete_confirm.deleting' | t"
        [busy]="deleting()"
        tone="danger"
        (confirm)="confirmDelete(u)"
        (cancel)="cancelDelete()"
      />
    }
  `,
})
export class UserDetailsComponent implements OnInit {
  private readonly service = inject(AdminUsersService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly lang = inject(LanguageService);

  @Input() id?: string;

  protected readonly user = signal<UserWithOrders | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly deleting = signal(false);
  protected readonly confirmDeleteOpen = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) {
      this.error.set(this.lang.translate('users.details.error_invalid_id'));
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
          this.error.set(this.lang.translate('users.details.error_not_found'));
        } else {
          this.error.set(
            (err.error as { message?: string } | null)?.message ??
              this.lang.translate('users.details.error_default'),
          );
        }
      },
    });
  }

  askDelete(): void {
    if (this.deleting()) return;
    this.confirmDeleteOpen.set(true);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.confirmDeleteOpen.set(false);
  }

  confirmDelete(user: UserWithOrders): void {
    if (this.deleting()) return;

    this.deleting.set(true);
    this.service.delete(user.id).subscribe({
      next: (res) => {
        this.deleting.set(false);
        this.confirmDeleteOpen.set(false);
        this.notify.success(res.message);
        this.router.navigate(['/admin/users']);
      },
      error: () => {
        this.deleting.set(false);
        this.confirmDeleteOpen.set(false);
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
