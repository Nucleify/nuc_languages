import { ref } from 'vue'

import type {
  CloseDialogType,
  EntityResultsType,
  NucTranslationObjectInterface,
  NucTranslationRequestsInterface,
  UseLoadingInterface,
} from 'atomic'
import {
  apiHandle,
  sessionStorageGetItem,
  useApiSuccess,
  useLoading,
} from 'atomic'

export function translationRequests(
  close?: CloseDialogType
): NucTranslationRequestsInterface {
  const results: EntityResultsType<NucTranslationObjectInterface> = ref([])

  const { loading, setLoading }: UseLoadingInterface = useLoading()
  const { apiSuccess } = useApiSuccess()

  async function getAllTranslations(loading?: boolean): Promise<void> {
    await apiHandle<NucTranslationObjectInterface[]>({
      url: apiUrl() + '/translations',
      setLoading: loading ? setLoading : undefined,
      onSuccess: (response: NucTranslationObjectInterface[]) => {
        results.value = response
      },
    })
  }

  async function storeTranslation(
    data: NucTranslationObjectInterface,
    getData: () => Promise<void>
  ): Promise<void> {
    await apiHandle<NucTranslationObjectInterface>({
      url: apiUrl() + '/translations',
      method: 'POST',
      data,
      onSuccess: (response: NucTranslationObjectInterface) => {
        apiSuccess(response, getData, close, 'create')
      },
    })
  }

  async function editTranslation(
    data: NucTranslationObjectInterface,
    getData: () => Promise<void>
  ): Promise<void> {
    await apiHandle<NucTranslationObjectInterface>({
      url: apiUrl() + '/translations',
      method: 'PUT',
      data: data,
      id: data.id,
      onSuccess: (response: NucTranslationObjectInterface) => {
        apiSuccess(response, getData, close, 'edit')
      },
    })
  }

  async function deleteTranslation(
    id: number,
    getData: () => Promise<void>
  ): Promise<void> {
    await apiHandle<NucTranslationObjectInterface>({
      url: apiUrl() + '/translations',
      method: 'DELETE',
      id,
      onSuccess: (response: NucTranslationObjectInterface) => {
        apiSuccess(response, getData, close, 'delete')
      },
    })
  }

  return {
    results,
    loading,
    getAllTranslations,
    storeTranslation,
    editTranslation,
    deleteTranslation,
  }
}
