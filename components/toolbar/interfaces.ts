export interface NucTranslationToolbarInterface {
  activeLocale: string
  changedCount: number
  savingAll: boolean
  onSwitchLocale: (code: string) => void
  onSaveAll: () => void
}
