<template>
  <ad-select
    v-model="selectedLang"
    :options="NUC_LOCALES"
    ad-type="main"
    option-label="name"
    option-value="code"
    class="nuc-lang-switcher"
    @update:model-value="switchLanguage"
  />
</template>

<script setup lang="ts">
import { useNuxtApp, useRoute, useRouter } from 'nuxt/app'
import { computed, ref, watch } from 'vue'

import { NUC_LOCALES } from '../../constants'

const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()

const currentLang = computed(() => (route.params.lang as string) || 'en')
const selectedLang = ref(currentLang.value)

watch(currentLang, (newLang) => {
  selectedLang.value = newLang
})

async function switchLanguage(newLang: string): Promise<void> {
  if (newLang === currentLang.value) return

  // biome-ignore lint/suspicious/noExplicitAny: $i18n is provided by @nuxtjs/i18n
  const i18n = nuxtApp.$i18n as any
  if (i18n) {
    i18n.locale.value = newLang
  }

  const currentPath = route.path
  const newPath = currentPath.replace(`/${currentLang.value}/`, `/${newLang}/`)

  await router.push(newPath)
}
</script>

<style lang="scss">
@import 'index';
</style>

