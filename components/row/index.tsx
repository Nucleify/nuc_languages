'use client'

import type { JSX } from 'react'

import type { NucTranslationRowInterface } from 'nucleify'
import { AdButton, AdInputText } from 'nucleify'

import './_index.scss'

export function NucTranslationRow({
  item,
  editValue,
  changed,
  saving,
  onSave,
  onReset,
  onEditValueChange,
}: NucTranslationRowInterface): JSX.Element {
  return (
    <div
      className={[
        'translation-manager-row',
        changed ? 'translation-manager-row-changed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="translation-manager-row-header">
        <div className="translation-manager-row-key">
          <span className="translation-manager-key-label">{item.key}</span>
        </div>

        <div className="translation-manager-row-actions">
          <AdButton
            className="translation-manager-row-save"
            disabled={!changed || saving}
            nuiType="main"
            icon="prime:save"
            text
            onClick={onSave}
          />
          <AdButton
            className="translation-manager-row-reset"
            nuiType="main"
            disabled={!changed}
            icon="prime:undo"
            text
            onClick={onReset}
          />
        </div>
      </div>

      <div className="translation-manager-row-value">
        <AdInputText
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          className="translation-manager-input"
          nuiType="main"
        />
      </div>
    </div>
  )
}
