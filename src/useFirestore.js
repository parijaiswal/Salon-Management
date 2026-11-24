/**
 * useFirestore.js — Instant reactive storage with Firestore real-time sync.
 *
 * Performance Architecture:
 * 1. Zero-delay initial render: Loads immediately from local cache / default settings (<1ms).
 * 2. Instant tab sync: Uses BroadcastChannel for instant cross-tab sync (Phone, Tablet, TV).
 * 3. Firestore sync: If Firebase credentials are set in .env, connects and keeps all devices in sync.
 * 4. Resilient: If Firebase is not configured or network has latency, the app is 100% responsive without loading delay.
 */
import { useState, useEffect } from 'react'
import {
  collection, doc, onSnapshot,
  addDoc, updateDoc, setDoc, serverTimestamp, query, where, getDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import {
  DEFAULT_SETTINGS, DEFAULT_SERVICES, nextTokenLabel, totalMinutes, totalPrice,
} from './queueRules'

const STORAGE_KEY_CUSTOMERS = 'salon_customers_v1'
const STORAGE_KEY_SETTINGS  = 'salon_settings_v1'

// BroadcastChannel for instant multi-tab sync (phone, tablet, TV)
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('salon_sync_channel') : null

function getLocalCustomers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalCustomers(customers) {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers))
  } catch {}
  if (channel) {
    channel.postMessage({ type: 'CUSTOMERS_UPDATED', payload: customers })
  }
}

function getLocalSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS)
    if (!raw) {
      return { ...DEFAULT_SETTINGS, services: DEFAULT_SERVICES }
    }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed, services: parsed.services || DEFAULT_SERVICES }
  } catch {
    return { ...DEFAULT_SETTINGS, services: DEFAULT_SERVICES }
  }
}

function saveLocalSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings))
  } catch {}
  if (channel) {
    channel.postMessage({ type: 'SETTINGS_UPDATED', payload: settings })
  }
}

// ── Live customers hook ─────────────────────────────────────────────────────────

export function useCustomers() {
  const [customers, setCustomers] = useState(getLocalCustomers)
  const [loading, setLoading]     = useState(false) // Never block initial paint

  useEffect(() => {
    // 1. Listen for cross-tab updates
    const handleBroadcast = (e) => {
      if (e.data?.type === 'CUSTOMERS_UPDATED' && Array.isArray(e.data.payload)) {
        setCustomers(e.data.payload)
      }
    }
    if (channel) channel.addEventListener('message', handleBroadcast)

    // 2. If Firebase is active, listen to Firestore
    let unsub = () => {}
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'customers')
        unsub = onSnapshot(colRef, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          setCustomers(docs)
          saveLocalCustomers(docs)
          setLoading(false)
        }, (err) => {
          console.warn('Firestore customers listener error, using local storage:', err)
          setLoading(false)
        })
      } catch (err) {
        console.warn('Firestore setup error:', err)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }

    return () => {
      if (channel) channel.removeEventListener('message', handleBroadcast)
      unsub()
    }
  }, [])

  return { customers, loading }
}

// ── Single customer hook (for My Status screen) ────────────────────────────────

export function useCustomer(customerId) {
  const [customer, setCustomer] = useState(() => {
    const all = getLocalCustomers()
    return all.find(c => String(c.id) === String(customerId)) || null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) return

    // Update from local whenever broadcast arrives
    const handleBroadcast = (e) => {
      if (e.data?.type === 'CUSTOMERS_UPDATED') {
        const found = (e.data.payload || []).find(c => String(c.id) === String(customerId))
        if (found) setCustomer(found)
      }
    }
    if (channel) channel.addEventListener('message', handleBroadcast)

    let unsub = () => {}
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'customers', String(customerId))
        unsub = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            setCustomer({ id: snap.id, ...snap.data() })
          }
          setLoading(false)
        }, (err) => {
          console.warn('Firestore customer listener error:', err)
          setLoading(false)
        })
      } catch (err) {
        console.warn('Single customer fetch error:', err)
        setLoading(false)
      }
    }

    return () => {
      if (channel) channel.removeEventListener('message', handleBroadcast)
      unsub()
    }
  }, [customerId])

  return { customer, loading }
}

// ── Live settings hook ─────────────────────────────────────────────────────────

export function useSettings() {
  const [settings, setSettings] = useState(getLocalSettings)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    const handleBroadcast = (e) => {
      if (e.data?.type === 'SETTINGS_UPDATED' && e.data.payload) {
        setSettings(e.data.payload)
      }
    }
    if (channel) channel.addEventListener('message', handleBroadcast)

    let unsub = () => {}
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'salon')
        unsub = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data()
            setSettings(data)
            saveLocalSettings(data)
          } else {
            // Seed on first run
            const seed = {
              ...DEFAULT_SETTINGS,
              services: DEFAULT_SERVICES,
            }
            setDoc(docRef, seed).catch(() => {})
            setSettings(seed)
            saveLocalSettings(seed)
          }
          setLoading(false)
        }, (err) => {
          console.warn('Firestore settings listener error:', err)
          setLoading(false)
        })
      } catch (err) {
        console.warn('Firestore settings error:', err)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }

    return () => {
      if (channel) channel.removeEventListener('message', handleBroadcast)
      unsub()
    }
  }, [])

  return { settings, loading }
}

// ── Write helpers ─────────────────────────────────────────────────────────────

export async function addCustomer({ name, phone, serviceIds, preferredBarber, allServices, allCustomers }) {
  const { tokenNumber, tokenLabel } = nextTokenLabel(allCustomers)
  const mins  = totalMinutes(serviceIds, allServices)
  const price = totalPrice(serviceIds, allServices)

  const payload = {
    name: name.trim(),
    phone: phone.trim(),
    serviceIds,
    preferredBarber: preferredBarber ?? 'any',
    tokenNumber,
    tokenLabel,
    totalMinutes: mins,
    totalPrice: price,
    status: 'waiting',
    assignedBarber: null,
    calledAt: null,
    startedAt: null,
    doneAt: null,
    createdAt: Date.now(),
  }

  // 1. If Firebase is active, persist to Firestore
  if (isFirebaseConfigured && db) {
    try {
      const ref = await addDoc(collection(db, 'customers'), {
        ...payload,
        createdAt: serverTimestamp(),
      })
      const full = { id: ref.id, ...payload }
      // Also update local list
      const updated = [...allCustomers, full]
      saveLocalCustomers(updated)
      return full
    } catch (err) {
      console.warn('Firestore addDoc failed, writing locally:', err)
    }
  }

  // 2. Local fallback
  const id = 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
  const newCustomer = { id, ...payload }
  const updated = [...allCustomers, newCustomer]
  saveLocalCustomers(updated)
  return newCustomer
}

export async function updateCustomer(id, fields) {
  // Update local immediately for 0ms UI latency
  const current = getLocalCustomers()
  const updated = current.map(c => {
    if (String(c.id) === String(id)) {
      return { ...c, ...fields }
    }
    return c
  })
  saveLocalCustomers(updated)

  // Sync to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'customers', String(id)), fields)
    } catch (err) {
      console.warn('Firestore updateDoc failed:', err)
    }
  }
}

export async function updateSettings(fields) {
  const current = getLocalSettings()
  const updated = { ...current, ...fields }
  saveLocalSettings(updated)

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'settings', 'salon'), fields, { merge: true })
    } catch (err) {
      console.warn('Firestore setDoc failed:', err)
    }
  }
}
