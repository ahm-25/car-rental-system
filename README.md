# Car Rental System

A production-ready Angular 19 front-end for a car rental platform. Includes customer and admin experiences, full auth (customer + admin), CRUD for cars/users, orders with full/cash/installments payment, per-installment payment from the wallet, dark mode, and runtime English/Arabic switching with RTL.

- **Frontend:** Angular 19, standalone components, signals, OnPush everywhere.
- **Styling:** Tailwind CSS 3 + PostCSS. No UI kit — custom design system in `styles.scss`.
- **API:** `https://task.abudiyab-soft.com/api` (configurable via `src/environments/environment.ts`).

## Setup

**Prerequisites:** Node.js 20+ and npm 10+.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:4200)
npm start

# 3. Production build
npm run build
```

### Test credentials

From the Postman collection `info.description`:

| Role     | Email                  | Password   |
|----------|------------------------|------------|
| Admin    | `admin@admin.com`      | `password` |
| Customer | `customer@customer.com`| `password` |

On the login page, use the **Admin / Customer** tab to pick which endpoint to hit.

### API endpoint

[`src/environments/environment.ts`](src/environments/environment.ts):

```ts
export const environment = {
  production: false,
  apiUrl: 'https://task.abudiyab-soft.com/api',
  appName: 'Car Rental System',
};
```

To run against a local Laravel backend, change `apiUrl` to `http://localhost:8000/api`.

## Project structure

```
src/
├── app/
│   ├── core/                         Singletons — HTTP, auth, theme, language
│   │   ├── guards/                   authGuard (+ role), guestGuard
│   │   ├── interceptors/             auth (Bearer) + error (401/403/422/500)
│   │   └── services/                 auth, theme, language, api, notification
│   ├── shared/                       Reusable building blocks
│   │   ├── components/               pagination, spinner, field-error,
│   │   │                             theme-toggle, language-toggle, toast-host
│   │   ├── pipes/                    t (translate)
│   │   └── validators/               date, passwords-match
│   ├── models/                       TypeScript interfaces = API source of truth
│   │   ├── user.model.ts             User, LoginPayload, Register…, Auth…
│   │   ├── car.model.ts              Car, Create/Update payloads
│   │   ├── order.model.ts            Order, Installment, CreateOrderPayload union
│   │   └── pagination.model.ts       Laravel flat paginator
│   ├── layouts/                      Route-level shells
│   │   ├── auth-layout               Split image + form
│   │   ├── customer-layout           Top navbar + container
│   │   └── admin-layout              Fixed sidebar + top bar + content
│   ├── features/                     Feature components (lazy-loaded)
│   │   ├── auth/                     login, register
│   │   ├── admin/
│   │   │   ├── users/                list + details (+ service)
│   │   │   ├── cars/                 list + form + details (CRUD)
│   │   │   └── orders/               list + details (+ status update)
│   │   └── customer/
│   │       ├── cars/                 list + details
│   │       ├── orders/               list + details + book-car (create flow)
│   │       └── installments/         list + pay
│   ├── app.component.ts              Root — RouterOutlet + toast host
│   ├── app.config.ts                 Providers: router, HTTP, interceptors, i18n init
│   └── app.routes.ts                 Top-level routing (layout trees)
├── environments/
├── index.html                        Inline dark-mode + lang/dir script (no FOUC)
└── styles.scss                       Tailwind base + component classes
public/
└── i18n/
    ├── en.json                       English translations
    └── ar.json                       Arabic translations
```

### Architectural notes

- **Standalone components** everywhere — no NgModules.
- **OnPush** on every component. Signals track updates; inputs are reactive via `input()` / `output()`.
- **Lazy loading** for every feature route via `loadComponent` / `loadChildren`. The admin chunk isn't downloaded until a customer opens `/admin/*`, and vice versa.
- **Strict TypeScript** (`strict: true`, `noImplicitOverride`, `strictTemplates`). Zero `any` / `$any` in the codebase.
- **Type safety against the API:** every service method is typed off the Postman response body. Payloads are typed (e.g. `CreateOrderPayload` is a discriminated union — TS refuses to build an `installments` order without `down_payment` + `number_of_installments`).

### Routing

| Path                   | Layout          | Guard |
|------------------------|-----------------|-------|
| `/login`, `/register`  | `AuthLayout`    | `guestGuard` |
| `/cars`, `/cars/:id`, `/cars/:id/book` | `CustomerLayout` | `authGuard` |
| `/orders`, `/orders/:id` | `CustomerLayout` | `authGuard` |
| `/installments`        | `CustomerLayout` | `authGuard` |
| `/admin/**`            | `AdminLayout`   | `authGuard` + `data: { role: 'admin' }` |

## Shared components

