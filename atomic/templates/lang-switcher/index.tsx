'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { JSX } from 'react'
import { useCallback, useMemo } from 'react'

import { AdSelect, NUC_LOCALES, setActiveLocale } from 'nucleify'

import './_index.scss'

function getLangFromPathname(pathname: string): string {
  const [firstSegment] = pathname.split('/').filter(Boolean)
  return firstSegment || 'en'
}

export function NucLangSwitcher(): JSX.Element {
  const pathname = usePathname()
  const router = useRouter()
  const currentLang = useMemo(() => getLangFromPathname(pathname), [pathname])

  const switchLanguage = useCallback(
    (newLang: string | null) => {
      if (!newLang || newLang === currentLang) return

      setActiveLocale(newLang)
      const newPath = pathname.replace(`/${currentLang}/`, `/${newLang}/`)
      if (newPath === pathname) {
        router.push(`/${newLang}/home`)
        return
      }
      router.push(newPath)
    },
    [currentLang, pathname, router]
  )

  return (
    <AdSelect
      className="nuc-lang-switcher"
      panelClassName="nuc-lang-switcher-panel"
      optionLabel="name"
      optionValue="code"
      options={NUC_LOCALES}
      value={currentLang}
      adType="main"
      onChange={(e) => switchLanguage(e.value as string)}
    />
  )
}
