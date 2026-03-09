<template>
  <div class="translation-manager-sidebar">
    <div class="translation-manager-sidebar-header">
      <h3>{{ t('translation-categories') }}</h3>
    </div>

    <div class="translation-manager-search">
      <ad-input-text
        :model-value="searchQuery"
        :placeholder="t('translation-search-placeholder')"
        ad-type="main"
        class="translation-manager-search-input"
        @update:model-value="$emit('update:searchQuery', $event)"
        @keyup.enter="$emit('search')"
      />
    </div>

    <ul class="translation-manager-category-list">
      <li
        :class="[
          'translation-manager-category-item',
          { 'translation-manager-category-item-active': activeCategory === '' },
        ]"
        @click="$emit('select', '')"
      >
        <span class="translation-manager-category-name">{{ t('translation-all') }}</span>
        <span class="translation-manager-category-count">{{ totalCount }}</span>
      </li>
      <li
        v-for="cat in categories"
        :key="cat.name"
        :class="[
          'translation-manager-category-item',
          { 'translation-manager-category-item-active': cat.name === activeCategory },
        ]"
        @click="$emit('select', cat.name)"
      >
        <span class="translation-manager-category-name">{{ cat.name }}</span>
        <span class="translation-manager-category-count">{{ cat.count }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface CategoryItem {
  name: string
  count: number
}

defineProps<{
  categories: CategoryItem[]
  activeCategory: string
  totalCount: number
  searchQuery: string
}>()

defineEmits<{
  select: [name: string]
  search: []
  'update:searchQuery': [value: string]
}>()

const { t } = useI18n()
</script>

<style lang="scss">
@import 'index';
</style>
