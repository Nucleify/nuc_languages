<template>
  <div
    :class="[
      'translation-manager-row',
      { 'translation-manager-row-changed': changed },
    ]"
  >
    <div class="translation-manager-row-key">
      <span class="translation-manager-key-label">{{ item.key }}</span>
    </div>

    <div class="translation-manager-row-value">
      <ad-input-text
        :model-value="editValue"
        class="translation-manager-input"
        ad-type="main"
        @update:model-value="$emit('update:editValue', $event)"
      />
    </div>

    <div class="translation-manager-row-actions">
      <ad-button
        class="translation-manager-row-save"
        :disabled="!changed || saving"
        ad-type="main"
        icon="prime:save"
        text
        @click="$emit('save')"
      />
      <ad-button
        class="translation-manager-row-reset"
        ad-type="main"
        :disabled="!changed"
        icon="prime:undo"
        text
        @click="$emit('reset')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NucTranslationObjectInterface } from 'atomic'

defineProps<{
  item: NucTranslationObjectInterface
  editValue: string
  changed: boolean
  saving: boolean
}>()

defineEmits<{
  save: []
  reset: []
  'update:editValue': [value: string]
}>()
</script>

<style lang="scss">
@import 'index';
</style>
