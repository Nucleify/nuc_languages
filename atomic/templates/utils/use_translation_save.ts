'use client'

import type { Ref } from 'vue'

import type {
  AppFramework,
  AuthFormSetFields,
  NucTranslationObjectInterface,
} from 'nucleify'
import {
  collectChangedTranslations,
  createEntityScalarState,
  flashToast,
  type ReactiveRecord,
  refreshTranslationMessages,
  resolveRecord,
  resolveScalar,
  setRecordValue,
  translationRequests,
} from 'nucleify'

type TranslationParams = Record<string, string | number | undefined>

type TranslateFn = (key: string, params?: TranslationParams) => string

export type TranslationSaveOptions = {
  t?: TranslateFn
}

export function useTranslationSave(
  framework: AppFramework = 'nuxt',
  editValues: ReactiveRecord,
  originalValues: ReactiveRecord,
  setOriginalValuesOrOptions?:
    | AuthFormSetFields<Record<number, string>>
    | TranslationSaveOptions,
  options?: TranslationSaveOptions
) {
  const setOriginalValues =
    typeof setOriginalValuesOrOptions === 'function'
      ? setOriginalValuesOrOptions
      : undefined
  const resolvedOptions =
    typeof setOriginalValuesOrOptions === 'function'
      ? options
      : setOriginalValuesOrOptions
  const translate = resolvedOptions?.t ?? ((key: string) => key)

  const { updateTranslationValue, batchUpdateTranslations } =
    translationRequests(undefined, framework)
  const { value: savingIds, setValue: setSavingIds } = createEntityScalarState(
    framework,
    new Set<number>()
  )
  const { value: savingAll, setValue: setSavingAll } = createEntityScalarState(
    framework,
    false
  )

  async function commitSave(onSuccess: () => void): Promise<void> {
    await refreshTranslationMessages()
    onSuccess()
  }

  function markSavingId(id: number, saving: boolean): void {
    const current = resolveScalar<Set<number>>(savingIds)
    const next = new Set(current)
    if (saving) {
      next.add(id)
    } else {
      next.delete(id)
    }
    setSavingIds(next)
  }

  async function saveSingle(
    item: NucTranslationObjectInterface
  ): Promise<void> {
    if (!item.id) return
    const id = item.id
    const edits = resolveRecord(editValues)

    markSavingId(id, true)

    await updateTranslationValue(id, edits[id] ?? '', () =>
      commitSave(() => {
        if (framework === 'next' && setOriginalValues) {
          setOriginalValues((prev) => ({ ...prev, [id]: edits[id] ?? '' }))
        } else {
          setRecordValue(originalValues, (prev) => ({
            ...prev,
            [id]: edits[id] ?? '',
          }))
        }
        flashToast?.(
          translate('translation-saved-single', { key: item.key }),
          'success'
        )
      })
    )

    markSavingId(id, false)
  }

  async function saveAllChanges(): Promise<void> {
    const items = collectChangedTranslations(
      resolveRecord(editValues),
      resolveRecord(originalValues)
    )
    if (items.length === 0) return

    setSavingAll(true)

    await batchUpdateTranslations(items, () =>
      commitSave(() => {
        if (framework === 'next' && setOriginalValues) {
          setOriginalValues((prev) => {
            const next = { ...prev }
            for (const item of items) next[item.id] = item.value
            return next
          })
        } else {
          setRecordValue(originalValues, (prev) => {
            const next = { ...prev }
            for (const item of items) next[item.id] = item.value
            return next
          })
        }
        flashToast?.(
          translate('translation-saved-all', { count: items.length }),
          'success'
        )
      })
    )

    setSavingAll(false)
  }

  return {
    savingIds: savingIds as Set<number> | Ref<Set<number>>,
    savingAll: savingAll as boolean | Ref<boolean>,
    saveSingle,
    saveAllChanges,
  }
}
