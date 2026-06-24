'use client'

import type {
  AppFramework,
  AuthFormSetFields,
  NucTranslationObjectInterface,
} from 'nucleify'
import {
  createEntityScalarState,
  mergeTranslationItems,
  resolveRecord,
  setRecordValue,
} from 'nucleify'

export function useTranslationEdit(framework: AppFramework = 'nuxt') {
  const { value: editValues, setValue: setEditValues } =
    createEntityScalarState<Record<number, string>>(framework, {})
  const { value: originalValues, setValue: setOriginalValues } =
    createEntityScalarState<Record<number, string>>(framework, {})

  function isChanged(id: number): boolean {
    const edits = resolveRecord(editValues)
    const originals = resolveRecord(originalValues)
    return edits[id] !== originals[id]
  }

  function resetSingle(id: number): void {
    const originals = resolveRecord(originalValues)
    setRecordValue(editValues, (prev) => ({
      ...prev,
      [id]: originals[id] ?? '',
    }))
  }

  function initItems(items: NucTranslationObjectInterface[]): void {
    if (framework === 'next') {
      const setEdit = setEditValues as AuthFormSetFields<Record<number, string>>
      const setOriginal = setOriginalValues as AuthFormSetFields<
        Record<number, string>
      >
      setEdit((prev) => mergeTranslationItems(prev, items))
      setOriginal((prev) => mergeTranslationItems(prev, items))
      return
    }

    setEditValues(mergeTranslationItems(resolveRecord(editValues), items))
    setOriginalValues(
      mergeTranslationItems(resolveRecord(originalValues), items)
    )
  }

  return {
    editValues,
    setEditValues,
    originalValues,
    setOriginalValues,
    isChanged,
    resetSingle,
    initItems,
  }
}
