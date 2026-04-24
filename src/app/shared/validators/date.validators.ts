import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parts = value.split('-').map((n) => Number(n));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function todayAtMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const notInPastValidator: ValidatorFn = (control: AbstractControl) => {
  const value = control.value as string;
  const date = parseDate(value);
  if (!date) return null;
  return date < todayAtMidnight() ? { dateInPast: true } : null;
};

export function dateAfterValidator(
  earlierKey: string,
  laterKey: string,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = parseDate(group.get(earlierKey)?.value as string);
    const end = parseDate(group.get(laterKey)?.value as string);
    const laterCtrl = group.get(laterKey);
    if (!laterCtrl) return null;

    const currentErrors = { ...(laterCtrl.errors ?? {}) };
    delete currentErrors['dateOrder'];

    if (start && end && end <= start) {
      laterCtrl.setErrors({ ...currentErrors, dateOrder: true });
      return { dateOrder: true };
    }

    laterCtrl.setErrors(
      Object.keys(currentErrors).length ? currentErrors : null,
    );
    return null;
  };
}
