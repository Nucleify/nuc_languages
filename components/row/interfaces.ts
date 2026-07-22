import type { NucTranslationObjectInterface } from 'nucleify'

export interface NucTranslationRowInterface {
  item: NucTranslationObjectInterface
  editValue: string
  changed: boolean
  saving: boolean
  onSave: () => void
  onReset: () => void
  onEditValueChange: (value: string) => void
}
