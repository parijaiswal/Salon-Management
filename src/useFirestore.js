/**
 * useFirestore.js — Instant reactive storage with Firestore real-time sync.
 *
 * Performance Architecture:
 * 1. Direct Firestore Read & Write: Join Queue & My Status read and save directly to Cloud Firestore.
 * 2. Instant tab sync: Uses BroadcastChannel + in-memory listeners for zero-delay cross-screen updates.
 * 3. Real-time Listeners: onSnapshot keeps Phone, Tablet, Barber view and TV in live sync.
 */
import { useState, useEffect } from 'react'
import {
  collection, doc, onSnapshot,
  addDoc, updateDoc, setDoc, getDocs, getDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import {
  DEFAULT_SETTINGS, DEFAULT_SERVICES, nextTokenLabel, totalMinutes, totalPrice,
  hasActiveSpot,
} from './queueRules'

const STORAGE_KEY_CUSTOMERS = 'salon_customers_v1'
const STORAGE_KEY_SETTINGS  = 'salon_settings_v1'

// BroadcastChannel for instant multi-tab sync (phone, tablet, TV)
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('salon_sync_channel') : null

// In-memory subscribers to guarantee immediate re-rendering in the current tab
const customersSubscribers = new Set()
const settingsSubscribers  = new Set()

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
  // Notify all components in the current tab immediately
  customersSubscribers.forEach(cb => {
    try { cb(customers) } catch {}
  })
  // Broadcast to other tabs
  if (channel) {
    try {
      channel.postMessage({ type: 'CUSTOMERS_UPDATED', payload: customers })
    } catch {}
  }
}

function getLocalSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS)
    if (!raw) {
      return { ...DEFAULT_SETTINGS, services: DEFAULT_SERVICES }
    }
    const parsed = JSON.parse(raw)
    const settings = { ...DEFAULT_SETTINGS, ...parsed, services: parsed.services || DEFAULT_SERVICES }
    if (settings.closeTime === '21:00') {
      settings.closeTime = '23:59'
    }
    return settings
  } catch {
    return { ...DEFAULT_SETTINGS, services: DEFAULT_SERVICES }
  }
}

function saveLocalSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings))
  } catch {}
  // Notify all components in the current tab immediately
  settingsSubscribers.forEach(cb => {
    try { cb(settings) } catch {}
  })
  // Broadcast to other tabs
  if (channel) {
    try {
      channel.postMessage({ type: 'SETTINGS_UPDATED', payload: settings })
    } catch {}
  }
}

// ── Live customers hook ─────────────────────────────────────────────────────────

export function useCustomers() {
  const [customers, setCustomers] = useState(getLocalCustomers)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    // 1. Subscribe to in-memory updates within this window
    customersSubscribers.add(setCustomers)

    // 2. Listen for cross-tab updates via BroadcastChannel
    const handleBroadcast = (e) => {
      if (e.data?.type === 'CUSTOMERS_UPDATED' && Array.isArray(e.data.payload)) {
        setCustomers(e.data.payload)
      }
    }
    if (channel) channel.addEventListener('message', handleBroadcast)

    // 3. Connect to Firestore real-time collection
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
      customersSubscribers.delete(setCustomers)
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customerId) {
      setLoading(false)
      return
    }

    setLoading(true)

    // Listen to local in-memory updates
    const handleLocalUpdate = (all) => {
      const found = all.find(c => String(c.id) === String(customerId))
      if (found) setCustomer(found)
    }
    customersSubscribers.add(handleLocalUpdate)

    // Listen for cross-tab broadcasts
    const handleBroadcast = (e) => {
      if (e.data?.type === 'CUSTOMERS_UPDATED') {
        const found = (e.data.payload || []).find(c => String(c.id) === String(customerId))
        if (found) setCustomer(found)
      }
    }
    if (channel) channel.addEventListener('message', handleBroadcast)

    // Live real-time listener to Firestore document
    let unsub = () => {}
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'customers', String(customerId))
        unsub = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            setCustomer({ id: snap.id, ...snap.data() })
          } else {
            // Check fallback if not in Firestore
            const local = getLocalCustomers().find(c => String(c.id) === String(customerId))
            setCustomer(local || null)
          }
          setLoading(false)
        }, (err) => {
          console.warn('Firestore customer listener error:', err)
          const local = getLocalCustomers().find(c => String(c.id) === String(customerId))
          setCustomer(local || null)
          setLoading(false)
        })
      } catch (err) {
        console.warn('Single customer fetch error:', err)
        const local = getLocalCustomers().find(c => String(c.id) === String(customerId))
        setCustomer(local || null)
        setLoading(false)
      }
    } else {
      const local = getLocalCustomers().find(c => String(c.id) === String(customerId))
      setCustomer(local || null)
      setLoading(false)
    }

    return () => {
      customersSubscribers.delete(handleLocalUpdate)
      if (channel) channel.removeEventListener('message', handleBroadcast)
      unsub()
    }
  }, [customerId])

  return { customer, loading }
}

