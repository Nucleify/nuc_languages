import type { NuxtApp } from 'nuxt/app'
import { useNuxtApp, useState } from 'nuxt/app'

import { NucTranslationDashboard, NucTranslationPage } from './atomic'
import { NucLangSwitcher } from './components'

const SUPPORTED_LOCALES = ['en', 'pl', 'vn'] as const
const STATE_KEY = '_translations'

type TranslationMessages = Record<string, Record<string, string>>

type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

function isSupportedLocale(code: string): code is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(code)
}

function resolveActiveLocale(
  nuxtApp: NuxtApp,
  i18n: { locale: { value: string } }
): SupportedLocale {
  const fromRoute = nuxtApp._route?.params?.lang as string | undefined
  if (fromRoute && isSupportedLocale(fromRoute)) {
    return fromRoute
  }
  const current = i18n.locale?.value
  if (current && isSupportedLocale(current)) {
    return current
  }
  return 'en'
}

function buildTranslationsUrl(locale: string): string {
  const separator = apiUrl().includes('?') ? '&' : '?'
  return `${apiUrl()}/translations/locale/${locale}${separator}t=${Date.now()}`
}

function normalizeTranslationPayload(
  raw: unknown
): Record<string, string> | null {
  if (!raw || typeof raw !== 'object') return null
  const wrapped = raw as { data?: unknown }
  const payload = wrapped.data !== undefined ? wrapped.data : raw

  if (Array.isArray(payload)) {
    const out: Record<string, string> = {}
    for (const row of payload) {
      if (!row || typeof row !== 'object') continue
      const { key, value } = row as { key?: unknown; value?: unknown }
      if (typeof key === 'string' && value != null) out[key] = String(value)
    }
    return Object.keys(out).length > 0 ? out : null
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v
    }
    return Object.keys(out).length > 0 ? out : null
  }

  return null
}

/**
 * Instancja z `getLocaleMessage` / `setLocaleMessage` bywa na `global` (wrapper vue-i18n),
 * a nie na samym `nuxtApp.$i18n`. Wybieramy `global`, jeśli ma te metody — bez polegania wyłącznie na `mode`.
 */
function getI18nTarget(nuxtI18n: unknown): unknown {
  if (nuxtI18n == null || typeof nuxtI18n !== 'object') return nuxtI18n
  const g = (nuxtI18n as { global?: unknown }).global
  if (
    g != null &&
    typeof g === 'object' &&
    typeof (g as { getLocaleMessage?: unknown }).getLocaleMessage === 'function'
  ) {
    return g
  }
  return nuxtI18n
}

async function fetchLocaleMessages(
  locale: string
): Promise<Record<string, string> | null> {
  try {
    const raw = await $fetch<unknown>(buildTranslationsUrl(locale), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      credentials: 'include',
    })
    return normalizeTranslationPayload(raw)
  } catch {
    return null
  }
}

type I18nMessageTarget = {
  setLocaleMessage: (locale: string, msg: Record<string, string>) => void
}

function asI18nMessageTarget(nuxtI18n: unknown): I18nMessageTarget | null {
  const i18n = getI18nTarget(nuxtI18n)
  if (
    !i18n ||
    typeof i18n !== 'object' ||
    typeof (i18n as I18nMessageTarget).setLocaleMessage !== 'function'
  ) {
    return null
  }
  return i18n as I18nMessageTarget
}

/** Ustawia słowniki i18n wyłącznie z bazy (bez fallbacku do plików locale). */
function applyDbMessagesToI18n(
  nuxtI18n: unknown,
  allMessages: TranslationMessages
): void {
  const i18n = asI18nMessageTarget(nuxtI18n)
  if (!i18n) return
  for (const locale of SUPPORTED_LOCALES) {
    const msgs = allMessages[locale]
    if (!msgs || Object.keys(msgs).length === 0) continue
    i18n.setLocaleMessage(locale, msgs)
  }
}

async function fetchFreshTranslations(
  nuxtI18n: unknown,
  locale: SupportedLocale,
  options?: { persistState?: boolean }
): Promise<void> {
  try {
    const raw = await $fetch<unknown>(buildTranslationsUrl(locale), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      credentials: 'include',
    })
    const messages = normalizeTranslationPayload(raw)
    if (messages) {
      const fresh: TranslationMessages = { [locale]: messages }
      applyDbMessagesToI18n(nuxtI18n, fresh)
      if (options?.persistState && import.meta.client) {
        const translationState = useState<TranslationMessages>(
          STATE_KEY,
          () => ({})
        )
        translationState.value = {
          ...translationState.value,
          ...fresh,
        }
      }
    }
  } catch (_err) {
    /* network error */
  }
}

