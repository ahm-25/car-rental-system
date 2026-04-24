import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-field-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message()) {
      <p class="mt-1 text-xs text-red-600">{{ message() }}</p>
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();
  readonly serverErrors = input<string[] | undefined>(undefined);
  readonly messages = input<Record<string, string>>({});

  readonly message = computed<string | null>(() => {
    const server = this.serverErrors();
    if (server && server.length > 0) {
      return server[0];
    }

    const c = this.control();
    if (!c.errors || (!c.touched && !c.dirty)) {
      return null;
    }

    const key = Object.keys(c.errors)[0];
    const custom = this.messages()[key];
    if (custom) {
      return custom;
    }

    return defaultMessageFor(key, c.errors[key]);
  });
}

function defaultMessageFor(key: string, detail: unknown): string {
  switch (key) {
    case 'required':
      return 'This field is required.';
    case 'email':
      return 'Enter a valid email address.';
    case 'minlength': {
      const d = detail as { requiredLength: number } | null;
      return `Must be at least ${d?.requiredLength ?? 0} characters.`;
    }
    case 'maxlength': {
      const d = detail as { requiredLength: number } | null;
      return `Must be at most ${d?.requiredLength ?? 0} characters.`;
    }
    case 'pattern':
      return 'Format is invalid.';
    case 'passwordsMismatch':
      return 'Passwords do not match.';
    default:
      return 'This field is invalid.';
  }
}
