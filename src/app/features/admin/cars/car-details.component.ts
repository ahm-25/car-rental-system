import { DatePipe, DecimalPipe } from '@angular/common';
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
import { NotificationService } from '../../../core/services/notification.service';
import { Car } from '../../../models/car.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { AdminCarsService } from './admin-cars.service';

@Component({
  selector: 'app-admin-car-details',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, SpinnerComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6 max-w-3xl">
      <nav class="flex items-center gap-2 text-sm text-slate-500">
        <a routerLink="/admin/cars" class="hover:text-brand-700">{{ 'cars.details.nav' | t }}</a>
        <span class="rtl:rotate-180">/</span>
        <span class="text-slate-900 dark:text-slate-100 font-medium font-bold">
          {{ car()?.name ?? ('cars.details.title' | t) }}
        </span>
      </nav>

      @if (loading()) {
        <div class="card flex items-center justify-center py-16">
          <app-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="card flex flex-col items-center gap-3 py-12 text-center">
          <p class="font-medium text-slate-900 dark:text-slate-100">{{ error() }}</p>
          <div class="flex gap-2">
            <a routerLink="/admin/cars" class="btn-secondary">{{ 'cars.details.back' | t }}</a>
            <button type="button" class="btn-primary" (click)="load()">{{ 'common.retry' | t }}</button>
          </div>
        </div>
      } @else {
        @if (car(); as c) {
        <header class="card flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ c.name }}</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {{ c.brand }} · {{ c.model }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <a [routerLink]="['/admin/cars', c.id, 'edit']" class="btn-secondary">
              {{ 'common.edit' | t }}
            </a>
            <button
              type="button"
              class="btn inline-flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
              [disabled]="deleting()"
              (click)="deleteCar(c)"
            >
              @if (deleting()) {
                <app-spinner size="sm" />
                {{ 'cars.delete_confirm.deleting' | t }}
              } @else {
                {{ 'common.delete' | t }}
              }
            </button>
          </div>
        </header>

        <div class="grid gap-4 md:grid-cols-2">
          <article class="card">
            <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              {{ 'cars.details.header' | t }}
            </h2>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">{{ 'cars.details.id' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ c.id }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">{{ 'cars.details.brand' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ c.brand }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">{{ 'cars.details.model' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ c.model }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">{{ 'cars.details.kilometers' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ c.kilometers | number }} {{ 'cars.table.km' | t }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">{{ 'cars.details.price_per_day' | t }}</dt>
                <dd class="font-bold text-slate-900 dark:text-slate-100">
                  $ {{ +c.price_per_day | number: '1.2-2' }}
                </dd>
              </div>
            </dl>
          </article>

          <article class="card">
            <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              {{ 'cars.details.timestamps' | t }}
            </h2>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">{{ 'cars.details.created' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ c.created_at | date: 'medium' }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">{{ 'cars.details.updated' | t }}</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ c.updated_at | date: 'medium' }}
                </dd>
              </div>
            </dl>
          </article>
        </div>
        }
      }
    </section>
  `,
})
export class AdminCarDetailsComponent implements OnInit {
  private readonly service = inject(AdminCarsService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly lang = inject(LanguageService);

  @Input() id?: string;

  protected readonly car = signal<Car | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly deleting = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) {
      this.error.set('Invalid car id.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.service.getById(this.id).subscribe({
      next: (car) => {
        this.car.set(car);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.car.set(null);
        this.error.set(
          err.status === 404
            ? this.lang.translate('cars.details.not_found')
            : (err.error as { message?: string } | null)?.message ??
                'Failed to load car details.',
        );
      },
    });
  }

  deleteCar(car: Car): void {
    if (this.deleting()) return;
    if (!confirm(this.lang.translate('cars.delete_confirm.body'))) return;

    this.deleting.set(true);
    this.service.delete(car.id).subscribe({
      next: (res) => {
        this.deleting.set(false);
        this.notify.success(res.message);
        this.router.navigate(['/admin/cars']);
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }
}
