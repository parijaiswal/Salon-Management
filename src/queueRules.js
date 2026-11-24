/**
 * queueRules.js — Single source of truth for all queue business logic.
 *
 * All rules from docs/03-flows-rules.md live here.
 * Import and reuse from every screen; never duplicate logic.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

export const STATUSES = {
  WAITING:   'waiting',
  CALLED:    'called',
  IN_CHAIR:  'inChair',
  DONE:      'done',
  CANCELLED: 'cancelled',
  NO_SHOW:   'noShow',
}

/** PIN shared by Reception, Barber and Admin. */
export const STAFF_PIN = '1234'

/** Minutes before closing time that online joining is disabled (set to 0 so joining stays open until 11:59 PM). */
export const CLOSE_JOIN_BEFORE_MINUTES = 0

/** Minutes after a customer is Called before No-show button becomes active. */
export const NO_SHOW_WAIT_MINUTES = 10

/** Maximum services a customer may select. */
export const MAX_SERVICES = 3

/** Waiting-time highlight threshold in minutes. */
export const AMBER_WAIT_MINUTES = 60

/** "Start coming" prompt: show when customer is this many positions from front. */
export const START_COMING_POSITION = 2

/** Token prefix. */
export const TOKEN_PREFIX = 'S-'

// ── Default seed data (written to Firestore/storage on first run) ─────────────

export const DEFAULT_SERVICES = [
  { id: 'haircut',     nameEn: 'Haircut',      nameGu: 'વાળ કાપવા',    minutes: 30, price: 150, active: true },
  { id: 'beard',       nameEn: 'Beard trim',   nameGu: 'દાઢી ટ્રીમ',   minutes: 15, price: 80,  active: true },
  { id: 'hairspa',     nameEn: 'Hair spa',     nameGu: 'હેર સ્પા',     minutes: 45, price: 400, active: true },
  { id: 'haircolour',  nameEn: 'Hair colour',  nameGu: 'હેર કલર',     minutes: 60, price: 500, active: true },
  { id: 'headmassage', nameEn: 'Head massage', nameGu: 'માથાની માલિશ', minutes: 15, price: 100, active: true },
]

export const DEFAULT_SETTINGS = {
  queueOpen: true,
  openTime:  '09:00',
  closeTime: '23:59',
  barbers: [
    { id: 'ravi',  name: 'Ravi',  onDuty: true,  onBreak: false },
    { id: 'amit',  name: 'Amit',  onDuty: true,  onBreak: false },
    { id: 'geeta', name: 'Geeta', onDuty: true,  onBreak: false },
  ],
}

// ── Colour / avatar helpers ───────────────────────────────────────────────────

const AVATAR_COLOURS = [
  '#7F1D1D', // burgundy
  '#1D4ED8', // blue
  '#065F46', // green
  '#6B21A8', // purple
  '#B45309', // amber
  '#0F766E', // teal
]

/** Returns a consistent colour for a barber name. */
export function barberColour(name = '') {
  if (!name) return AVATAR_COLOURS[0]
  const idx = name.charCodeAt(0) % AVATAR_COLOURS.length
  return AVATAR_COLOURS[idx]
}

