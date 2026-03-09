import type { Ref } from 'vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { NucTranslationObjectInterface } from 'nucleify'
import { apiHandle, useAtomicToast } from 'nucleify'

export function useTranslationSave(
  editValues: Ref<Record<number, string>>,
  originalValues: Ref<Record<number, string>>
) {
  const { t } = useI18n()
  const { flashToast } = useAtomicToast()

  const savingIds = ref<Set<number>>(new Set())
  const savingAll = ref(false)

  async function saveSingle(
    item: NucTranslationObjectInterface
  ): Promise<void> {
    if (!item.id) return

    savingIds.value.add(item.id)

    await apiHandle({
      url: apiUrl() + '/translations',
      method: 'PUT',
      id: item.id,
      data: { value: editValues.value[item.id] },
      onSuccess: () => {
        originalValues.value[item.id!] = editValues.value[item.id!]
        savingIds.value.delete(item.id!)
        flashToast?.(
          t('translation-saved-single', { key: item.key }),
          'success'
        )
      },
    })

    savingIds.value.delete(item.id)
  }

  async function saveAllChanges(): Promise<void> {
    const items: { id: number; value: string }[] = []

    for (const id of Object.keys(editValues.value)) {
      const numId = Number(id)
      if (editValues.value[numId] !== originalValues.value[numId]) {
        items.push({ id: numId, value: editValues.value[numId] })
      }
    }

    if (items.length === 0) return

    savingAll.value = true

    await apiHandle({
      url: apiUrl() + '/translations/batch',
      method: 'PUT',
      data: { items },
      onSuccess: () => {
        for (const item of items) {
          originalValues.value[item.id] = item.value
        }
        flashToast?.(
          t('translation-saved-all', { count: items.length }),
          'success'
        )
      },
    })

    savingAll.value = false
  }

  return {
    savingIds,
    savingAll,
    saveSingle,
    saveAllChanges,
  }
}
