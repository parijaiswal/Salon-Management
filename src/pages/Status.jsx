/**
 * Status.jsx — Screen 3: "/status/:id" (phone)
 *
 * Implements all specifications from docs/02-screens.md:
 * - Large token "S-14" and position "4th in line"
 * - Circular countdown "about 35 min" (refreshes automatically)
 * - Selected barber and services listed below
 * - When 2nd in line: banner "Start coming to the salon"
 * - When called: full-screen burgundy with cream text "It's your turn! Go to Ravi", gentle pulse, phone vibration
 * - If chosen barber is on break: notice "Ravi is on break"
 * - [ Cancel my spot ] with confirmation modal ("Are you sure?" Yes / No)
 * - Cancelled / no-show state: message and a button to join again
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../lang'
import LangToggle from '../components/LangToggle'
import BarberAvatar from '../components/BarberAvatar'
import { useCustomer, useCustomers, useSettings, updateCustomer } from '../useFirestore'
import {
  STATUSES, queuePosition, estimatedWait,
  START_COMING_POSITION,
} from '../queueRules'

export default function Status() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang, t } = useLang()

  const { customer, loading: cLoading } = useCustomer(id)
  const { customers }                   = useCustomers()
  const { settings }                    = useSettings()

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling]           = useState(false)

  // ── Position & Wait Time ───────────────────────────────────────────────────

  const position = useMemo(() => {
    if (!customer || customer.status !== STATUSES.WAITING) return null
    return queuePosition(customers, customer.id)
  }, [customers, customer])

  const waitMin = useMemo(() => {
    if (!customer || customer.status !== STATUSES.WAITING) return 0
    return estimatedWait(customers, customer.id, settings)
  }, [customers, customer, settings])

  // ── Barber & Services Info ─────────────────────────────────────────────────

  const chosenBarber = useMemo(() => {
    if (!customer?.preferredBarber || customer.preferredBarber === 'any') return null
    return (settings?.barbers ?? []).find(b => b.id === customer.preferredBarber)
  }, [customer, settings])

  const assignedBarberObj = useMemo(() => {
    if (!customer?.assignedBarber) return null
    return (settings?.barbers ?? []).find(b => b.id === customer.assignedBarber)
  }, [customer, settings])

  const selectedServices = useMemo(() => {
    if (!customer?.serviceIds) return []
    return (settings?.services ?? []).filter(s => customer.serviceIds.includes(s.id))
  }, [customer, settings])

  // ── Phone Vibration when Called ────────────────────────────────────────────

  useEffect(() => {
    if (customer?.status === STATUSES.CALLED) {
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate([400, 200, 400, 200, 400])
        }
      } catch {}
    }
  }, [customer?.status])

  // ── Cancellation Handler ───────────────────────────────────────────────────

  async function handleCancelSpot() {
    setCancelling(true)
    try {
      await updateCustomer(customer.id, { status: STATUSES.CANCELLED })
      setShowCancelModal(false)
    } catch (err) {
      console.error('Cancel failed:', err)
    } finally {
      setCancelling(false)
    }
  }

  // ── Loading & Not Found ────────────────────────────────────────────────────

  if (cLoading && !customer) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-stone/60 font-medium">{t('loading')}</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="card text-center p-6 space-y-4 max-w-sm w-full">
          <p className="text-lg font-bold text-stone">{t('notFound')}</p>
          <button className="btn-primary py-3" onClick={() => navigate('/')}>
            {t('back')}
          </button>
        </div>
      </div>
    )
  }

  // ── Full-screen CALLED Alert State ─────────────────────────────────────────

  if (customer.status === STATUSES.CALLED) {
    const barberName = assignedBarberObj?.name || chosenBarber?.name || 'Reception'
    return (
      <div className="min-h-screen bg-burgundy text-cream flex flex-col justify-between p-6 select-none animate-pulse-soft">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm tracking-wider uppercase opacity-80 font-bold">
            {t('salonName')}
          </span>
          <LangToggle />
        </div>

        {/* Center Alert */}
        <div className="text-center space-y-6 max-w-sm mx-auto my-auto py-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-cream/20 flex items-center justify-center border-4 border-cream/40">
            <svg className="w-12 h-12 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          <div className="bg-cream/10 rounded-2xl py-3 px-6 inline-block border border-cream/20">
            <span className="text-xs uppercase tracking-widest font-bold opacity-90">
              {t('yourToken')}
            </span>
            <p className="text-5xl font-extrabold tracking-tight mt-1">{customer.tokenLabel}</p>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold leading-tight">
              {t('itsYourTurn', { barber: barberName })}
            </h1>
            <p className="text-cream/90 text-lg font-medium">
              {t('goTo', { barber: barberName })}
            </p>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="text-center text-xs opacity-70 pb-2">
          {customer.name} · {customer.phone}
        </div>
      </div>
    )
  }

  // ── CANCELLED or NO-SHOW State ─────────────────────────────────────────────

  if (customer.status === STATUSES.CANCELLED || customer.status === STATUSES.NO_SHOW || customer.status === STATUSES.DONE) {
    const isCancelled = customer.status === STATUSES.CANCELLED
    const isNoShow    = customer.status === STATUSES.NO_SHOW

    return (
      <div className="min-h-screen bg-cream flex flex-col justify-between p-4 max-w-md mx-auto w-full">
        <header className="flex items-center justify-between pt-4 pb-2">
          <span className="text-lg font-bold text-stone">{t('salonName')}</span>
          <LangToggle />
        </header>

        <main className="card text-center p-6 space-y-5 my-auto shadow-sm border border-stone/5">
          <div className="w-16 h-16 mx-auto rounded-full bg-stone/10 flex items-center justify-center text-stone/60">
            {isCancelled ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-bold text-stone">{customer.tokenLabel}</p>
            <p className="text-base text-stone/80 font-medium">
              {isCancelled ? t('spotCancelled') : isNoShow ? t('spotNoShow') : t('statusDone')}
            </p>
          </div>

          <button
            className="btn-primary py-3.5 text-base shadow-sm"
            onClick={() => navigate('/join')}
          >
            {t('joinAgain')}
          </button>
        </main>

        <div className="pb-4" />
      </div>
    )
  }

  // ── IN CHAIR State ─────────────────────────────────────────────────────────

  if (customer.status === STATUSES.IN_CHAIR) {
    return (
      <div className="min-h-screen bg-cream flex flex-col justify-between p-4 max-w-md mx-auto w-full">
        <header className="flex items-center justify-between pt-4 pb-2">
          <span className="text-lg font-bold text-stone">{t('salonName')}</span>
          <LangToggle />
        </header>

        <main className="card text-center p-6 space-y-4 my-auto shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-4xl font-extrabold text-stone">{customer.tokenLabel}</p>
          <p className="text-lg font-semibold text-emerald-800">{t('statusInChair')}</p>
          <p className="text-sm text-stone/70">
            {customer.name} · {assignedBarberObj?.name ? `${t('goTo', { barber: assignedBarberObj.name })}` : ''}
          </p>
        </main>

        <div className="pb-4" />
      </div>
    )
  }

  // ── Standard WAITING View ──────────────────────────────────────────────────

  const isChosenBarberOnBreak = Boolean(chosenBarber?.onBreak)
  const isCloseInLine = position !== null && position <= START_COMING_POSITION

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2 max-w-md mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-burgundy flex items-center justify-center text-cream">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242 3 3 0 014.242 0M9.879 9.879L12 12m0 0L7.757 7.757a3 3 0 10-4.242 4.242 3 3 0 004.242 0" />
            </svg>
          </div>
          <span className="text-xl font-bold text-stone">{t('salonName')}</span>
        </div>
        <LangToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-5 px-4 py-4 max-w-md mx-auto w-full">

        {/* 1. "Start coming to the salon" alert banner when 2nd in line */}
        {isCloseInLine && (
          <div className="bg-burgundy text-cream px-4 py-3.5 rounded-xl shadow-md flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-cream/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="font-bold text-sm tracking-wide">
              {t('startComing')}
            </p>
          </div>
        )}

        {/* 2. Barber On Break Notice */}
        {isChosenBarberOnBreak && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-xl flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 font-bold text-xs">
              !
            </div>
            <p className="text-sm font-semibold">
              {t('barberOnBreak', { barber: chosenBarber.name })}
            </p>
          </div>
        )}

        {/* 3. Token & Position Hero Card */}
        <div className="card text-center p-6 shadow-sm border border-stone/5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-stone/60 font-semibold mb-1">
              {t('yourToken')}
            </p>
            <p className="text-5xl font-black text-burgundy tracking-tight">
              {customer.tokenLabel}
            </p>
          </div>

          {position !== null && (
            <div className="inline-block bg-cream px-4 py-1.5 rounded-full border border-stone/10">
              <p className="text-base font-bold text-stone">
                {t('positionIn', { n: position })}
              </p>
            </div>
          )}

          {/* 4. Circular Countdown */}
          <div className="pt-2 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Circular SVG Track */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#E7E5E4"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#7F1D1D"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={Math.max(20, Math.min(240, 264 - (waitMin / 60) * 264))}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000"
                />
              </svg>
              {/* Center Countdown Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span className="text-xs font-semibold uppercase text-stone/60 tracking-wider">
                  {t('timeLeft')}
                </span>
                <span className="text-2xl font-black text-stone mt-0.5">
                  ~{waitMin}
                </span>
                <span className="text-xs font-medium text-stone/70">
                  {t('min')}
                </span>
              </div>
            </div>
            <p className="text-xs text-stone/50 mt-2 font-medium">
              {t('aboutWait', { min: waitMin })}
            </p>
          </div>
        </div>

        {/* 5. Selected Barber & Services Info Card */}
        <div className="card p-4 space-y-4 shadow-sm border border-stone/5">
          {/* Barber */}
          <div>
            <p className="text-xs font-semibold uppercase text-stone/50 tracking-wider mb-2">
              {t('yourBarber')}
            </p>
            <div className="flex items-center gap-3">
              {chosenBarber ? (
                <>
                  <BarberAvatar name={chosenBarber.name} size={36} />
                  <div>
                    <p className="font-semibold text-stone">{chosenBarber.name}</p>
                    {chosenBarber.onBreak && (
                      <span className="text-xs font-semibold text-amber-600">
                        {t('onBreak')}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-stone font-medium text-sm">
                  <div className="w-8 h-8 rounded-full bg-stone/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span>{t('anyBarber')}</span>
                </div>
              )}
            </div>
          </div>

          <hr className="border-stone/10" />

          {/* Services */}
          <div>
            <p className="text-xs font-semibold uppercase text-stone/50 tracking-wider mb-2">
              {t('yourServices')}
            </p>
            <div className="space-y-1.5">
              {selectedServices.map(svc => {
                const sName = (lang === 'gu' && svc.nameGu) ? svc.nameGu : svc.nameEn
                return (
                  <div key={svc.id} className="flex justify-between items-center text-sm">
                    <span className="text-stone font-medium">{sName}</span>
                    <span className="text-stone/70 text-xs">
                      {svc.minutes} {t('min')} · ₹{svc.price}
                    </span>
                  </div>
                )
              })}
              <div className="pt-2 border-t border-dashed border-stone/20 flex justify-between items-center text-sm font-bold text-stone">
                <span>Total</span>
                <span>{customer.totalMinutes} {t('min')} · ₹{customer.totalPrice}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Cancel My Spot Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="btn-ghost w-full text-center text-burgundy font-semibold text-sm hover:text-burgundy-dark"
          >
            {t('cancelMySpot')}
          </button>
        </div>
      </main>

      {/* Confirmation Pop-up Modal for Cancel */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-stone/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-xs p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-stone">
                {t('cancelConfirmTitle')}
              </h3>
              <p className="text-sm text-stone/70">
                {t('cancelConfirm')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="btn-secondary py-2.5 flex-1 text-sm font-semibold"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                {t('no')}
              </button>
              <button
                type="button"
                className="btn-primary py-2.5 flex-1 text-sm font-semibold bg-red-700 hover:bg-red-800"
                onClick={handleCancelSpot}
                disabled={cancelling}
              >
                {cancelling ? t('loading') : t('yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