/** Returns the initials (up to 2 chars) for a name. */
export function initials(name = '') {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ── Time helpers ──────────────────────────────────────────────────────────────

/** Parse "HH:MM" → { h, m } */
export function parseTime(str = '09:00') {
  const [h, m] = (str || '09:00').split(':').map(Number)
  return { h: isNaN(h) ? 9 : h, m: isNaN(m) ? 0 : m }
}

/** Convert "HH:MM" to a comparable number (e.g. "09:30" → 570). */
export function timeToMinutes(str = '09:00') {
  const { h, m } = parseTime(str)
  return h * 60 + m
}

/** Format minutes-of-day to "9 PM" or "9:30 PM" */
export function formatTimeDisplay(str = '23:59') {
  const { h, m } = parseTime(str)
  const ampm = h < 12 ? 'AM' : 'PM'
  const displayH = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${displayH} ${ampm}` : `${displayH}:${String(m).padStart(2, '0')} ${ampm}`
}

/**
 * Is online joining currently open?
 * Rules:
 *  - settings.queueOpen must be true
 *  - Current time must be within open hours
 *  - Must be more than CLOSE_JOIN_BEFORE_MINUTES before closeTime
 */
export function isOnlineJoinOpen(settings) {
  if (!settings?.queueOpen) return false
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const openMin  = timeToMinutes(settings.openTime  ?? '09:00')
  const closeMin = timeToMinutes(settings.closeTime ?? '23:59')
  if (nowMin < openMin) return false
  if (nowMin >= closeMin - CLOSE_JOIN_BEFORE_MINUTES) return false
  return true
}

/** Is the salon currently within opening hours (walk-ins allowed)? */
export function isSalonOpen(settings) {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const openMin  = timeToMinutes(settings?.openTime  ?? '09:00')
  const closeMin = timeToMinutes(settings?.closeTime ?? '23:59')
  return nowMin >= openMin && nowMin < closeMin
}

// ── Queue helpers ─────────────────────────────────────────────────────────────

/** All customers currently active (not done / cancelled / no-show). */
export function activeCustomers(customers = []) {
  return customers.filter(c =>
    c.status === STATUSES.WAITING ||
    c.status === STATUSES.CALLED  ||
    c.status === STATUSES.IN_CHAIR
  )
}

/** Customers in Waiting state only, ordered by token number. */
export function waitingCustomers(customers = []) {
  return customers
    .filter(c => c.status === STATUSES.WAITING)
    .sort((a, b) => (a.tokenNumber ?? 0) - (b.tokenNumber ?? 0))
}

/**
 * Overall queue position for a customer (1-based, Waiting only).
 * Returns null if the customer is not Waiting.
 */
export function queuePosition(customers = [], customerId) {
  const waiting = waitingCustomers(customers)
  const idx = waiting.findIndex(c => String(c.id) === String(customerId))
  return idx === -1 ? null : idx + 1
}

/**
 * Estimated wait time in minutes for a given customer.
 *
 * Formula from docs: total service-minutes of all customers ahead
 * divided by the number of barbers currently working (on duty & not on break).
 */
export function estimatedWait(customers = [], customerId, settings) {
  const waiting = waitingCustomers(customers)
  const myIdx = waiting.findIndex(c => String(c.id) === String(customerId))
  if (myIdx === -1) return 0

  const ahead = waiting.slice(0, myIdx)
  const totalMinutesAhead = ahead.reduce((sum, c) => sum + (c.totalMinutes ?? 0), 0)

  const workingBarbers = (settings?.barbers ?? []).filter(
    b => b.onDuty && !b.onBreak
  ).length

  if (workingBarbers === 0) return totalMinutesAhead
  return Math.max(0, Math.round(totalMinutesAhead / workingBarbers))
}

/**
 * Overall estimated wait for a NEW customer about to join.
 * Used on the Join screen summary bar and Home screen.
 */
export function estimatedWaitForNew(customers = [], settings) {
  const waiting = waitingCustomers(customers)
  const totalMinutesAhead = waiting.reduce((sum, c) => sum + (c.totalMinutes ?? 0), 0)
  const workingBarbers = (settings?.barbers ?? []).filter(
    b => b.onDuty && !b.onBreak
  ).length
  if (workingBarbers === 0) return totalMinutesAhead
  return Math.max(0, Math.round(totalMinutesAhead / workingBarbers))
}

/**
 * Find the next customer to call for a given barber.
 * Rules:
 *  - Picks the earliest Waiting customer who chose this barber or "any".
 *  - Never picks a customer assigned to a different barber.
 *  - Skips customers whose preferred barber is on break if picking "any" customer.
 */
export function nextCustomerForBarber(customers = [], barberId, settings) {
  const waiting = waitingCustomers(customers)
  return waiting.find(c => {
    if (!c.preferredBarber || c.preferredBarber === 'any') {
      const barber = settings?.barbers?.find(b => b.id === barberId)
      if (barber?.onBreak) return false
      return true
    }
    return c.preferredBarber === barberId
  }) ?? null
}

/**
 * Returns the customer currently assigned to this barber (Called or In Chair).
 */
export function currentCustomerForBarber(customers = [], barberId) {
  return customers.find(
    c =>
      c.assignedBarber === barberId &&
      (c.status === STATUSES.CALLED || c.status === STATUSES.IN_CHAIR)
  ) ?? null
}

/**
 * Can a barber go on break?
 * Rule: only when no customer is Called or In chair for them.
 */
export function canGoOnBreak(customers = [], barberId) {
  return !customers.some(
    c =>
      c.assignedBarber === barberId &&
      (c.status === STATUSES.CALLED || c.status === STATUSES.IN_CHAIR)
  )
}

/**
 * Is a customer eligible for No-show?
 * Rule: must be in Called state, and calledAt must be >= NO_SHOW_WAIT_MINUTES ago.
 */
export function canMarkNoShow(customer) {
  if (customer?.status !== STATUSES.CALLED) return false
  if (!customer.calledAt) return false
  const calledMs = typeof customer.calledAt?.toMillis === 'function'
    ? customer.calledAt.toMillis()
    : Number(customer.calledAt)
  const elapsedMin = (Date.now() - calledMs) / 60000
  return elapsedMin >= NO_SHOW_WAIT_MINUTES
}

/**
 * Returns the remaining seconds before a Called customer can be marked as No-show.
 * Returns 0 if already eligible.
 */
export function noShowRemainingSec(customer) {
  if (customer?.status !== STATUSES.CALLED || !customer.calledAt) return 0
  const calledMs = typeof customer.calledAt?.toMillis === 'function'
    ? customer.calledAt.toMillis()
    : Number(customer.calledAt)
  const elapsedSec = Math.floor((Date.now() - calledMs) / 1000)
  const targetSec = NO_SHOW_WAIT_MINUTES * 60
  return Math.max(0, targetSec - elapsedSec)
}

/**
 * Returns elapsed waiting time in minutes since customer joined.
 */
export function waitingTimeMinutes(customer) {
  if (!customer?.createdAt) return 0
  const createdMs = typeof customer.createdAt?.toMillis === 'function'
    ? customer.createdAt.toMillis()
    : Number(customer.createdAt)
  return Math.max(0, Math.floor((Date.now() - createdMs) / 60000))
}

/** Has a phone number already got an active spot? */
export function hasActiveSpot(customers = [], phone) {
  const cleaned = String(phone || '').replace(/\D/g, '')
  if (!cleaned) return null
  return customers.find(
    c =>
      String(c.phone || '').replace(/\D/g, '') === cleaned &&
      (c.status === STATUSES.WAITING ||
       c.status === STATUSES.CALLED  ||
       c.status === STATUSES.IN_CHAIR)
  ) ?? null
}

/** Generate the next token label, e.g. "S-14". */
export function nextTokenLabel(customers = []) {
  const max = customers.reduce((m, c) => Math.max(m, c.tokenNumber ?? 0), 0)
  return { tokenNumber: max + 1, tokenLabel: `${TOKEN_PREFIX}${max + 1}` }
}

/** Sum of minutes for a list of service IDs against the services catalogue. */
export function totalMinutes(serviceIds = [], allServices = []) {
  return serviceIds.reduce((sum, id) => {
    const svc = allServices.find(s => s.id === id)
    return sum + (svc?.minutes ?? 0)
  }, 0)
}

/** Sum of prices for a list of service IDs. */
export function totalPrice(serviceIds = [], allServices = []) {
  return serviceIds.reduce((sum, id) => {
    const svc = allServices.find(s => s.id === id)
    return sum + (svc?.price ?? 0)
  }, 0)
}

/** Calculate today's summary stats: customers served, average wait in minutes, no-shows. */
export function queueStats(customers = []) {
  const served = customers.filter(c => c.status === STATUSES.DONE)
  const noShows = customers.filter(c => c.status === STATUSES.NO_SHOW)

  // Calculate average wait time (minutes) for customers who waited
  const servedWithWait = served.filter(c => c.createdAt && (c.calledAt || c.startedAt || c.doneAt))

  let avgWait = 0
  if (servedWithWait.length > 0) {
    const totalWait = servedWithWait.reduce((sum, c) => {
      const created = typeof c.createdAt?.toMillis === 'function' ? c.createdAt.toMillis() : Number(c.createdAt)
      const endWait = c.calledAt
        ? (typeof c.calledAt?.toMillis === 'function' ? c.calledAt.toMillis() : Number(c.calledAt))
        : (c.startedAt
            ? (typeof c.startedAt?.toMillis === 'function' ? c.startedAt.toMillis() : Number(c.startedAt))
            : (typeof c.doneAt?.toMillis === 'function' ? c.doneAt.toMillis() : Number(c.doneAt)))
      const waitMin = Math.max(0, Math.round((endWait - created) / 60000))
      return sum + waitMin
    }, 0)
    avgWait = Math.round(totalWait / servedWithWait.length)
  } else {
    // If no one finished yet, compute average wait of currently waiting customers
    const waiting = customers.filter(c => c.status === STATUSES.WAITING && c.createdAt)
    if (waiting.length > 0) {
      const totalWaitMin = waiting.reduce((sum, c) => sum + waitingTimeMinutes(c), 0)
      avgWait = Math.round(totalWaitMin / waiting.length)
    }
  }

  return {
    servedCount: served.length,
    avgWaitMinutes: avgWait,
    noShowCount: noShows.length,
  }
}
