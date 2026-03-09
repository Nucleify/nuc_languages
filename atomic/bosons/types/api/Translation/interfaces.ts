import type {
  DeleteEntityRequestType,
  EditEntityRequestType,
  EntityResultsType,
  GetAllEntitiesRequestType,
  LoadingRefType,
  NucTranslationObjectInterface,
  StoreEntityRequestType,
} from 'nucleify'

export interface NucTranslationRequestsInterface {
  results: EntityResultsType<NucTranslationObjectInterface>
  loading: LoadingRefType
  getAllTranslations: GetAllEntitiesRequestType<NucTranslationObjectInterface>
  storeTranslation: StoreEntityRequestType<NucTranslationObjectInterface>
  editTranslation: EditEntityRequestType<NucTranslationObjectInterface>
  deleteTranslation: DeleteEntityRequestType
}
