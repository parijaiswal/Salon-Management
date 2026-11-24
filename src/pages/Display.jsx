/**
 * Display.jsx — Screen 6: "/display" (TV landscape)
 *
 * Implements all specifications from docs/02-screens.md & user answers:
 * - Landscape TV orientation, readable from 5 metres (huge typography, high contrast)
 * - Live digital clock
 * - Left side: One prominent row/card per barber (Ravi, Amit, Geeta):
 *    - Avatar with initials
 *    - Barber name
 *    - "Now: S-12" (or "Free" / "On break")
 *    - Newly called token flashes gold (gold background/border pulse)
 * - Right side: "Up next" list of 5 tokens overall with estimated wait times
 * - Fully responsive, auto-refreshes in real-time via useCustomers() & useSettings()
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useLang } from '../lang'
import LangToggle from '../components/LangToggle'
import BarberAvatar from '../components/BarberAvatar'
import { useCustomers, useSettings } from '../useFirestore'
import {
  STATUSES, currentCustomerForBarber, waitingCustomers, estimatedWait,
} from '../queueRules'

export default function Display() {
  const { t } = useLang()
  const { customers } = useCustomers()
  const { settings }  = useSettings()

  // Live wall clock
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Barbers on duty
  const onDutyBarbers = useMemo(() =>
    (settings?.barbers ?? []).filter(b => b.onDuty), [settings])

  // Next 5 waiting customers overall
  const next5Waiting = useMemo(() => {
    return waitingCustomers(customers).slice(0, 5)
  }, [customers])

  // Check if a customer was newly called in the last 20 seconds (for gold flash effect)
  function isNewlyCalled(customer) {
    if (!customer || customer.status !== STATUSES.CALLED || !customer.calledAt) return false
    const calledMs = typeof customer.calledAt?.toMillis === 'function'
      ? customer.calledAt.toMillis()
      : Number(customer.calledAt)
    const elapsedSec = (Date.now() - calledMs) / 1000
    return elapsedSec >= 0 && elapsedSec <= 20
  }

  const clockString = clock.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  return (
    <div className="min-h-screen bg-cream text-stone flex flex-col font-sans select-none overflow-hidden p-6 md:p-8">
      {/* Top Header: Brand, Live Clock & Lang */}
      <header className="flex items-center justify-between pb-6 border-b-2 border-stone/15">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-burgundy flex items-center justify-center text-cream shadow-md">
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242 3 3 0 014.242 0M9.879 9.879L12 12m0 0L7.757 7.757a3 3 0 10-4.242 4.242 3 3 0 004.242 0" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone">
              {t('salonName')}
            </h1>
            <p className="text-base md:text-lg font-bold text-stone/60 uppercase tracking-widest mt-0.5">
              {t('displayTitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-white px-6 py-2.5 rounded-2xl border-2 border-stone/15 shadow-sm text-center">
            <span className="font-mono text-3xl md:text-4xl font-extrabold text-stone">
              {clockString}
            </span>
          </div>
          <LangToggle />
        </div>
      </header>

      {/* Main Grid: Barbers (Left 65%) + Up Next 5 (Right 35%) */}
      <main className="flex-1 grid grid-cols-12 gap-8 pt-6">

        {/* LEFT SECTION: Barber Rows */}
        <section className="col-span-12 lg:col-span-8 flex flex-col justify-around gap-5">
          {onDutyBarbers.map(barber => {
            const currentCust = currentCustomerForBarber(customers, barber.id)
            const newlyCalled = isNewlyCalled(currentCust)
            const isOnBreak = Boolean(barber.onBreak)

            return (
              <div
                key={barber.id}
                className={`card p-6 md:p-8 rounded-3xl border-3 flex items-center justify-between transition-all shadow-md ${
                  newlyCalled
                    ? 'border-yellow-400 bg-yellow-100/90 ring-4 ring-yellow-400/80 animate-flash-gold'
                    : isOnBreak
                    ? 'border-amber-300 bg-amber-50/70'
                    : currentCust
                    ? 'border-burgundy/30 bg-white'
                    : 'border-emerald-300 bg-emerald-50/50'
                }`}
              >
                {/* Barber Info */}
                <div className="flex items-center gap-6">
                  <BarberAvatar name={barber.name} size={84} />
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black text-stone">
                      {barber.name}
                    </h2>
                    <span className="text-lg md:text-xl font-bold uppercase tracking-wider text-stone/50 mt-1 inline-block">
                      Barber Station
                    </span>
                  </div>
                </div>

                {/* Status / Token */}
                <div className="text-right">
                  {isOnBreak ? (
                    <div className="inline-block bg-amber-200/90 text-amber-950 font-black text-3xl md:text-4xl px-8 py-4 rounded-2xl border-2 border-amber-300">
                      {t('onBreak')}
                    </div>
                  ) : currentCust ? (
                    <div className="flex flex-col items-end">
                      <span className="text-base md:text-lg font-bold text-stone/60 uppercase tracking-widest mb-1">
                        {currentCust.status === STATUSES.CALLED ? t('statusCalled') : 'Serving'}
                      </span>
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl md:text-3xl font-extrabold text-stone/70">
                          Now:
                        </span>
                        <span className={`text-6xl md:text-7xl font-black tracking-tight ${
                          newlyCalled ? 'text-burgundy animate-bounce' : 'text-burgundy'
                        }`}>
                          {currentCust.tokenLabel}
                        </span>
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-stone/80 mt-1">
                        {currentCust.name}
                      </p>
                    </div>
                  ) : (
                    <div className="inline-block bg-emerald-100 text-emerald-900 font-black text-3xl md:text-4xl px-8 py-4 rounded-2xl border-2 border-emerald-300">
                      {t('free')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </section>

        {/* RIGHT SECTION: Up Next 5 List */}
        <section className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-6 md:p-8 border-3 border-stone/15 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b-2 border-stone/10">
              <h2 className="text-3xl md:text-4xl font-black text-stone">
                {t('upNext')}
              </h2>
              <span className="text-base md:text-lg font-bold bg-burgundy/10 text-burgundy px-4 py-1 rounded-full">
                {next5Waiting.length} In Queue
              </span>
            </div>

            <div className="pt-6 space-y-4">
              {next5Waiting.map((cust, idx) => {
                const waitMin = estimatedWait(customers, cust.id, settings)
                return (
                  <div
                    key={cust.id}
                    className="p-4 md:p-5 rounded-2xl bg-cream border-2 border-stone/10 flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg md:text-xl font-bold text-stone/40 w-6">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-3xl md:text-4xl font-black text-burgundy">
                          {cust.tokenLabel}
                        </p>
                        <p className="text-base md:text-lg font-bold text-stone truncate max-w-[160px]">
                          {cust.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl md:text-2xl font-extrabold text-stone">
                        ~{waitMin}
                      </span>
                      <span className="text-sm md:text-base font-semibold text-stone/60 ml-1">
                        {t('min')}
                      </span>
                    </div>
                  </div>
                )
              })}

              {next5Waiting.length === 0 && (
                <div className="py-20 text-center text-stone/40 space-y-3">
                  <svg className="w-16 h-16 mx-auto stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-2xl font-bold text-stone/50">{t('noOneWaiting')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t-2 border-stone/10 text-center">
            <p className="text-sm md:text-base font-semibold text-stone/50">
              Please wait until your token is called.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