| Component | Purpose |
|-----------|---------|
| [`<app-pagination>`](src/app/shared/components/pagination/pagination.component.ts) | Prev/Next/Page X of Y + optional First/Last + optional rows-per-page. Used in all 6 paginated lists. |
| [`<app-spinner>`](src/app/shared/components/spinner/spinner.component.ts) | `size` input: `sm` / `md` / `lg`. Used for loading overlays and inline button states. |
| [`<app-field-error>`](src/app/shared/components/field-error/field-error.component.ts) | Renders the first error under a form control (client validators or server `errors[field][]`). |
| [`<app-theme-toggle>`](src/app/shared/components/theme-toggle/theme-toggle.component.ts) | Light / dark button. |
| [`<app-language-toggle>`](src/app/shared/components/language-toggle/language-toggle.component.ts) | English / العربية button. |
| [`<app-toast-host>`](src/app/shared/components/toast-host/toast-host.component.ts) | Mounted once in `AppComponent`, renders notifications from `NotificationService`. |

## How to toggle dark mode

1. Click the **sun / moon icon** in the top bar of either layout.
2. Preference is written to `localStorage.crs_theme` as `"light"` or `"dark"`.
3. On next load, an inline script in [`index.html`](src/index.html) reads the key and sets the `dark` class on `<html>` *before* Angular renders — so there's no light-mode flash.
4. If no preference is stored, the app respects the system `prefers-color-scheme: dark`.

Under the hood:

- [`ThemeService`](src/app/core/services/theme.service.ts) exposes `theme()`, `isDark()`, and `toggle()` signals.
- A single `effect()` in its constructor applies the `dark` class and persists the choice — the only source of truth.
- Tailwind `dark:` variants on the shared `.card`, `.input`, `.btn-*`, `.label` utility classes mean every component using these inherits dark styling automatically.

## How to switch language

1. Click the **globe icon** in the top bar (shows `العربية` in English mode, `English` in Arabic mode).
2. Preference is written to `localStorage.crs_lang` as `"en"` or `"ar"`.
3. The [`index.html`](src/index.html) inline script sets `<html lang="…" dir="…">` before Angular boots — RTL direction takes effect on the very first paint.
4. If no preference is stored, the app checks `navigator.language` — Arabic browsers start in Arabic.

Under the hood:

- [`LanguageService`](src/app/core/services/language.service.ts) holds a `language` signal plus preloaded `en.json` + `ar.json` bundles fetched via HttpClient.
- `provideAppInitializer` in [`app.config.ts`](src/app/app.config.ts) awaits the active language before the first render — no flash of untranslated keys.
- Use the pipe in templates:

  ```html
  <h2>{{ 'auth.login.title' | t }}</h2>
  <p>{{ 'footer.copyright' | t: { year: year } }}</p>
  ```

- Translation files live in [`public/i18n/en.json`](public/i18n/en.json) and [`public/i18n/ar.json`](public/i18n/ar.json). Add a key to both files, then reference it with `'path.to.key' | t` — no rebuild needed, just refresh.

### RTL behaviour

When Arabic is active, `<html dir="rtl">` is set. Layout spacing uses logical Tailwind utilities (`gap-*`, `ms-*` / `me-*`) where directional spacing matters, and the pagination `«` / `»` arrows swap via `rtl:hidden` / `hidden rtl:inline` so they still point the correct way.

## API integration

- [`AuthInterceptor`](src/app/core/interceptors/auth.interceptor.ts) — attaches `Authorization: Bearer <token>` + `Accept: application/json` to every outgoing request.
- [`ErrorInterceptor`](src/app/core/interceptors/error.interceptor.ts):
  - `401` on an auth endpoint → toast "Invalid credentials." (no forced redirect, form can retry).
  - `401` elsewhere → `clearSession()` + navigate to `/login`.
  - `403` / `404` / `422` / `500` / `0` → friendly toast, rethrows so forms can still read `err.error.errors` for per-field validation.

### Example call

```ts
// Book a car on installments
const payload: CreateOrderPayload = {
  car_id: 3,
  delivery_date: '2026-04-20',
  receiving_date: '2026-04-30',
  payment_type: 'tamara',
  order_type: 'installments',
  down_payment: 200,
  number_of_installments: 3,
};

this.ordersService.create(payload).subscribe({
  next: (order) => {
    this.notify.success(`Order #${order.id} created.`);
    this.router.navigate(['/orders', order.id]);
  },
  error: (err: HttpErrorResponse) => {
    const body = err.error as { message?: string; errors?: Record<string, string[]> };
    if (body?.errors) this.serverErrors.set(body.errors);
  },
});
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server on http://localhost:4200 (HMR, source maps). |
| `npm run build` | Production build to `dist/car-rental-system`. |
| `npm run watch` | Dev build with file watching. |
| `npm test` | Run the Karma / Jasmine test suite (specs follow Angular conventions). |
| `npx tsc --noEmit -p tsconfig.app.json` | Type-check only, no build. |
