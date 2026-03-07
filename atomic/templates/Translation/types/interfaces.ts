import type { NucTranslationObjectInterface } from 'atomic'

export interface CategoryItem {
  name: string
  count: number
}

export interface PaginatedResponse {
  data: NucTranslationObjectInterface[]
  current_page: number
  last_page: number
  total: number
}
