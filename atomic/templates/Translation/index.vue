<template>
  <NucTranslationSidebar
    :categories="categories"
    :active-category="activeCategory"
    :total-count="totalCount"
    :search-query="searchQuery"
    @select="selectCategory"
    @search="onSearchEnter"
    @update:search-query="searchQuery = $event"
  />

  <div class="translation-manager-content">
    <NucTranslationToolbar
      :active-locale="activeLocale"
      :changed-count="changedCount"
      :saving-all="savingAll"
      @switch-locale="switchLocale"
      @save-all="saveAllChanges"
    />

    <div v-if="loadingRows" class="translation-manager-loading">
      <i class="pi pi-spin pi-spinner" />
      {{ t('common-loading') }}
    </div>

    <template v-else>
      <div class="translation-manager-rows">
        <NucTranslationRow
          v-for="item in rows"
          :key="item.id"
          :item="item"
          :edit-value="editValues[item.id!]"
          :changed="isChanged(item.id!)"
          :saving="savingIds.has(item.id!)"
          @save="saveSingle(item)"
          @reset="resetSingle(item.id!)"
          @update:edit-value="editValues[item.id!] = $event"
        />

        <div v-if="rows.length === 0" class="translation-manager-empty">
          {{ t('common-no-results') }}
        </div>
      </div>

      <Paginator
        v-if="totalRows > PER_PAGE"
        :rows="PER_PAGE"
        :total-records="totalRows"
        :first="(currentPage - 1) * PER_PAGE"
        :current-page-report-template="t('datatable-paginator')"
        class="translation-manager-paginator"
        @page="onPageChange"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  NucTranslationRow,
  NucTranslationSidebar,
  NucTranslationToolbar,
} from './index'
import {
  PER_PAGE,
  useTranslationEdit,
  useTranslationFetch,
  useTranslationSave,
} from './utils'

const { t } = useI18n()

const {
  editValues,
  originalValues,
  changedCount,
  isChanged,
  resetSingle,
  initItems,
} = useTranslationEdit()

const {
  activeLocale,
  activeCategory,
  searchQuery,
  currentPage,
  totalRows,
  rows,
  categories,
  loadingRows,
  fetchRows,
  fetchCategories,
  selectCategory,
  switchLocale,
  onPageChange,
  onSearchEnter,
} = useTranslationFetch(initItems)

const { savingIds, savingAll, saveSingle, saveAllChanges } = useTranslationSave(
  editValues,
  originalValues
)

const totalCount = computed(() =>
  categories.value.reduce((sum, cat) => sum + cat.count, 0)
)

fetchCategories()
fetchRows()
</script>

<style lang="scss">
@import 'index';
</style>
