import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, of, tap } from 'rxjs';

export type Language = 'en' | 'ar';
type Translations = Record<string, unknown>;

const STORAGE_KEY = 'crs_lang';
const RTL_LANGS: readonly Language[] = ['ar'];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly http = inject(HttpClient);

  private readonly _language = signal<Language>(this.readInitial());
  private readonly _bundles = signal<Record<Language, Translations | null>>({
    en: null,
    ar: null,
  });

  readonly language = this._language.asReadonly();
  readonly isRtl = computed(() => RTL_LANGS.includes(this._language()));
  readonly direction = computed<'rtl' | 'ltr'>(() =>
    this.isRtl() ? 'rtl' : 'ltr',
  );
  readonly translations = computed(
    () => this._bundles()[this._language()] ?? {},
  );

  constructor() {
    effect(() => {
      const lang = this._language();
      this.applyDomAttrs(lang);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    });

    // Preload both bundles; the active one takes priority via appInitializer.
    this.load('en').subscribe();
    this.load('ar').subscribe();
  }

  /** Resolve a dotted key against the active bundle, with {param} interpolation. */
  translate(key: string, params?: Record<string, string | number>): string {
    const bundle = this.translations();
    const value = resolveKey(bundle, key);
    if (typeof value !== 'string') {
      return key;
    }
    if (!params) {
      return value;
    }
    return Object.entries(params).reduce(
      (out, [k, v]) => out.replaceAll(`{${k}}`, String(v)),
      value,
    );
  }

  set(lang: Language): void {
    this._language.set(lang);
  }

  toggle(): void {
    this._language.update((l) => (l === 'en' ? 'ar' : 'en'));
  }

  /** Used by an app initializer so the first render has translations ready. */
  ensureActiveLoaded(): Promise<void> {
    const lang = this._language();
    if (this._bundles()[lang]) {
      return Promise.resolve();
    }
    return firstValueFrom(this.load(lang)).then(() => undefined);
  }

  private load(lang: Language): Observable<Translations> {
    if (this._bundles()[lang]) {
      return of(this._bundles()[lang] as Translations);
    }
    return this.http.get<Translations>(`i18n/${lang}.json`).pipe(
      tap((bundle) => {
        this._bundles.update((map) => ({ ...map, [lang]: bundle }));
      }),
    );
  }

  private readInitial(): Language {
    if (typeof localStorage === 'undefined') return 'en';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ar') return stored;
    if (
      typeof navigator !== 'undefined' &&
      navigator.language?.toLowerCase().startsWith('ar')
    ) {
      return 'ar';
    }
    return 'en';
  }

  private applyDomAttrs(lang: Language): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', RTL_LANGS.includes(lang) ? 'rtl' : 'ltr');
  }
}

function resolveKey(bundle: Translations, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as object)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, bundle);
}
