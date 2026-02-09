import type { NuxtApp } from 'nuxt/app'

import en from './locales/en.json'
import pl from './locales/pl.json'

export function registerNucLanguages(nuxtApp: NuxtApp): void {
  nuxtApp.hook('app:created', () => {
    // biome-ignore lint/suspicious/noExplicitAny: $i18n is provided by @nuxtjs/i18n
    const i18n = nuxtApp.$i18n as any
    if (!i18n) return

    i18n.setLocaleMessage('en', en)
    i18n.setLocaleMessage('pl', pl)

    const lang = nuxtApp._route?.params?.lang as string | undefined
    if (lang && ['en', 'pl'].includes(lang)) {
      i18n.locale.value = lang
    }
  })
}
