'use client'

import { AdCard, NucTranslationDashboard } from 'nucleify'

import '../components/_index.scss'

export function NucTranslationPage(): React.JSX.Element {
  return (
    <div className="panel-container">
      <AdCard className="translation-manager-card">
        <NucTranslationDashboard />
      </AdCard>
    </div>
  )
}
