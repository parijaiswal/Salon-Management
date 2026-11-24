/**
 * PinGate.jsx — Wraps a protected screen behind a PIN entry.
 * PIN is remembered for the browser session via sessionStorage.
 */
import React, { useState, useEffect } from 'react'
import { useLang } from '../lang'
import { STAFF_PIN } from '../queueRules'

const SESSION_KEY = 'salon_pin_ok'

export default function PinGate({ children }) {
  const { t } = useLang()
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin]           = useState('')
  const [error, setError]       = useState('')

  // Check session on mount
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'yes') setUnlocked(true)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (pin === STAFF_PIN) {
      sessionStorage.setItem(SESSION_KEY, 'yes')
      setUnlocked(true)
    } else {
      setError(t('pinError'))
      setPin('')
    }
  }

  if (unlocked) return children

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="card w-full max-w-xs flex flex-col gap-6">
        {/* Lock icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-burgundy flex items-center justify-center">
            <svg className="w-8 h-8 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-bold text-center text-stone">{t('pinTitle')}</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => { setPin(e.target.value); setError('') }}
            placeholder={t('pinPlaceholder')}
            className="form-input text-center text-2xl tracking-[0.5em]"
            autoFocus
          />
          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}
          <button type="submit" className="btn-primary">
            {t('pinSubmit')}
          </button>
        </form>
      </div>
    </div>
  )
}
