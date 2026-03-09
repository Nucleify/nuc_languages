<template>
  <div class="translation-manager-toolbar">
    <div class="translation-manager-locale-tabs">
      <button
        v-for="locale in locales"
        :key="locale.code"
        :class="[
          'translation-manager-locale-tab',
          { 'translation-manager-locale-tab-active': locale.code === activeLocale },
        ]"
        @click="$emit('switchLocale', locale.code)"
      >
        {{ locale.name }}
      </button>
    </div>

    <div class="translation-manager-actions">
      <span v-if="changedCount > 0" class="translation-manager-changes-badge">
        {{ changedCount }} {{ t('translation-unsaved') }}
      </span>
      <ad-button
        :label="t('translation-save-all')"
        icon="prime:save"
        :disabled="changedCount === 0"
        :loading="savingAll"
        ad-type="main"
        class="translation-manager-save-all-btn"
        @click="$emit('saveAll')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { NUC_LOCALES } from '../../../../constants'

defineProps<{
  activeLocale: string
  changedCount: number
  savingAll: boolean
}>()

defineEmits<{
  switchLocale: [code: string]
  saveAll: []
}>()

const { t } = useI18n()
const locales = NUC_LOCALES
</script>

<style lang="scss">
@import 'index';
</style>
