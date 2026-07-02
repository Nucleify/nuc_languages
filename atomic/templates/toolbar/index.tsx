'use client'

import type { JSX } from 'react'

import type { NucTranslationToolbarInterface } from 'nucleify'
import { AdButton, NUC_LOCALES, t } from 'nucleify'

import './_index.scss'

export function NucTranslationToolbar({
  activeLocale,
  changedCount,
  savingAll,
  onSwitchLocale,
  onSaveAll,
}: NucTranslationToolbarInterface): JSX.Element {
  return (
    <div className="translation-manager-toolbar">
      <div className="translation-manager-locale-tabs">
        {NUC_LOCALES.map((locale) => (
          <button
            key={locale.code}
            type="button"
            className={[
              'translation-manager-locale-tab',
              locale.code === activeLocale
                ? 'translation-manager-locale-tab-active'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSwitchLocale(locale.code)}
          >
            {locale.name}
          </button>
        ))}
      </div>

      <div className="translation-manager-actions">
        {changedCount > 0 ? (
          <span className="translation-manager-changes-badge">
            {changedCount} {t('translation-unsaved')}
          </span>
        ) : null}
        <AdButton
          label={t('translation-save-all')}
          icon="prime:save"
          disabled={changedCount === 0}
          loading={savingAll}
          nuiType="main"
          className="translation-manager-save-all-btn"
          onClick={onSaveAll}
        />
      </div>
    </div>
  )
}
