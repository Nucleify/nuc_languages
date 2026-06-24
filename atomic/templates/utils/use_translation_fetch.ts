'use client'

import type {
  AppFramework,
  CategoryItem,
  NucTranslationObjectInterface,
} from 'nucleify'
import {
  createEntityCollectionState,
  createEntityScalarState,
  parseTranslationPage,
  resolveScalar,
  translationRequests,
} from 'nucleify'

export function useTranslationFetch(
  framework: AppFramework = 'nuxt',
  initItems: (items: NucTranslationObjectInterface[]) => void
) {
  const { getTranslationCategories, getTranslationsPage } = translationRequests(
    undefined,
    framework
  )

  const { items: rows, setItems: setRows } =
    createEntityCollectionState<NucTranslationObjectInterface>(framework)
  const { items: categories, setItems: setCategories } =
    createEntityCollectionState<CategoryItem>(framework)
  const { value: activeLocale, setValue: setActiveLocale } =
    createEntityScalarState(framework, 'en')
  const { value: activeCategory, setValue: setActiveCategory } =
    createEntityScalarState(framework, '')
  const { value: searchQuery, setValue: setSearchQuery } =
    createEntityScalarState(framework, '')
  const { value: currentPage, setValue: setCurrentPage } =
    createEntityScalarState(framework, 1)
  const { value: lastPage, setValue: setLastPage } = createEntityScalarState(
    framework,
    1
  )
  const { value: totalRows, setValue: setTotalRows } = createEntityScalarState(
    framework,
    0
  )
  const { value: loadingRows, setValue: setLoadingRows } =
    createEntityScalarState(framework, false)

  async function fetchRows(page?: number): Promise<void> {
    setLoadingRows(true)

    const locale = resolveScalar(activeLocale)
    const category = resolveScalar(activeCategory)
    const search = resolveScalar(searchQuery)
    const resolvedPage = page ?? resolveScalar(currentPage) ?? 1

    if (page !== undefined) {
      setCurrentPage(page)
    }

    const parsed = parseTranslationPage(
      await getTranslationsPage({
        locale,
        page: resolvedPage,
        category: category || undefined,
        search,
      }),
      resolvedPage
    )

    setRows(parsed.rows)
    setCurrentPage(parsed.currentPage)
    setLastPage(parsed.lastPage)
    setTotalRows(parsed.totalRows)
    initItems(parsed.rows)
    setLoadingRows(false)
  }

  async function fetchCategories(): Promise<void> {
    setCategories(await getTranslationCategories(resolveScalar(activeLocale)))
  }

  function selectCategory(name: string): void {
    setActiveCategory(name)
    setCurrentPage(1)
    if (framework === 'nuxt') {
      void fetchRows(1)
    }
  }

  function switchLocale(code: string): void {
    setActiveLocale(code)
    setCurrentPage(1)
    setActiveCategory('')
    if (framework === 'nuxt') {
      void fetchCategories()
      void fetchRows(1)
    }
  }

  function onPageChange(event: { page?: number }): void {
    void fetchRows((event.page ?? 0) + 1)
  }

  function onSearchEnter(): void {
    setCurrentPage(1)
    void fetchRows(1)
  }

  return {
    activeLocale,
    activeCategory,
    searchQuery,
    setSearchQuery,
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
