/**
 * Admin.jsx — Screen 7: "/admin" (tablet/laptop)
 *
 * Implements all specifications from docs/02-screens.md & docs/03-flows-rules.md:
 * - Protected by PIN (via PinGate)
 * - Today's stats cards: customers served, average wait, no-shows
 * - Online queue switch: Open / Closed for online joining
 * - Barbers on duty today: toggle per barber
 * - Services list: name (EN/GU), minutes, price, on/off toggle, add/edit
 * - Friendly empty states for all sections
 */
import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lang'
import LangToggle from '../components/LangToggle'
import BarberAvatar from '../components/BarberAvatar'
import { useCustomers, useSettings, updateSettings } from '../useFirestore'
import { queueStats } from '../queueRules'

export default function Admin() {
  const { lang, t } = useLang()
  const navigate = useNavigate()

  const { customers } = useCustomers()
  const { settings }  = useSettings()

  // Computed today's stats from queueRules
  const stats = useMemo(() => queueStats(customers), [customers])

  // Modal state for Add/Edit Service
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState(null)
  const [serviceNameEn, setServiceNameEn]       = useState('')
  const [serviceNameGu, setServiceNameGu]       = useState('')
  const [serviceMinutes, setServiceMinutes]     = useState('30')
  const [servicePrice, setServicePrice]         = useState('150')
  const [serviceError, setServiceError]         = useState('')
  const [savingService, setSavingService]       = useState(false)

  const isQueueOpen = settings?.queueOpen ?? true
  const barbers     = settings?.barbers ?? []
  const services    = settings?.services ?? []

  // ── Queue Switch Handler ───────────────────────────────────────────────────

  async function handleToggleQueue() {
    try {
      await updateSettings({ queueOpen: !isQueueOpen })
    } catch (err) {
      console.error('Failed to toggle queue:', err)
    }
  }

  // ── Barber On-Duty Toggle ──────────────────────────────────────────────────

  async function handleToggleBarberDuty(barberId) {
    try {
      const updated = barbers.map(b =>
        b.id === barberId ? { ...b, onDuty: !b.onDuty } : b
      )
      await updateSettings({ barbers: updated })
    } catch (err) {
      console.error('Failed to toggle barber duty:', err)
    }
  }

  // ── Service Active Toggle ──────────────────────────────────────────────────

  async function handleToggleServiceActive(serviceId) {
    try {
      const updated = services.map(s =>
        s.id === serviceId ? { ...s, active: !s.active } : s
      )
      await updateSettings({ services: updated })
    } catch (err) {
      console.error('Failed to toggle service:', err)
    }
  }

  // ── Add / Edit Service Modal ───────────────────────────────────────────────

  function openAddService() {
    setEditingServiceId(null)
    setServiceNameEn('')
    setServiceNameGu('')
    setServiceMinutes('30')
    setServicePrice('150')
    setServiceError('')
    setShowServiceModal(true)
  }

  function openEditService(service) {
    setEditingServiceId(service.id)
    setServiceNameEn(service.nameEn || '')
    setServiceNameGu(service.nameGu || '')
    setServiceMinutes(String(service.minutes || 30))
    setServicePrice(String(service.price || 0))
    setServiceError('')
    setShowServiceModal(true)
  }

  async function handleSaveService(e) {
    e.preventDefault()
    setServiceError('')

    const nameEn = serviceNameEn.trim()
    const nameGu = serviceNameGu.trim()
    const mins   = parseInt(serviceMinutes, 10)
    const price  = parseInt(servicePrice, 10)

    if (!nameEn || !nameGu) {
      setServiceError(t('serviceNameReq'))
      return
    }
    if (isNaN(mins) || mins < 1) {
      setServiceError(t('serviceDurationReq'))
      return
    }
    if (isNaN(price) || price < 0) {
      setServiceError(t('servicePriceReq'))
      return
    }

    setSavingService(true)
    try {
      let updatedServices = []
      if (editingServiceId) {
        // Edit existing
        updatedServices = services.map(s =>
          s.id === editingServiceId
            ? { ...s, nameEn, nameGu, minutes: mins, price }
            : s
        )
      } else {
        // Add new
        const newId = 'svc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
        updatedServices = [
          ...services,
          {
            id: newId,
            nameEn,
            nameGu,
            minutes: mins,
            price,
            active: true,
          },
        ]
      }
      await updateSettings({ services: updatedServices })
      setShowServiceModal(false)
    } catch (err) {
      console.error('Failed to save service:', err)
      setServiceError(t('error'))
    } finally {
      setSavingService(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col p-4 md:p-6 lg:p-8">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-burgundy flex items-center justify-center text-cream shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone">{t('adminTitle')}</h1>
            <p className="text-xs text-stone/50 font-semibold">{t('salonName')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reception')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-stone/20 text-stone font-semibold text-sm hover:bg-stone/5 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('backToReception')}
          </button>
          <LangToggle />
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto w-full flex flex-col gap-6">

        {/* 1. Today's Stats Cards */}
        <section>
          <h2 className="text-xs uppercase tracking-wider font-bold text-stone/60 mb-3">
            {t('todayStats')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customers Served */}
            <div className="card p-5 shadow-sm border border-stone/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-stone/60">{t('statsServed')}</p>
                <p className="text-3xl font-extrabold text-stone mt-1">{stats.servedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Average Wait */}
            <div className="card p-5 shadow-sm border border-stone/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-stone/60">{t('statsAvgWait')}</p>
                <p className="text-3xl font-extrabold text-stone mt-1">
                  {stats.avgWaitMinutes} <span className="text-base font-semibold text-stone/60">{t('min')}</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* No-Shows */}
            <div className="card p-5 shadow-sm border border-stone/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-stone/60">{t('statsNoShows')}</p>
                <p className="text-3xl font-extrabold text-stone mt-1">{stats.noShowCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>

          {stats.servedCount === 0 && stats.noShowCount === 0 && (
            <p className="text-xs text-stone/40 italic mt-2 text-center">
              {t('noStatsYet')}
            </p>
          )}
        </section>

        {/* 2. Online Queue Switch & Barbers on Duty (Two-column on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Online Queue Control */}
          <section className="card p-6 shadow-sm border border-stone/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-stone">{t('queueSwitch')}</h2>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    isQueueOpen
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {isQueueOpen ? t('queueIsOpen') : t('queueIsClosed')}
                </span>
              </div>
              <p className="text-xs text-stone/60 leading-relaxed mb-6">
                {t('queueSwitchDesc')}
              </p>
            </div>

            <button
              onClick={handleToggleQueue}
              className={`min-h-[44px] w-full py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${
                isQueueOpen
                  ? 'bg-stone/10 hover:bg-stone/20 text-stone border border-stone/20'
                  : 'bg-burgundy text-cream hover:opacity-90'
              }`}
            >
              {isQueueOpen ? t('toggleQueueOpen') : t('toggleQueueClose')}
            </button>
          </section>

          {/* Barbers On Duty */}
          <section className="card p-6 shadow-sm border border-stone/10 flex flex-col">
            <h2 className="text-base font-bold text-stone mb-1">{t('barbersOnDuty')}</h2>
            <p className="text-xs text-stone/60 mb-4">{t('openingHours')}: 09:00 - {settings?.closeTime || '23:59'}</p>

            {barbers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-stone/40 text-xs italic">
                {t('noBarbers')}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {barbers.map(b => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone/5 border border-stone/10"
                  >
                    <div className="flex items-center gap-3">
                      <BarberAvatar name={b.name} size={36} />
                      <div>
                        <p className="font-bold text-sm text-stone">{b.name}</p>
                        <p className="text-xs text-stone/50 font-semibold">
                          {b.onDuty ? t('onDuty') : t('offDuty')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleBarberDuty(b.id)}
                      className={`min-h-[44px] px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                        b.onDuty
                          ? 'bg-emerald-700 text-cream hover:bg-emerald-800'
                          : 'bg-stone/20 text-stone hover:bg-stone/30'
                      }`}
                    >
                      {b.onDuty ? t('onDuty') : t('offDuty')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 3. Services Management */}
        <section className="card p-6 shadow-sm border border-stone/10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-stone">{t('services')}</h2>
              <p className="text-xs text-stone/50">{t('hideServiceNote')}</p>
            </div>
            <button
              onClick={openAddService}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-burgundy text-cream font-bold text-sm hover:opacity-90 transition-opacity shadow-xs flex items-center gap-1.5"
            >
              {t('addService')}
            </button>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-10 text-stone/40 text-xs italic">
              {t('noServices')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map(svc => {
                const displayName = lang === 'gu' ? svc.nameGu : svc.nameEn
                const altName     = lang === 'gu' ? svc.nameEn : svc.nameGu

                return (
                  <div
                    key={svc.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      svc.active
                        ? 'bg-white border-stone/20 shadow-xs'
                        : 'bg-stone/5 border-stone/10 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-stone">{displayName}</h3>
                        <p className="text-xs text-stone/50 font-medium">{altName}</p>
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md ${
                          svc.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone/20 text-stone/60'
                        }`}
                      >
                        {svc.active ? t('activeStatus') : t('inactiveStatus')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone/70 font-semibold pt-1 border-t border-stone/10">
                      <span>{svc.minutes} {t('min')}</span>
                      <span>₹{svc.price}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleToggleServiceActive(svc.id)}
                        className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl font-bold text-xs transition-colors ${
                          svc.active
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                            : 'bg-emerald-700 text-cream hover:bg-emerald-800'
                        }`}
                      >
                        {svc.active ? t('inactiveStatus') : t('activeStatus')}
                      </button>
                      <button
                        onClick={() => openEditService(svc)}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-stone/10 hover:bg-stone/20 text-stone font-bold text-xs transition-colors"
                      >
                        {t('editService')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal: Add / Edit Service */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 shadow-xl border border-stone/10 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone/10 pb-3">
              <h3 className="font-bold text-lg text-stone">
                {editingServiceId ? t('editServiceTitle') : t('addServiceTitle')}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone/10 flex items-center justify-center text-stone font-bold text-lg"
              >
                ×
              </button>
            </div>

            {serviceError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 font-semibold">
                {serviceError}
              </div>
            )}

            <form onSubmit={handleSaveService} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-stone/70 mb-1">
                  {t('serviceName')} (English)
                </label>
                <input
                  type="text"
                  value={serviceNameEn}
                  onChange={e => setServiceNameEn(e.target.value)}
                  placeholder="e.g. Haircut"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone/30 focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-hidden text-sm bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone/70 mb-1">
                  {t('serviceNameGu')}
                </label>
                <input
                  type="text"
                  value={serviceNameGu}
                  onChange={e => setServiceNameGu(e.target.value)}
                  placeholder="દા.ત. વાળ કાપવા"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone/30 focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-hidden text-sm bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone/70 mb-1">
                    {t('serviceDuration')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={serviceMinutes}
                    onChange={e => setServiceMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone/30 focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-hidden text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone/70 mb-1">
                    {t('servicePrice')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={servicePrice}
                    onChange={e => setServicePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone/30 focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-hidden text-sm bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-stone/10">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="min-h-[44px] flex-1 py-2.5 rounded-xl bg-stone/10 hover:bg-stone/20 text-stone font-bold text-sm transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="min-h-[44px] flex-1 py-2.5 rounded-xl bg-burgundy hover:opacity-90 text-cream font-bold text-sm transition-opacity shadow-xs"
                >
                  {savingService ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
