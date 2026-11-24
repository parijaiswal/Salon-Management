/**
 * Home.jsx — Screen 1: "/" (phone)
 *
 * Implements all specifications from docs/02-screens.md:
 * - Salon name + logo at top
 * - Badge "Open · Closes 9 PM" (burgundy) or "Closed" (grey)
 * - Live card: "6 people waiting · about 50 min" or empty state "No one waiting - walk right in!"
 * - Barber chips with status: Ravi (busy) · Amit (free) · Geeta (on break)
 * - Big burgundy button [ Join Queue ] -> /join
 * - Queue closed state: button disabled, message "Online joining is closed. Walk-ins are welcome!"
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lang'
import LangToggle from '../components/LangToggle'
import BarberAvatar from '../components/BarberAvatar'
import { useCustomers, useSettings } from '../useFirestore'
import {
  isOnlineJoinOpen, isSalonOpen, waitingCustomers,
  estimatedWaitForNew, STATUSES, formatTimeDisplay,
} from '../queueRules'

export default function Home() {
  const { t } = useLang()
  const navigate = useNavigate()

  const { customers } = useCustomers()
  const { settings }  = useSettings()

  const joinOpen    = isOnlineJoinOpen(settings)
  const salonOpen   = isSalonOpen(settings)
  const waiting     = waitingCustomers(customers)
  const waitCount   = waiting.length
  const waitMin     = estimatedWaitForNew(customers, settings)

  // Barbers on duty today
  const barbers = (settings?.barbers ?? []).filter(b => b.onDuty)

  // Barber live status
  function getBarberStatus(b) {
    if (b.onBreak) {
      return { label: t('onBreak'), color: 'text-amber-600' }
    }
    const isBusy = customers.some(
      c => c.assignedBarber === b.id &&
           (c.status === STATUSES.CALLED || c.status === STATUSES.IN_CHAIR)
    )
    if (isBusy) {
      return { label: t('busy'), color: 'text-red-700' }
    }
    return { label: t('free'), color: 'text-emerald-700' }
  }

  const closeLabel = formatTimeDisplay(settings?.closeTime ?? '21:00')

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top Header with Salon Name, Logo, and Lang Toggle */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2 max-w-md mx-auto w-full">
        <div className="flex items-center gap-2.5">
          {/* Salon Logo (Scissors / Salon icon) */}
          <div className="w-10 h-10 rounded-xl bg-burgundy flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242 3 3 0 014.242 0M9.879 9.879L12 12m0 0L7.757 7.757a3 3 0 10-4.242 4.242 3 3 0 004.242 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone">{t('salonName')}</h1>
        </div>
        <LangToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 px-4 pb-8 pt-4 max-w-md mx-auto w-full">

        {/* Open · Closes 9 PM / Closed Badge */}
        <div className="flex justify-center">
          {salonOpen ? (
            <span className="badge-open inline-flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('open')} · {t('closes')} {closeLabel}</span>
            </span>
          ) : (
            <span className="badge-closed inline-flex items-center gap-1.5">
              <span>{t('closed')}</span>
            </span>
          )}
        </div>

        {/* Live Status Card */}
        <div className="card text-center py-6 shadow-sm border border-stone/5">
          {waitCount === 0 ? (
            <div className="space-y-1">
              <p className="text-xl font-bold text-stone">{t('noOneWaiting')}</p>
            </div>
          ) : waitCount === 1 ? (
            <div className="space-y-1">
              <p className="text-2xl font-bold text-stone">
                {t('oneWaiting', { min: waitMin })}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-2xl font-bold text-stone">
                {t('peopleWaiting', { n: waitCount, min: waitMin })}
              </p>
            </div>
          )}
        </div>

        {/* Barber Chips */}
        {barbers.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2.5 justify-center">
              {barbers.map(b => {
                const status = getBarberStatus(b)
                return (
                  <div
                    key={b.id}
                    className="barber-chip shadow-xs transition-transform active:scale-95"
                  >
                    <BarberAvatar name={b.name} size={30} />
                    <span className="text-stone font-medium">{b.name}</span>
                    <span className={`text-xs font-semibold ${status.color}`}>
                      ({status.label})
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Flexible Spacer */}
        <div className="flex-1" />

        {/* Action Button: Join Queue */}
        {joinOpen ? (
          <button
            className="btn-primary text-lg py-4 shadow-md"
            onClick={() => navigate('/join')}
          >
            {t('joinQueue')}
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              className="btn-primary text-lg py-4 opacity-50 cursor-not-allowed"
              disabled
            >
              {t('joinQueue')}
            </button>
            <p className="text-center text-stone/80 text-sm font-medium px-4">
              {t('queueClosed')}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
