/**
 * LangToggle.jsx — EN/GU toggle button displayed on every screen.
 */
import React from 'react'
import { useLang } from '../lang'

export default function LangToggle() {
  const { t, toggle } = useLang()
  return (
    <button
      onClick={toggle}
      className="text-sm font-semibold text-burgundy border border-burgundy
                 rounded-full px-3 py-1 min-h-[36px] transition-colors
                 hover:bg-burgundy hover:text-cream"
    >
      {t('langToggle')}
    </button>
  )
}
