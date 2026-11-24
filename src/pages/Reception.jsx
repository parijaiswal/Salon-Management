/**
 * Reception.jsx — Screen 4: "/reception" (tablet landscape)
 *
 * Implements all specifications from docs/02-screens.md & docs/03-flows-rules.md:
 * - Protected by PIN (via PinGate)
 * - Top: Salon brand, language toggle, and [+ Add walk-in] button (with modal)
 * - Left: Barber cards (Ravi, Amit, Geeta) in 3 columns:
 *    - Name, avatar, live status (Free / On break / Serving)
 *    - Current customer info + time-left progress bar
 *    - [ Call next ] strictly follows preference rules (e.g. Amit never gets Ravi's customer)
 * - Right: Waiting list in order of arrival:
 *    - Token, name, services, preferred barber, waiting time
 *    - Highlighted in amber if waiting > 60 minutes
 *    - [ Cancel ] button
 *    - [ No-show ] button enabled after 10 min of being Called
 *    - Empty state: "No one waiting"
 * - New online joiners appear automatically in real time
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lang'
import LangToggle from '../components/LangToggle'
import BarberAvatar from '../components/BarberAvatar'
import {
  useCustomers, useSettings, addCustomer, updateCustomer,
} from '../useFirestore'
import {
  STATUSES, MAX_SERVICES, AMBER_WAIT_MINUTES,
  waitingCustomers, nextCustomerForBarber, currentCustomerForBarber,
  canMarkNoShow, noShowRemainingSec, waitingTimeMinutes,
  hasActiveSpot, totalMinutes, totalPrice,
} from '../queueRules'

export default function Reception() {
  const { lang, t } = useLang()
  const navigate = useNavigate()

  const { customers } = useCustomers()
  const { settings }  = useSettings()

  // Modal for Add Walk-in
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  const [walkInName, setWalkInName]           = useState('')
  const [walkInPhone, setWalkInPhone]         = useState('')
  const [walkInServices, setWalkInServices]   = useState([])
  const [walkInBarber, setWalkInBarber]       = useState('any')
  const [walkInErrors, setWalkInErrors]       = useState({})
  const [walkInSubmitting, setWalkInSubmitting] = useState(false)

  // Local ticker to refresh live minutes and countdowns every second
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Barbers on duty
  const onDutyBarbers = useMemo(() =>
    (settings?.barbers ?? []).filter(b => b.onDuty), [settings])

  // Waiting list in order of joining
  const waitingList = useMemo(() => waitingCustomers(customers), [customers])

  // Active called customers (to manage no-show & arrivals)
  const calledList = useMemo(() =>
    customers.filter(c => c.status === STATUSES.CALLED), [customers])

  // Active services
  const activeServices = useMemo(() =>
    (settings?.services ?? []).filter(s => s.active), [settings])

  // ── Call Next Action ────────────────────────────────────────────────────────

  async function handleCallNext(barberId) {
    const nextCust = nextCustomerForBarber(customers, barberId, settings)
    if (!nextCust) return

    try {
      await updateCustomer(nextCust.id, {
        status:         STATUSES.CALLED,
        assignedBarber: barberId,
        calledAt:       Date.now(),
      })
    } catch (err) {
      console.error('Call next failed:', err)
    }
  }

  // ── No-Show Action ──────────────────────────────────────────────────────────

  async function handleNoShow(customerId) {
    try {
      await updateCustomer(customerId, {
        status: STATUSES.NO_SHOW,
      })
    } catch (err) {
      console.error('No show update failed:', err)
    }
  }

  // ── Cancel Action ───────────────────────────────────────────────────────────

  async function handleCancelSpot(customerId) {
    if (!window.confirm(t('cancelConfirm'))) return
    try {
      await updateCustomer(customerId, {
        status: STATUSES.CANCELLED,
      })
    } catch (err) {
      console.error('Cancel spot failed:', err)
    }
  }

  // ── Walk-in Submit ──────────────────────────────────────────────────────────

  async function handleWalkInSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!walkInName.trim()) {
      errs.name = t('nameError')
    }
    const cleanPhone = walkInPhone.trim().replace(/\D/g, '')
    if (cleanPhone.length !== 10) {
      errs.phone = t('phoneError')
    }
    if (walkInServices.length === 0) {
      errs.services = t('noServiceError')
    }

    if (Object.keys(errs).length > 0) {
      setWalkInErrors(errs)
      return
    }

    // Check one spot per phone
    const existing = hasActiveSpot(customers, cleanPhone)
    if (existing) {
      setWalkInErrors({ phone: t('alreadyInQueue') })
      return
    }

    setWalkInSubmitting(true)
    try {
      await addCustomer({
        name:            walkInName.trim(),
        phone:           cleanPhone,
        serviceIds:      walkInServices,
        preferredBarber: walkInBarber,
        allServices:     settings?.services ?? [],
        allCustomers:    customers,
      })

      // Reset and close
      setWalkInName('')
      setWalkInPhone('')
      setWalkInServices([])
      setWalkInBarber('any')
      setWalkInErrors({})
      setShowWalkInModal(false)
    } catch (err) {
      console.error('Failed to add walk-in:', err)
      setWalkInErrors({ submit: t('error') })
    } finally {
      setWalkInSubmitting(false)
    }
  }

  // Helper to format mm:ss
  function formatSec(sec) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans select-none">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-stone/10 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-burgundy flex items-center justify-center text-cream shadow-xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone leading-tight">{t('receptionTitle')}</h1>
            <p className="text-xs text-stone/50 font-medium">{t('salonName')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick link to display or home */}
          <button
            onClick={() => navigate('/display')}
            className="text-xs font-semibold text-stone/70 border border-stone/20 rounded-full px-3 py-1.5 hover:bg-stone/5 transition-colors"
          >
            {t('displayTitle')} →
          </button>
          <LangToggle />
          <button
            onClick={() => setShowWalkInModal(true)}
            className="btn-primary text-sm py-2 px-5 min-h-[40px] shadow-sm flex items-center gap-1.5"
          >
            <span>{t('addWalkIn')}</span>
          </button>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">

        {/* LEFT COLUMN: Barber Status & Calling Cards (7 cols on landscape) */}
        <section className="col-span-12 lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone uppercase tracking-wider text-xs">
              {t('barbersOnDuty')} ({onDutyBarbers.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {onDutyBarbers.map(barber => {
              const currentCust = currentCustomerForBarber(customers, barber.id)
              const nextEligible = nextCustomerForBarber(customers, barber.id, settings)
              const isOnBreak = Boolean(barber.onBreak)
              const isBusy = Boolean(currentCust)

              // Time-left calculation
              let progressPercent = 0
              let remainingMinutes = 0
              let totalMins = currentCust?.totalMinutes ?? 0

              if (currentCust?.status === STATUSES.IN_CHAIR && currentCust.startedAt) {
                const startedMs = typeof currentCust.startedAt?.toMillis === 'function'
                  ? currentCust.startedAt.toMillis()
                  : Number(currentCust.startedAt)
                const elapsedMin = Math.max(0, (Date.now() - startedMs) / 60000)
                remainingMinutes = Math.max(0, Math.ceil(totalMins - elapsedMin))
                progressPercent = totalMins > 0 ? Math.min(100, Math.round((elapsedMin / totalMins) * 100)) : 0
              }

              return (
                <div
                  key={barber.id}
                  className={`card flex flex-col justify-between p-4 border transition-all shadow-sm ${
                    isOnBreak
                      ? 'border-amber-200 bg-amber-50/40'
                      : isBusy
                      ? 'border-burgundy/20 bg-white'
                      : 'border-emerald-200 bg-emerald-50/20'
                  }`}
                >
                  {/* Barber Header */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <BarberAvatar name={barber.name} size={36} />
                        <div>
                          <p className="font-bold text-stone text-base leading-snug">{barber.name}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                            isOnBreak
                              ? 'bg-amber-100 text-amber-800'
                              : isBusy
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isOnBreak ? t('onBreak') : isBusy ? t('busy') : t('noneInChair')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Current Customer Card / Slot */}
                    <div className="bg-stone/5 rounded-xl p-3 min-h-[92px] flex flex-col justify-center mb-3">
                      {currentCust ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-burgundy text-lg">
                              {currentCust.tokenLabel}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                              currentCust.status === STATUSES.CALLED
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {currentCust.status === STATUSES.CALLED ? t('statusCalled') : t('statusInChair')}
                            </span>
                          </div>
                          <p className="font-semibold text-stone text-xs truncate">
                            {currentCust.name}
                          </p>

                          {/* Time-left progress bar */}
                          {currentCust.status === STATUSES.IN_CHAIR ? (
                            <div className="space-y-1 pt-1">
                              <div className="flex justify-between text-xs text-stone/70 font-medium">
                                <span>{t('timeLeft')}</span>
                                <span>~{remainingMinutes} {t('min')}</span>
                              </div>
                              <div className="w-full bg-stone/20 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-burgundy h-full rounded-full transition-all duration-1000"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-stone/50 italic">
                              Waiting for customer to arrive...
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-stone/40 font-medium text-xs">
                          {isOnBreak ? t('onBreak') : t('noCurrentCustomer')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Next for this barber preview */}
                  <div className="mb-3 text-xs text-stone/70">
                    <span className="font-semibold">{t('nextForYou')}: </span>
                    {nextEligible ? (
                      <span className="font-bold text-stone">
                        {nextEligible.tokenLabel} ({nextEligible.name})
                      </span>
                    ) : (
                      <span className="text-stone/40 italic">None waiting</span>
                    )}
                  </div>

                  {/* Call Next Button */}
                  <button
                    onClick={() => handleCallNext(barber.id)}
                    disabled={isOnBreak || isBusy || !nextEligible}
                    className="btn-primary text-sm py-2.5 shadow-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {t('callNext')}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* RIGHT COLUMN: Waiting List (5 cols on landscape) */}
        <section className="col-span-12 lg:col-span-5 flex flex-col bg-white rounded-2xl p-4 border border-stone/10 shadow-xs h-[calc(100vh-100px)]">
          <div className="flex items-center justify-between pb-3 border-b border-stone/10">
            <div>
              <h2 className="text-base font-bold text-stone">{t('waitingList')}</h2>
              <p className="text-xs text-stone/50 font-medium">
                {waitingList.length} waiting · {calledList.length} called
              </p>
            </div>
          </div>

          {/* Scrollable Queue List */}
          <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
            {/* Show Called customers first so receptionist can track arrival & mark no-show */}
            {calledList.map(cust => {
              const eligibleNoShow = canMarkNoShow(cust)
              const remainingSec = noShowRemainingSec(cust)
              const barberName = (settings?.barbers ?? []).find(b => b.id === cust.assignedBarber)?.name || 'Barber'

              return (
                <div
                  key={cust.id}
                  className="card p-3 border-2 border-amber-300 bg-amber-50/50 shadow-xs flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-burgundy">{cust.tokenLabel}</span>
                      <span className="badge-open bg-amber-600 text-white text-xs px-2 py-0.5">
                        {t('statusCalled')} → {barberName}
                      </span>
                    </div>
                    <span className="text-xs text-stone/50 font-semibold">
                      {cust.phone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone/80">
                    <span className="font-semibold">{cust.name}</span>
                    <span>{cust.totalMinutes} {t('min')} · ₹{cust.totalPrice}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-amber-200">
                    <span className="text-xs font-semibold text-amber-900">
                      {eligibleNoShow
                        ? '10 min elapsed'
                        : `No-show in ${formatSec(remainingSec)}`}
                    </span>
                    <button
                      onClick={() => handleNoShow(cust.id)}
                      disabled={!eligibleNoShow}
                      className="px-3 py-1 rounded-lg text-xs font-bold transition-colors bg-red-700 text-white hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t('markNoShow')}
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Waiting Customers */}
            {waitingList.map((cust, idx) => {
              const waitMins = waitingTimeMinutes(cust)
              const isOverdue = waitMins >= AMBER_WAIT_MINUTES
              const prefBarberObj = (settings?.barbers ?? []).find(b => b.id === cust.preferredBarber)
              const prefLabel = prefBarberObj ? prefBarberObj.name : t('anyBarber')

              return (
                <div
                  key={cust.id}
                  className={`card p-3 border transition-colors shadow-xs flex flex-col gap-2 ${
                    isOverdue
                      ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-400'
                      : 'border-stone/10 bg-white hover:border-stone/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-stone">{cust.tokenLabel}</span>
                      <span className="text-xs text-stone/50 font-bold">#{idx + 1}</span>
                      <span className="font-bold text-stone text-sm">{cust.name}</span>
                    </div>
                    {/* Waiting time badge */}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      isOverdue
                        ? 'bg-amber-200 text-amber-900 font-bold animate-pulse'
                        : 'bg-stone/10 text-stone/70'
                    }`}>
                      {t('waitingTooLong', { min: waitMins })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone/70">
                    <span>
                      <strong className="text-stone font-semibold">{t('yourBarber')}:</strong> {prefLabel}
                    </span>
                    <span>{cust.totalMinutes} {t('min')} · ₹{cust.totalPrice}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-stone/10 text-xs">
                    <span className="text-stone/50 font-medium">{cust.phone}</span>
                    <button
                      onClick={() => handleCancelSpot(cust.id)}
                      className="text-red-700 hover:text-red-900 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                    >
                      {t('cancelSpot')}
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Empty state */}
            {waitingList.length === 0 && calledList.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-center text-stone/40 space-y-2">
                <svg className="w-10 h-10 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="font-semibold text-sm">{t('noOneWaiting')}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Add Walk-in Quick Form Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-stone/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone/10">
              <h3 className="text-lg font-bold text-stone">{t('addWalkIn')}</h3>
              <button
                type="button"
                onClick={() => setShowWalkInModal(false)}
                className="text-stone/50 hover:text-stone text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-stone mb-1 uppercase tracking-wider">
                  {t('yourName')} *
                </label>
                <input
                  className="form-input text-sm py-2"
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  autoFocus
                />
                {walkInErrors.name && (
                  <p className="text-red-600 text-xs mt-1 font-medium">{walkInErrors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-stone mb-1 uppercase tracking-wider">
                  {t('yourPhone')} (10 digits) *
                </label>
                <input
                  className="form-input text-sm py-2"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={walkInPhone}
                  onChange={e => setWalkInPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                />
                {walkInErrors.phone && (
                  <p className="text-red-600 text-xs mt-1 font-medium">{walkInErrors.phone}</p>
                )}
              </div>

              {/* Services multi-select (max 3) */}
              <div>
                <label className="block text-xs font-bold text-stone mb-1 uppercase tracking-wider">
                  {t('chooseServices')}
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto p-1 border border-stone/10 rounded-xl">
                  {activeServices.map(svc => {
                    const isSelected = walkInServices.includes(svc.id)
                    const sName = (lang === 'gu' && svc.nameGu) ? svc.nameGu : svc.nameEn
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setWalkInServices(prev => prev.filter(id => id !== svc.id))
                          } else {
                            if (walkInServices.length >= MAX_SERVICES) return
                            setWalkInServices(prev => [...prev, svc.id])
                          }
                        }}
                        className={`text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all ${
                          isSelected
                            ? 'bg-burgundy text-cream border-burgundy'
                            : 'bg-white text-stone border-stone/15 hover:border-stone/30'
                        }`}
                      >
                        <span>{sName}</span>
                        <span>{svc.minutes}m · ₹{svc.price}</span>
                      </button>
                    )
                  })}
                </div>
                {walkInErrors.services && (
                  <p className="text-red-600 text-xs mt-1 font-medium">{walkInErrors.services}</p>
                )}
              </div>

              {/* Preferred Barber */}
              <div>
                <label className="block text-xs font-bold text-stone mb-1 uppercase tracking-wider">
                  {t('chooseBarber')}
                </label>
                <select
                  value={walkInBarber}
                  onChange={e => setWalkInBarber(e.target.value)}
                  className="form-input text-sm py-2 bg-white"
                >
                  <option value="any">{t('anyBarber')}</option>
                  {onDutyBarbers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.onBreak ? `(${t('onBreak')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {walkInErrors.submit && (
                <p className="text-red-600 text-xs font-medium text-center">{walkInErrors.submit}</p>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="btn-secondary py-2 text-sm flex-1 font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={walkInSubmitting}
                  className="btn-primary py-2 text-sm flex-1 font-semibold"
                >
                  {walkInSubmitting ? t('loading') : t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
