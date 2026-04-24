import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-block animate-spin rounded-full border-current border-solid align-[-0.125em]"
      [class]="sizeClass()"
      [style.border-right-color]="'transparent'"
      role="status"
      aria-label="Loading"
    ></span>
  `,
})
export class SpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  protected sizeClass(): string {
    switch (this.size()) {
      case 'sm':
        return 'h-4 w-4 border-2';
      case 'lg':
        return 'h-10 w-10 border-4';
      case 'md':
      default:
        return 'h-6 w-6 border-2';
    }
  }
}
