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
import { onMounted } from 'vue'
import { useNuxtApp, useRoute, useRouter } from 'nuxt/app'
import { computed, ref, watch } from 'vue'

import {
  ensureLocaleTranslations,
  isSupportedLocale,
  NUC_LOCALES,
  prefetchAllLocaleTranslations,
} from 'nucleify'

const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()

const currentLang = computed(() => (route.params.lang as string) || 'en')
const selectedLang = ref(currentLang.value)

watch(currentLang, (newLang) => {
  selectedLang.value = newLang
})

onMounted(() => {
  prefetchAllLocaleTranslations(nuxtApp)
})

async function switchLanguage(newLang: string): Promise<void> {
  if (newLang === currentLang.value) return
  if (!isSupportedLocale(newLang)) return

  await ensureLocaleTranslations(nuxtApp, newLang)

  const currentPath = route.path
  const newPath = currentPath.replace(`/${currentLang.value}/`, `/${newLang}/`)

  await router.push(newPath)
}
</script>

<style lang="scss">
@import 'index';
</style>
