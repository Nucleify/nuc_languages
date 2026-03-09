import type { NuxtApp } from 'nuxt/app'
import { useState } from 'nuxt/app'

import { NucTranslationDashboard, NucTranslationPage } from './atomic'
import { NucLangSwitcher } from './components'

const SUPPORTED_LOCALES = ['en', 'pl', 'vn'] as const
const STATE_KEY = '_translations'

type TranslationMessages = Record<string, Record<string, string>>

function buildTranslationsUrl(locale: string): string {
  const separator = apiUrl().includes('?') ? '&' : '?'
  return `${apiUrl()}/translations/locale/${locale}${separator}t=${Date.now()}`
}

async function fetchLocaleMessages(
  locale: string
): Promise<Record<string, string> | null> {
  try {
    return await $fetch<Record<string, string>>(buildTranslationsUrl(locale), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      credentials: 'include',
    })
  } catch {
    return null
  }
}

// biome-ignore lint/suspicious/noExplicitAny: $i18n is provided by @nuxtjs/i18n
function applyMessages(i18n: any, allMessages: TranslationMessages): void {
  for (const locale of SUPPORTED_LOCALES) {
    if (allMessages[locale]) {
      i18n.setLocaleMessage(locale, allMessages[locale])
    }
  }
}

// biome-ignore lint/suspicious/noExplicitAny: $i18n is provided by @nuxtjs/i18n
async function fetchFreshTranslations(i18n: any): Promise<void> {
  try {
    const results = await Promise.all(
      SUPPORTED_LOCALES.map(async (locale) => {
        const messages = await $fetch<Record<string, string>>(
          buildTranslationsUrl(locale),
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
            credentials: 'include',
          }
        )
        return { locale, messages }
      })
    )

    const fresh: TranslationMessages = {}
    for (const { locale, messages } of results) {
      if (messages) {
        fresh[locale] = messages
      }
    }
    if (Object.keys(fresh).length > 0) {
      applyMessages(i18n, fresh)
    }
  } catch (_err) {
    /* network error */
  }
}

export function registerNucLanguages(nuxtApp: NuxtApp): void {
  nuxtApp.vueApp
    // biome-ignore lint/suspicious/noExplicitAny: nuxtApp.vueApp is a Vue app
    .component('nuc-lang-switcher', NucLangSwitcher as any)
    // biome-ignore lint/suspicious/noExplicitAny: nuxtApp.vueApp is a Vue app
    .component('nuc-translation-dashboard', NucTranslationDashboard as any)
    // biome-ignore lint/suspicious/noExplicitAny: nuxtApp.vueApp is a Vue app
    .component('nuc-translation-page', NucTranslationPage as any)

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
    if (
      lang &&
      SUPPORTED_LOCALES.includes(lang as (typeof SUPPORTED_LOCALES)[number])
    ) {
      i18n.locale.value = lang
    }

    if (import.meta.server) {
      const allMessages: TranslationMessages = {}

      const fetched = await Promise.all(
        SUPPORTED_LOCALES.map(async (locale) => ({
          locale,
          messages: await fetchLocaleMessages(locale),
        }))
      )

      for (const { locale, messages } of fetched) {
        if (messages) {
          allMessages[locale] = messages
        }
      }

      translationState.value = allMessages
      applyMessages(i18n, allMessages)
    }

    if (import.meta.client) {
      // Apply SSR translations immediately (synchronous) — eliminates flash
      if (Object.keys(translationState.value).length > 0) {
        applyMessages(i18n, translationState.value)
      }

      // Refresh from API in background (non-blocking)
      fetchFreshTranslations(i18n).catch((_err) => void _err)
    }
  })
}
