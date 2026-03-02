import type { NucLocaleInterface } from '../types'

export const NUC_LOCALES: NucLocaleInterface[] = [
  { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
  { code: 'pl', language: 'pl-PL', file: 'pl.json', name: 'Polski' },
  { code: 'vn', language: 'vi-VN', file: 'vn.json', name: 'Tiếng Việt' },
]

export const NUC_DEFAULT_LOCALE = 'en'
