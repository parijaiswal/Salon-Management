/**
 * Join.jsx — Screen 2: "/join" (phone)
 *
 * Implements all specifications from docs/02-screens.md:
 * - Name field (required)
 * - Phone field (exactly 10 digits, validated, error message below field)
 * - Service cards (multi-select, max 3, active services only, burgundy border + tick)
 * - Barber picker ("Any barber (fastest)" or barber avatar card with On break label)
 * - Live summary bar: "Total 45 min · ₹230 · Expected wait ~35 min"
 * - [ Confirm ] -> creates token, navigates to /status/:id
 * - Errors: invalid phone, no service selected, 4th service blocked with "Maximum 3 services"
 * - If phone already has active spot: shows existing spot instead of creating a duplicate
 */
import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lang'
import LangToggle from '../components/LangToggle'
import BarberAvatar from '../components/BarberAvatar'
import { useCustomers, useSettings, addCustomer } from '../useFirestore'
import {
  hasActiveSpot, estimatedWaitForNew,
  totalMinutes, totalPrice, MAX_SERVICES,
} from '../queueRules'

export default function Join() {
  const { lang, t } = useLang()
  const navigate = useNavigate()

  const { customers } = useCustomers()
  const { settings }  = useSettings()

  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [services, setServices] = useState([]) // array of service IDs
  const [barber, setBarber]     = useState('any')
  const [errors, setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [existingSpot, setExistingSpot] = useState(null)

  // Active services catalogue
  const allServices = useMemo(() =>
    (settings?.services ?? []).filter(s => s.active), [settings])

  // Barbers on duty today
  const onDutyBarbers = useMemo(() =>
    (settings?.barbers ?? []).filter(b => b.onDuty), [settings])

  // Live calculations
  const mins  = totalMinutes(services, settings?.services ?? [])
  const price = totalPrice(services, settings?.services ?? [])
  const wait  = estimatedWaitForNew(customers, settings)

  // ── Service Selection ────────────────────────────────────────────────────────

  function handleServiceClick(svcId) {
    setErrors(prev => ({ ...prev, services: undefined }))

    if (services.includes(svcId)) {
      setServices(prev => prev.filter(id => id !== svcId))
    } else {
      if (services.length >= MAX_SERVICES) {
        setErrors(prev => ({ ...prev, services: t('maxServiceError') }))
        return
      }
      setServices(prev => [...prev, svcId])
    }
  }

  // ── Form Validation ──────────────────────────────────────────────────────────

  function validate() {
    const errs = {}
    if (!name.trim()) {
      errs.name = t('nameError')
    }
    const cleanPhone = phone.trim().replace(/\D/g, '')
    if (cleanPhone.length !== 10) {
      errs.phone = t('phoneError')
    }
    if (services.length === 0) {
      errs.services = t('noServiceError')
    }
    return errs
  }

  // ── Submission ───────────────────────────────────────────────────────────────

  async function handleConfirm() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const cleanPhone = phone.trim().replace(/\D/g, '')

    // Check if phone already has an active spot
    const active = hasActiveSpot(customers, cleanPhone)
    if (active) {
      setExistingSpot(active)
      return
    }

    setSubmitting(true)
    try {
      const created = await addCustomer({
        name:            name.trim(),
        phone:           cleanPhone,
        serviceIds:      services,
        preferredBarber: barber,
        allServices:     settings?.services ?? [],
        allCustomers:    customers,
      })
      navigate(`/status/${created.id}`)
    } catch (err) {
      console.error('Failed to join queue:', err)
      setErrors({ submit: t('error') })
      setSubmitting(false)
    }
  }

  // ── Existing Active Spot View ────────────────────────────────────────────────

  if (existingSpot) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <header className="flex items-center justify-between px-4 pt-6 pb-2 max-w-md mx-auto w-full">
          <button
            onClick={() => navigate('/')}
            className="btn-ghost text-sm flex items-center gap-1 min-h-[44px]"
          >
            ← {t('back')}
          </button>
          <LangToggle />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 max-w-md mx-auto w-full">
          <div className="card w-full text-center p-6 space-y-4 shadow-md border border-stone/5">
            <div className="w-16 h-16 mx-auto rounded-full bg-burgundy/10 flex items-center justify-center text-burgundy">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-semibold text-stone text-lg">
              {t('alreadyInQueue')}
            </p>
            <div className="bg-cream rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-stone/60 font-semibold mb-1">
                {t('yourToken')}
              </p>
              <p className="text-4xl font-extrabold text-burgundy">
                {existingSpot.tokenLabel}
              </p>
            </div>
            <button
              className="btn-primary py-3.5 text-base shadow-sm"
              onClick={() => navigate(`/status/${existingSpot.id}`)}
            >
              {t('viewMySpot')}
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── Main Join View ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate('/')}
          className="btn-ghost text-sm flex items-center gap-1 min-h-[44px]"
        >
          ← {t('back')}
        </button>
        <h1 className="text-lg font-bold text-stone">{t('joinTitle')}</h1>
        <LangToggle />
      </header>

      {/* Form Content */}
      <main className="flex-1 flex flex-col gap-6 px-4 pb-36 pt-2 max-w-md mx-auto w-full overflow-y-auto">

        {/* 1. Name Input */}
        <div>
          <label className="block text-sm font-semibold text-stone mb-1.5">
            {t('yourName')} <span className="text-burgundy">*</span>
          </label>
          <input
            className={`form-input ${errors.name ? 'border-red-500' : ''}`}
            value={name}
            onChange={e => {
              setName(e.target.value)
              if (errors.name) setErrors(er => ({ ...er, name: undefined }))
            }}
            placeholder="e.g. Ramesh Patel"
            autoComplete="name"
          />
          {errors.name && (
            <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.name}</p>
          )}
        </div>

        {/* 2. Phone Input */}
        <div>
          <label className="block text-sm font-semibold text-stone mb-1.5">
            {t('yourPhone')} (10 digits) <span className="text-burgundy">*</span>
          </label>
          <input
            className={`form-input ${errors.phone ? 'border-red-500' : ''}`}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '')
              setPhone(val)
              if (errors.phone) setErrors(er => ({ ...er, phone: undefined }))
            }}
            placeholder="9876543210"
            autoComplete="tel"
          />
          {errors.phone && (
            <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.phone}</p>
          )}
        </div>

        {/* 3. Services Selection (Max 3) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-stone">
              {t('chooseServices')}
            </p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone/10 text-stone">
              {services.length}/3
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {allServices.map(svc => {
              const isSelected = services.includes(svc.id)
              const svcName = (lang === 'gu' && svc.nameGu) ? svc.nameGu : svc.nameEn
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => handleServiceClick(svc.id)}
                  className={`service-card text-left flex items-center justify-between p-3.5 transition-all
                    ${isSelected ? 'service-card-selected ring-2 ring-burgundy bg-burgundy/5' : 'hover:border-stone/20'}`}
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-stone text-base">{svcName}</p>
                    <p className="text-xs text-stone/70 font-medium">
                      {svc.minutes} {t('min')} · ₹{svc.price}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                    ${isSelected ? 'bg-burgundy text-cream' : 'border-2 border-stone/30'}`}
                  >
                    {isSelected && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {errors.services && (
            <p className="text-red-600 text-xs mt-2 font-medium">{errors.services}</p>
          )}
        </div>

        {/* 4. Barber Picker */}
        <div>
          <p className="text-sm font-semibold text-stone mb-2">
            {t('chooseBarber')}
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Any barber (fastest) */}
            <button
              type="button"
              onClick={() => setBarber('any')}
              className={`service-card flex items-center gap-3 p-3.5 transition-all
                ${barber === 'any' ? 'service-card-selected ring-2 ring-burgundy bg-burgundy/5' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center flex-shrink-0 text-stone/70">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-semibold text-stone flex-1 text-left">
                {t('anyBarber')}
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                ${barber === 'any' ? 'bg-burgundy text-cream' : 'border border-stone/30'}`}
              >
                {barber === 'any' && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>

            {/* Individual Barbers on duty */}
            {onDutyBarbers.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBarber(b.id)}
                className={`service-card flex items-center gap-3 p-3.5 transition-all
                  ${barber === b.id ? 'service-card-selected ring-2 ring-burgundy bg-burgundy/5' : ''}`}
              >
                <BarberAvatar name={b.name} size={40} />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-stone">{b.name}</p>
                  {b.onBreak && (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {t('onBreak')}
                    </span>
                  )}
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                  ${barber === b.id ? 'bg-burgundy text-cream' : 'border border-stone/30'}`}
                >
                  {barber === b.id && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {errors.submit && (
          <p className="text-red-600 text-sm font-semibold text-center">{errors.submit}</p>
        )}
      </main>

      {/* Sticky Bottom Bar: Summary + Confirm */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone/10 shadow-lg px-4 py-3 max-w-md mx-auto z-10">
        <p className="text-xs font-semibold text-stone/80 text-center mb-2.5">
          {t('summaryLine', { min: mins, price, wait })}
        </p>
        <button
          className="btn-primary py-3.5 text-base shadow-md disabled:opacity-50"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? t('loading') : t('confirmJoin')}
        </button>
      </div>
    </div>
  )
}
