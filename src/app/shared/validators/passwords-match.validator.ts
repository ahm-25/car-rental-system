import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordsMatchValidator(
  passwordKey: string,
  confirmKey: string,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pwd = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;

    const confirmControl = group.get(confirmKey);
    if (!confirmControl) {
      return null;
    }

    if (!confirm) {
      const { passwordsMismatch: _removed, ...rest } = confirmControl.errors ?? {};
      confirmControl.setErrors(Object.keys(rest).length ? rest : null);
      return null;
    }

    if (pwd !== confirm) {
      confirmControl.setErrors({
        ...(confirmControl.errors ?? {}),
        passwordsMismatch: true,
      });
      return { passwordsMismatch: true };
    }

    const { passwordsMismatch: _removed, ...rest } = confirmControl.errors ?? {};
    confirmControl.setErrors(Object.keys(rest).length ? rest : null);
    return null;
  };
}