async function refreshOneLocaleFromDb(
  nuxtI18n: unknown,
  locale: SupportedLocale,
  options?: { persistState?: boolean }
): Promise<void> {
  const messages = await fetchLocaleMessages(locale)
  if (!messages) return
  const fresh: TranslationMessages = { [locale]: messages }
  applyDbMessagesToI18n(nuxtI18n, fresh)
  if (options?.persistState && import.meta.client) {
    const translationState = useState<TranslationMessages>(
      STATE_KEY,
      () => ({})
    )
    translationState.value = {
      ...translationState.value,
      ...fresh,
    }
  }
}

/**
 * Po zapisie tłumaczeń w panelu — przeładuj słowniki i18n z API (inaczej `$t` zostaje przy starych / pustych wpisach i widać klucz).
 */
export async function refreshTranslationMessages(): Promise<void> {
  if (import.meta.server) return
  const nuxtApp = useNuxtApp()
  if (!nuxtApp.$i18n) return
  // biome-ignore lint/suspicious/noExplicitAny: $i18n from @nuxtjs/i18n
  const i18n = nuxtApp.$i18n as any
  const locale = resolveActiveLocale(nuxtApp, i18n)
  await fetchFreshTranslations(nuxtApp.$i18n, locale, { persistState: true })
}

export function registerNucLanguages(nuxtApp: NuxtApp): void {
  nuxtApp.vueApp
    // biome-ignore lint/suspicious/noExplicitAny: nuxtApp.vueApp is a Vue app
    .component('nuc-lang-switcher', NucLangSwitcher as any)
    // biome-ignore lint/suspicious/noExplicitAny: nuxtApp.vueApp is a Vue app
    .component('nuc-translation-dashboard', NucTranslationDashboard as any)
    // biome-ignore lint/suspicious/noExplicitAny: nuxtApp.vueApp is a Vue app
    .component('nuc-translation-page', NucTranslationPage as any)

  /** Po zmianie języka dociągnij świeży słownik dla locale, żeby nie wisiały stare wartości. */
  // @ts-expect-error — hook z @nuxtjs/i18n, nie ma go w domyślnych HookKeys Nuxt
  nuxtApp.hook('i18n:localeSwitched', (payload: unknown) => {
    if (import.meta.server) return
    const newLocale =
      payload &&
      typeof payload === 'object' &&
      'newLocale' in payload &&
      typeof (payload as { newLocale?: unknown }).newLocale === 'string'
        ? (payload as { newLocale: string }).newLocale
        : ''
    if (!isSupportedLocale(newLocale)) return
    refreshOneLocaleFromDb(nuxtApp.$i18n, newLocale, {
      persistState: true,
    }).catch((_err) => void _err)
  })

  nuxtApp.hook('app:created', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: $i18n is provided by @nuxtjs/i18n
    const i18n = nuxtApp.$i18n as any
    if (!i18n) return

    // useState persists through SSR→client hydration regardless of payloadExtraction setting
    const translationState = useState<TranslationMessages>(
      STATE_KEY,
      () => ({})
    )

    const lang = nuxtApp._route?.params?.lang as string | undefined
    if (lang && isSupportedLocale(lang)) {
      i18n.locale.value = lang
    }

    if (import.meta.server) {
      const activeLocale = resolveActiveLocale(nuxtApp, i18n)
      const messages = await fetchLocaleMessages(activeLocale)
      const allMessages: TranslationMessages = {}
      if (messages) {
        allMessages[activeLocale] = messages
      }
      translationState.value = allMessages
      applyDbMessagesToI18n(i18n, allMessages)
    }

    if (import.meta.client) {
      // Apply SSR translations immediately (synchronous) — eliminates flash
      if (Object.keys(translationState.value).length > 0) {
        applyDbMessagesToI18n(i18n, translationState.value)
      }

      // Refresh from API in background (non-blocking); persist so useState matches i18n
      const activeLocale = resolveActiveLocale(nuxtApp, i18n)
      fetchFreshTranslations(i18n, activeLocale, { persistState: true }).catch(
        (_err) => void _err
      )
    }
  })
}
