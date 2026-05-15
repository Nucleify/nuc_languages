import type { Ref } from 'vue'
import { ref } from 'vue'

import type { NucTranslationObjectInterface } from 'nucleify'
import { apiRequest } from 'nucleify'

import type { CategoryItem, PaginatedResponse } from '../types'

export const PER_PAGE = 100

/** Gateway zwraca `{ data: T }` — spójnie z `apiHandle`. */
function unwrapApiBody<T>(raw: unknown): T | undefined {
  if (raw && typeof raw === 'object' && 'data' in raw)
    return (raw as { data: T }).data
  return raw as T
}

export function useTranslationFetch(
  initItems: (items: NucTranslationObjectInterface[]) => void
) {
  const activeLocale = ref('en')
  const activeCategory = ref('')
  const searchQuery = ref('')
  const currentPage = ref(1)
  const lastPage = ref(1)
  const totalRows = ref(0)
  const rows = ref<NucTranslationObjectInterface[]>([])
  const categories: Ref<CategoryItem[]> = ref([])
  const loadingRows = ref(false)

  function buildUrl(): string {
    const params = new URLSearchParams()
    params.set('locale', activeLocale.value)
    params.set('page', String(currentPage.value))
    params.set('per_page', String(PER_PAGE))

    if (activeCategory.value) {
      params.set('category', activeCategory.value)
    }

    if (searchQuery.value.trim()) {
      params.set('search', searchQuery.value.trim())
    }

    return `${apiUrl()}/translations?${params.toString()}`
  }

  async function fetchRows(): Promise<void> {
    loadingRows.value = true

    try {
      const raw = await apiRequest(buildUrl())
      const response = unwrapApiBody<PaginatedResponse>(raw)

      rows.value = response?.data ?? []
      currentPage.value = response?.current_page ?? 1
      lastPage.value = response?.last_page ?? 1
      totalRows.value = response?.total ?? rows.value.length

      initItems(rows.value)
    } catch {
      rows.value = []
    }

    loadingRows.value = false
  }

  async function fetchCategories(): Promise<void> {
    try {
      const raw = await apiRequest(
        `${apiUrl()}/translations/categories/${activeLocale.value}`
      )
      const list = unwrapApiBody<CategoryItem[]>(raw)
      categories.value = Array.isArray(list) ? list : []
    } catch {
      categories.value = []
    }
  }

  function selectCategory(name: string): void {
    activeCategory.value = name
    currentPage.value = 1
    fetchRows()
  }

  function switchLocale(code: string): void {
    activeLocale.value = code
    currentPage.value = 1
    activeCategory.value = ''
    fetchCategories()
    fetchRows()
  }

  function onPageChange(event: {
    page: number
    first: number
    rows: number
    pageCount?: number
  }): void {
    currentPage.value = event.page + 1
    fetchRows()
  }

  function onSearchEnter(): void {
    currentPage.value = 1
    fetchRows()
  }

  return {
    activeLocale,
    activeCategory,
    searchQuery,
    currentPage,
    lastPage,
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
  }
}
