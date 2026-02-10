import type { NuxtApp } from 'nuxt/app'

import { NucLangSwitcher } from './components'
import en from './locales/en.json'
import pl from './locales/pl.json'

export function registerNucLanguages(nuxtApp: NuxtApp): void {
  nuxtApp.vueApp
    // biome-ignore lint/suspicious/noExplicitAny: nuxtApp.vueApp is a Vue app
    .component('nuc-lang-switcher', NucLangSwitcher as any)

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
