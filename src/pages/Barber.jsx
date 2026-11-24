/**
 * Barber.jsx — Screen 5: "/barber/:name" (phone)
 *
 * Implements all specifications from docs/02-screens.md & docs/03-flows-rules.md:
 * - Protected by PIN (via PinGate)
 * - Identifies barber by :name parameter (case-insensitive) or quick selector
 * - Current customer:
 *    - Name, token, services
 *    - Live timer since service started
 * - Big Action Buttons:
 *    - [ Start ] when customer arrives (sets status to inChair)
 *    - [ Done ] when service is completed (sets status to done, customer leaves chair)
 * - "Next for you: S-15 Kunal (Haircut)" preview
 * - Toggle: On break / Available
 *    - Rule: Barber can go on break ONLY when no customer is Called or In chair
 * - Empty state: "No customer right now"
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../lang'
import LangToggle from '../components/LangToggle'
import BarberAvatar from '../components/BarberAvatar'
import {
  useCustomers, useSettings, updateCustomer, updateSettings,
} from '../useFirestore'
import {
  STATUSES, currentCustomerForBarber, nextCustomerForBarber,
  canGoOnBreak,
} from '../queueRules'

export default function Barber() {
  const { name: paramName } = useParams()
  const navigate = useNavigate()
  const { lang, t } = useLang()

  const { customers } = useCustomers()
  const { settings }  = useSettings()

  const [breakError, setBreakError] = useState('')

  // Live timer tick every second
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Find barber object from settings
  const currentBarber = useMemo(() => {
    const all = settings?.barbers ?? []
    if (!paramName) return all[0] || null
    return (
      all.find(b => b.name.toLowerCase() === paramName.toLowerCase()) ||
      all.find(b => b.id.toLowerCase() === paramName.toLowerCase()) ||
      all[0] ||
      null
    )
  }, [settings, paramName])

  // Current customer assigned to this barber (Called or In chair)
  const currentCust = useMemo(() => {
    if (!currentBarber) return null
    return currentCustomerForBarber(customers, currentBarber.id)
  }, [customers, currentBarber])

  // Next queued customer eligible for this barber
  const nextCust = useMemo(() => {
    if (!currentBarber) return null
    return nextCustomerForBarber(customers, currentBarber.id, settings)
  }, [customers, currentBarber, settings])

  // Services lookup for current customer
  const currentCustomerServices = useMemo(() => {
    if (!currentCust?.serviceIds) return []
    return (settings?.services ?? []).filter(s => currentCust.serviceIds.includes(s.id))
  }, [currentCust, settings])

  // Services lookup for next customer
  const nextCustomerServices = useMemo(() => {
    if (!nextCust?.serviceIds) return []
    return (settings?.services ?? []).filter(s => nextCust.serviceIds.includes(s.id))
  }, [nextCust, settings])

  // Elapsed timer string for In Chair customer
  const timerDisplay = useMemo(() => {
    if (currentCust?.status !== STATUSES.IN_CHAIR || !currentCust?.startedAt) return '00:00'
    const startedMs = typeof currentCust.startedAt?.toMillis === 'function'
      ? currentCust.startedAt.toMillis()
      : Number(currentCust.startedAt)
    const elapsedSec = Math.max(0, Math.floor((Date.now() - startedMs) / 1000))
    const m = Math.floor(elapsedSec / 60)
    const s = elapsedSec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [currentCust])

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleStart() {
    if (!currentCust) return
    try {
      await updateCustomer(currentCust.id, {
        status:    STATUSES.IN_CHAIR,
        startedAt: Date.now(),
      })
    } catch (err) {
      console.error('Start service failed:', err)
    }
  }

  async function handleDone() {
    if (!currentCust) return
    try {
      await updateCustomer(currentCust.id, {
        status: STATUSES.DONE,
        doneAt: Date.now(),
      })
    } catch (err) {
      console.error('Done service failed:', err)
    }
  }

  async function handleToggleBreak() {
    if (!currentBarber) return
    setBreakError('')

    // Rule: Can go on break ONLY when no customer is Called or In chair
    if (!currentBarber.onBreak && !canGoOnBreak(customers, currentBarber.id)) {
      setBreakError(t('cantBreakBusy'))
      return
    }

    const updatedBarbers = (settings?.barbers ?? []).map(b => {
      if (b.id === currentBarber.id) {
        return { ...b, onBreak: !b.onBreak }
      }
      return b
    })

    try {
      await updateSettings({ barbers: updatedBarbers })
    } catch (err) {
      console.error('Toggle break failed:', err)
    }
  }

  if (!currentBarber) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <p className="text-stone/60 font-semibold">{t('loading')}</p>
      </div>
    )
  }

  const isOnBreak = Boolean(currentBarber.onBreak)

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="bg-white border-b border-stone/10 px-4 py-3 flex items-center justify-between shadow-xs max-w-md mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <BarberAvatar name={currentBarber.name} size={38} />
          <div>
            <h1 className="text-lg font-bold text-stone leading-tight">{currentBarber.name}</h1>
            <p className="text-xs text-stone/50 font-semibold">{t('barberTitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Barber Switcher selector */}
          <select
            value={currentBarber.name.toLowerCase()}
            onChange={e => navigate(`/barber/${e.target.value}`)}
            className="text-xs font-semibold bg-stone/5 border border-stone/20 rounded-lg px-2 py-1 text-stone"
          >
            {(settings?.barbers ?? []).map(b => (
              <option key={b.id} value={b.name.toLowerCase()}>
                {b.name}
              </option>
            ))}
          </select>
          <LangToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full gap-5">

        {/* Break Toggle Section */}
        <div className="card p-4 shadow-sm border border-stone/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone/50 font-bold">
              {t('available')} / {t('onBreak')}
            </p>
            <p className="font-bold text-base text-stone mt-0.5">
              {isOnBreak ? t('onBreak') : t('available')}
            </p>
          </div>

          <button
            onClick={handleToggleBreak}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs ${
              isOnBreak
                ? 'bg-emerald-700 text-cream hover:bg-emerald-800'
                : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
            }`}
          >
            {isOnBreak ? t('toggleAvailable') : t('toggleBreak')}
          </button>
        </div>

        {breakError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
            {breakError}
          </div>
        )}

        {/* Current Customer Card (Primary Focus) */}
        <div className="card flex-1 flex flex-col justify-between p-6 shadow-md border border-stone/10 text-center min-h-[300px]">
          {currentCust ? (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span className={`text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${
                  currentCust.status === STATUSES.CALLED
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentCust.status === STATUSES.CALLED ? t('statusCalled') : t('statusInChair')}
                </span>

                <p className="text-5xl font-black text-burgundy tracking-tight mt-3">
                  {currentCust.tokenLabel}
                </p>
                <h2 className="text-2xl font-bold text-stone mt-1">{currentCust.name}</h2>
                <p className="text-xs text-stone/50 font-medium">{currentCust.phone}</p>
              </div>

              {/* Service details */}
              <div className="bg-cream rounded-xl p-3 text-left space-y-1 border border-stone/10">
                <p className="text-xs uppercase font-bold text-stone/50 tracking-wider">
                  {t('yourServices')}
                </p>
                {currentCustomerServices.map(svc => {
                  const sName = (lang === 'gu' && svc.nameGu) ? svc.nameGu : svc.nameEn
                  return (
                    <div key={svc.id} className="flex justify-between text-xs font-semibold text-stone">
                      <span>{sName}</span>
                      <span>{svc.minutes} {t('min')}</span>
                    </div>
                  )
                })}
              </div>

              {/* Timer since start (if inChair) */}
              {currentCust.status === STATUSES.IN_CHAIR ? (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-stone/50 font-semibold">
                    {t('timeLeft')}
                  </p>
                  <p className="text-4xl font-mono font-black text-stone">
                    {timerDisplay}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-semibold">
                  Customer has been called. Tap Start when they sit in your chair.
                </div>
              )}

              {/* Big Action Buttons: [ Start ] then [ Done ] */}
              <div className="pt-2">
                {currentCust.status === STATUSES.CALLED ? (
                  <button
                    onClick={handleStart}
                    className="btn-primary text-xl py-4 shadow-lg bg-emerald-700 hover:bg-emerald-800"
                  >
                    ▶ {t('startService')}
                  </button>
                ) : (
                  <button
                    onClick={handleDone}
                    className="btn-primary text-xl py-4 shadow-lg bg-burgundy hover:bg-burgundy-dark"
                  >
                    ✓ {t('doneService')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-8">
              <div className="w-16 h-16 rounded-full bg-stone/10 flex items-center justify-center text-stone/40">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-stone/70">
                {isOnBreak ? t('onBreak') : t('noCurrentCustomer')}
              </p>
              <p className="text-xs text-stone/50 max-w-xs">
                Reception will call your next customer as soon as one arrives.
              </p>
            </div>
          )}
        </div>

        {/* "Next for you" Preview Card */}
        <div className="card p-4 shadow-sm border border-stone/10 space-y-1.5">
          <p className="text-xs uppercase tracking-wider text-stone/50 font-bold">
            {t('nextForYou')}
          </p>
          {nextCust ? (
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-extrabold text-burgundy text-base mr-2">
                  {nextCust.tokenLabel}
                </span>
                <span className="font-bold text-stone text-sm">{nextCust.name}</span>
                <p className="text-xs text-stone/60 font-medium">
                  {nextCustomerServices.map(s => (lang === 'gu' && s.nameGu ? s.nameGu : s.nameEn)).join(', ')}
                </p>
              </div>
              <span className="text-xs bg-stone/10 font-bold px-2 py-1 rounded-md text-stone">
                ~{nextCust.totalMinutes} {t('min')}
              </span>
            </div>
          ) : (
            <p className="text-xs text-stone/40 font-medium italic pt-1">
              No customer waiting for you right now.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
