'use client'

import type { JSX } from 'react'

import type { CategoryItem } from 'nucleify'
import { AdInputText, t } from 'nucleify'

import './_index.scss'

export interface NucTranslationSidebarProps {
  categories: CategoryItem[]
  activeCategory: string
  totalCount: number
  searchQuery: string
  onSelect: (name: string) => void
  onSearch: () => void
  onSearchQueryChange: (value: string) => void
}

export function NucTranslationSidebar({
  categories,
  activeCategory,
  totalCount,
  searchQuery,
  onSelect,
  onSearch,
  onSearchQueryChange,
}: NucTranslationSidebarProps): JSX.Element {
  return (
    <div className="translation-manager-sidebar">
      <div className="translation-manager-sidebar-header">
        <h3>{t('translation-categories')}</h3>
      </div>

      <div className="translation-manager-search">
        <AdInputText
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch()
          }}
          placeholder={t('translation-search-placeholder')}
          adType="main"
          className="translation-manager-search-input"
        />
      </div>

      <ul className="translation-manager-category-list">
        <li
          className={[
            'translation-manager-category-item',
            activeCategory === ''
              ? 'translation-manager-category-item-active'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelect('')}
        >
          <span className="translation-manager-category-name">
            {t('translation-all')}
          </span>
          <span className="translation-manager-category-count">
            {totalCount}
          </span>
        </li>

        {categories.map((cat) => (
          <li
            key={cat.name}
            className={[
              'translation-manager-category-item',
              cat.name === activeCategory
                ? 'translation-manager-category-item-active'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelect(cat.name)}
          >
            <span className="translation-manager-category-name">
              {cat.name}
            </span>
            <span className="translation-manager-category-count">
              {cat.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
