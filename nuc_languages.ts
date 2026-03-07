import type { NuxtApp } from 'nuxt/app'
import { useFetch } from 'nuxt/app'

import { NucTranslationDashboard, NucTranslationPage } from './atomic'
import { NucLangSwitcher } from './components'

const SUPPORTED_LOCALES = ['en', 'pl', 'vn'] as const
const PAYLOAD_KEY = '_translations'

type TranslationMessages = Record<string, Record<string, string>>

async function fetchLocaleMessages(
  locale: string
): Promise<Record<string, string> | null> {
  try {
    const url = `${apiUrl()}/translations/locale/${locale}`
    const { data } = await useFetch<Record<string, string>>(url)
    return data.value
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
async function fetchFreshTranslations(i18n: any): Promise<boolean> {
  try {
    const results = await Promise.all(
      SUPPORTED_LOCALES.map(async (locale) => {
        const messages = await $fetch<Record<string, string>>(
          `${apiUrl()}/translations/locale/${locale}`,
          { credentials: 'include' }
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
      return true
    }
  } catch {
    /* network error */
  }
  return false
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

    const lang = nuxtApp._route?.params?.lang as string | undefined
    if (
      lang &&
      SUPPORTED_LOCALES.includes(lang as (typeof SUPPORTED_LOCALES)[number])
    ) {
      i18n.locale.value = lang
    }

    if (import.meta.dev) {
      const [en, pl, vn] = await Promise.all([
        import('./locales/en.json'),
        import('./locales/pl.json'),
        import('./locales/vn.json'),
      ])
      applyMessages(i18n, { en: en.default, pl: pl.default, vn: vn.default })
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

      applyMessages(i18n, allMessages)
      nuxtApp.payload[PAYLOAD_KEY] = allMessages
    }

    if (import.meta.client) {
      const fetched = await fetchFreshTranslations(i18n)

      if (!fetched) {
        const payloadMessages = nuxtApp.payload?.[PAYLOAD_KEY] as
          | TranslationMessages
          | undefined
        if (payloadMessages && Object.keys(payloadMessages).length > 0) {
          applyMessages(i18n, payloadMessages)
        }
      }
    }
  })
}
