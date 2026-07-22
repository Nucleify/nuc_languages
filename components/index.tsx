'use client'

import { Paginator } from 'primereact/paginator'
import type { JSX } from 'react'
import { useEffect, useMemo } from 'react'

import {
  countChangedTranslations,
  NucTranslationRow,
  NucTranslationSidebar,
  NucTranslationToolbar,
  PER_PAGE,
  resolveScalar,
  t,
  useTranslationEdit,
  useTranslationFetch,
  useTranslationSave,
} from 'nucleify'

import './_index.scss'

export function NucTranslationDashboard(): JSX.Element {
  const {
    editValues,
    setEditValues,
    originalValues,
    setOriginalValues,
    isChanged,
    resetSingle,
    initItems,
  } = useTranslationEdit('next')

  const changedCount = useMemo(
    () => countChangedTranslations(editValues, originalValues),
    [editValues, originalValues]
  )

  const {
    activeLocale,
    activeCategory,
    searchQuery,
    setSearchQuery,
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
  } = useTranslationFetch('next', initItems)

  const { savingIds, savingAll, saveSingle, saveAllChanges } =
    useTranslationSave('next', editValues, originalValues, setOriginalValues, {
      t,
    })

  const totalCount = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.count, 0),
    [categories]
  )

  useEffect(() => {
    void fetchCategories()
  }, [activeLocale])

  useEffect(() => {
    void fetchRows(1)
  }, [activeLocale, activeCategory])

  return (
    <>
      <NucTranslationSidebar
        categories={categories}
        activeCategory={activeCategory}
        totalCount={totalCount}
        searchQuery={searchQuery}
        onSelect={selectCategory}
        onSearch={onSearchEnter}
        onSearchQueryChange={setSearchQuery}
      />

      <div className="translation-manager-content">
        <NucTranslationToolbar
          activeLocale={activeLocale}
          changedCount={changedCount}
          savingAll={resolveScalar(savingAll)}
          onSwitchLocale={switchLocale}
          onSaveAll={() => void saveAllChanges()}
        />

        {loadingRows ? (
          <div className="translation-manager-loading">
            <i className="pi pi-spin pi-spinner" />
            {t('common-loading')}
          </div>
        ) : (
          <>
            <div className="translation-manager-rows">
              {rows.map((item) => {
                const id = item.id
                if (!id) return null
                return (
                  <NucTranslationRow
                    key={id}
                    item={item}
                    editValue={editValues[id] ?? ''}
                    changed={isChanged(id)}
                    saving={resolveScalar(savingIds).has(id)}
                    onSave={() => void saveSingle(item)}
                    onReset={() => resetSingle(id)}
                    onEditValueChange={(value) =>
                      setEditValues((prev) => ({ ...prev, [id]: value }))
                    }
                  />
                )
              })}

              {rows.length === 0 ? (
                <div className="translation-manager-empty">
                  {t('common-no-results')}
                </div>
              ) : null}
            </div>

            {totalRows > PER_PAGE ? (
              <Paginator
                className="translation-manager-paginator"
                rows={PER_PAGE}
                totalRecords={totalRows}
                first={(currentPage - 1) * PER_PAGE}
                currentPageReportTemplate={t('datatable-paginator')}
                onPageChange={onPageChange}
              />
            ) : null}
          </>
        )}
      </div>
    </>
  )
}
