import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: number;
  message: string;
  kind: NotificationKind;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  private readonly _items = signal<Notification[]>([]);
  readonly items = this._items.asReadonly();

  show(message: string, kind: NotificationKind = 'info', durationMs = 4000): void {
    const id = this.nextId++;
    this._items.update((list) => [...list, { id, message, kind }]);
    if (durationMs > 0) {
      setTimeout(() => this.dismiss(id), durationMs);
    }
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  dismiss(id: number): void {
    this._items.update((list) => list.filter((n) => n.id !== id));
  }
}
