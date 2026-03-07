import type { NuxtApp } from 'nuxt/app'
import { useFetch } from 'nuxt/app'

import { NucTranslationDashboard, NucTranslationPage } from './atomic'
import { NucLangSwitcher } from './components'
import en from './locales/en.json'
import pl from './locales/pl.json'
import vn from './locales/vn.json'

const SUPPORTED_LOCALES = ['en', 'pl', 'vn'] as const
const fallbackMessages: Record<string, Record<string, string>> = { en, pl, vn }

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

    for (const locale of SUPPORTED_LOCALES) {
      i18n.setLocaleMessage(locale, fallbackMessages[locale])
    }

    const lang = nuxtApp._route?.params?.lang as string | undefined
    if (
      lang &&
      SUPPORTED_LOCALES.includes(lang as (typeof SUPPORTED_LOCALES)[number])
    ) {
      i18n.locale.value = lang
    }

    const fetched = await Promise.all(
      SUPPORTED_LOCALES.map(async (locale) => ({
        locale,
        messages: await fetchLocaleMessages(locale),
      }))
    )

    for (const { locale, messages } of fetched) {
      if (messages) {
        i18n.setLocaleMessage(locale, messages)
      }
    }
  })
}
