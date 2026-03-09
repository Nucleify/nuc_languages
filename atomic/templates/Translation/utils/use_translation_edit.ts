import { computed, ref } from 'vue'

import type { NucTranslationObjectInterface } from 'nucleify'

export function useTranslationEdit() {
  const editValues = ref<Record<number, string>>({})
  const originalValues = ref<Record<number, string>>({})

  const changedCount = computed(() => {
    let count = 0
    for (const id of Object.keys(editValues.value)) {
      const numId = Number(id)
      if (editValues.value[numId] !== originalValues.value[numId]) {
        count++
      }
    }
    return count
  })

  function isChanged(id: number): boolean {
    return editValues.value[id] !== originalValues.value[id]
  }

  function resetSingle(id: number): void {
    editValues.value[id] = originalValues.value[id]
  }

  function initItems(items: NucTranslationObjectInterface[]): void {
    for (const item of items) {
      if (item.id != null && !(item.id in editValues.value)) {
        editValues.value[item.id] = item.value
        originalValues.value[item.id] = item.value
      }
    }
  }

  return {
    editValues,
    originalValues,
    changedCount,
    isChanged,
    resetSingle,
    initItems,
  }
}