// ── Live settings hook ─────────────────────────────────────────────────────────

export function useSettings() {
  const [settings, setSettings] = useState(getLocalSettings)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    // 1. Subscribe to in-memory updates
    settingsSubscribers.add(setSettings)

    // 2. Listen to cross-tab updates
    const handleBroadcast = (e) => {
      if (e.data?.type === 'SETTINGS_UPDATED' && e.data.payload) {
        setSettings(e.data.payload)
      }
    }
    if (channel) channel.addEventListener('message', handleBroadcast)

    // 3. Listen to Firestore settings document
    let unsub = () => {}
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'salon')
        unsub = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data()
            if (data.closeTime === '21:00') {
              data.closeTime = '23:59'
              setDoc(docRef, { closeTime: '23:59' }, { merge: true }).catch(() => {})
            }
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
      settingsSubscribers.delete(setSettings)
      if (channel) channel.removeEventListener('message', handleBroadcast)
      unsub()
    }
  }, [])

  return { settings, loading }
}

// ── Write helpers ─────────────────────────────────────────────────────────────

export async function addCustomer({ name, phone, serviceIds, preferredBarber, allServices, allCustomers }) {
  const cleanPhone = String(phone || '').replace(/\D/g, '')

  // 1. Fetch fresh customers from Firestore to guarantee atomic token numbering and spot check
  let currentList = allCustomers || []
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'customers'))
      if (!snap.empty) {
        currentList = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      }
    } catch (err) {
      console.warn('Could not read Firestore customers before join:', err)
    }
  }

  // 2. Check if this phone number already has an active spot
  const existing = hasActiveSpot(currentList, cleanPhone)
  if (existing) {
    return { existingSpot: existing }
  }

  // 3. Compute token and totals
  const { tokenNumber, tokenLabel } = nextTokenLabel(currentList)
  const mins  = totalMinutes(serviceIds, allServices)
  const price = totalPrice(serviceIds, allServices)

  const payload = {
    name: name.trim(),
    phone: cleanPhone,
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

  // 4. Save directly to Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      const ref = await addDoc(collection(db, 'customers'), {
        ...payload,
        createdAt: Date.now(),
      })
      const full = { id: ref.id, ...payload }
      const updated = [...currentList, full]
      saveLocalCustomers(updated)
      return full
    } catch (err) {
      console.warn('Firestore addDoc failed, writing locally:', err)
    }
  }

  // Fallback
  const id = 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
  const newCustomer = { id, ...payload }
  const updated = [...currentList, newCustomer]
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

  // Sync directly to Firestore
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
  
  // Immediately notify all screens in current tab & other tabs
  saveLocalSettings(updated)

  // Sync directly to Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'settings', 'salon'), fields, { merge: true })
    } catch (err) {
      console.warn('Firestore setDoc failed:', err)
    }
  }
}
