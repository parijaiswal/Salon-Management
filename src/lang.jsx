/**
 * lang.jsx — Single source of truth for all UI text in English and Gujarati.
 *
 * All UI labels come strictly from this file.
 */

export const translations = {
  // ────────────────────────────────────────────────────────────────────────────
  en: {
    salonName:         'Salon Queue',
    langToggle:        'ગુ',      // label shown when EN is active

    // States
    open:              'Open',
    closed:            'Closed',
    closes:            'Closes',
    free:              'free',
    busy:              'busy',
    onBreak:           'on break',
    available:         'Available',
    min:               'min',

    // Generic actions
    cancel:            'Cancel',
    confirm:           'Confirm',
    back:              'Back',
    save:              'Save',
    saved:             'Saved!',
    loading:           'Loading…',
    error:             'Something went wrong. Please try again.',
    yes:               'Yes',
    no:                'No',

    // Home (/)
    noOneWaiting:      'No one waiting - walk right in!',
    joinQueue:         'Join Queue',
    queueClosed:       'Online joining is closed. Walk-ins are welcome!',
    peopleWaiting:     '{{n}} people waiting · about {{min}} min',
    oneWaiting:        '1 person waiting · about {{min}} min',

    // Join (/join)
    joinTitle:         'Join Queue',
    yourName:          'Your Name',
    yourPhone:         'Phone Number',
    phoneError:        'Please enter a valid 10-digit phone number.',
    nameError:         'Please enter your name.',
    noServiceError:    'Please select at least one service.',
    maxServiceError:   'Maximum 3 services',
    chooseServices:    'Select Services (Max 3)',
    chooseBarber:      'Select Barber',
    anyBarber:         'Any barber (fastest)',
    summaryLine:       'Total {{min}} min · ₹{{price}} · Expected wait ~{{wait}} min',
    alreadyInQueue:    'You already have an active spot in the queue.',
    viewMySpot:        'View My Spot',
    confirmJoin:       'Confirm',

    // My Status (/status/:id)
    yourToken:         'Token Number',
    positionIn:        '{{n}}{{suffix}} in line',
    aboutWait:         'about {{min}} min',
    yourBarber:        'Barber',
    yourServices:      'Services',
    startComing:       'Start coming to the salon',
    itsYourTurn:       "It's your turn! Go to {{barber}}",
    goTo:              'Go to {{barber}}',
    barberOnBreak:     '{{barber}} is on break',
    cancelMySpot:      'Cancel my spot',
    cancelConfirmTitle:'Cancel Spot',
    cancelConfirm:     'Are you sure?',
    spotCancelled:     'Your spot has been cancelled.',
    spotNoShow:        'Marked as no-show.',
    joinAgain:         'Join Queue Again',
    statusWaiting:     'Waiting',
    statusCalled:      'Called',
    statusInChair:     'In chair',
    statusDone:        'Done',
    statusCancelled:   'Cancelled',
    statusNoShow:      'No-show',
    notFound:          'Spot not found',

    // Reception (/reception)
    receptionTitle:    'Reception Dashboard',
    addWalkIn:         '+ Add walk-in',
    callNext:          'Call next',
    markNoShow:        'No-show',
    cancelSpot:        'Cancel',
    waitingList:       'Waiting List',
    noOneWaitingShort: 'No one waiting',
    waitingTooLong:    'Waiting {{min}} min',
    currentCustomer:   'Current customer',
    timeLeft:          'Time left',
    noneInChair:       'Free',

    // Barber (/barber/:name)
    barberTitle:       'Barber View',
    startService:      'Start',
    doneService:       'Done',
    nextForYou:        'Next for you',
    noCurrentCustomer: 'No customer right now',
    timerRunning:      'Time in chair: {{min}} min',
    toggleBreak:       'On break',
    toggleAvailable:   'Available',
    cantBreakBusy:     'Cannot go on break while serving a customer.',

    // TV Display (/display)
    displayTitle:      'Waiting Area Display',
    nowServing:        'Now: {{token}}',
    upNext:            'Up next',
    noUpNext:          'No one waiting',
    estTime:           '~{{min}} min',

    // Owner / Admin (/admin)
    adminTitle:        'Owner Settings',
    services:          'Services',
    addService:        '+ Add service',
    editService:       'Edit',
    serviceName:       'Service name',
    serviceNameGu:     'Service name (Gujarati)',
    serviceDuration:   'Duration (min)',
    servicePrice:      'Price (₹)',
    serviceActive:     'Active',
    barbersOnDuty:     'Barbers on duty today',
    queueSwitch:       'Online Queue',
    todayStats:        "Today's stats",
    statsServed:       'Customers served',
    statsAvgWait:      'Average wait',
    statsNoShows:      'No-shows',
    openingHours:      'Opening hours',
    openTime:          'Open time',
    closeTime:         'Close time',
    barberName:        'Barber name',
    addBarber:         '+ Add barber',

    // PIN screen
    pinTitle:          'Staff PIN Required',
    pinPlaceholder:    'Enter 4-digit PIN',
    pinError:          'Incorrect PIN. Please try again.',
    pinSubmit:         'Unlock',
  },

  // ────────────────────────────────────────────────────────────────────────────
  gu: {
    salonName:         'સેલોન કતાર',
    langToggle:        'EN',      // label shown when GU is active

    open:              'ખુલ્લું',
    closed:            'બંધ',
    closes:            'બંધ થાય',
    free:              'મુક્ત',
    busy:              'વ્યસ્ત',
    onBreak:           'વિરામ પર',
    available:         'ઉપલબ્ધ',
    min:               'મિનિટ',

    cancel:            'રદ કરો',
    confirm:           'પુષ્ટિ કરો',
    back:              'પાછા જાઓ',
    save:              'સાચવો',
    saved:             'સચવાઈ ગયું!',
    loading:           'લોડ થઈ રહ્યું છે…',
    error:             'કંઈક ભૂલ થઈ. ફરી પ્રયાસ કરો.',
    yes:               'હા',
    no:                'ના',

    noOneWaiting:      'કોઈ રાહ નથી જોઈ રહ્યું - સીધા અંદર આવો!',
    joinQueue:         'કતારમાં જોડાઓ',
    queueClosed:       'ઑનલાઇન જોડાવાનું બંધ છે. વૉક-ઇન આવકાર્ય છે!',
    peopleWaiting:     '{{n}} લોકો રાહ જોઈ રહ્યા છે · અંદાજે {{min}} મિનિટ',
    oneWaiting:        '1 વ્યક્તિ રાહ જોઈ રહી છે · અંદાજે {{min}} મિનિટ',

    joinTitle:         'કતારમાં જોડાઓ',
    yourName:          'તમારું નામ',
    yourPhone:         'ફોન નંબર',
    phoneError:        'કૃપા કરીને માન્ય 10-અંકનો ફોન નંબર દાખલ કરો.',
    nameError:         'કૃપા કરીને તમારું નામ દાખલ કરો.',
    noServiceError:    'કૃપા કરીને ઓછામાં ઓછી એક સેવા પસંદ કરો.',
    maxServiceError:   'વધુમાં વધુ 3 સેવાઓ',
    chooseServices:    'સેવાઓ પસંદ કરો (મહત્તમ 3)',
    chooseBarber:      'વાળંદ પસંદ કરો',
    anyBarber:         'કોઈપણ વાળંદ (સૌથી ઝડપી)',
    summaryLine:       'કુલ {{min}} મિનિટ · ₹{{price}} · અપેક્ષિત પ્રતીક્ષા ~{{wait}} મિનિટ',
    alreadyInQueue:    'તમે પહેલેથી જ કતારમાં સક્રિય સ્થાન ધરાવો છો.',
    viewMySpot:        'મારું સ્થાન જુઓ',
    confirmJoin:       'પુષ્ટિ કરો',

    yourToken:         'ટોકન નંબર',
    positionIn:        'કતારમાં {{n}}મું સ્થાન',
    aboutWait:         'અંદાજે {{min}} મિનિટ',
    yourBarber:        'વાળંદ',
    yourServices:      'સેવાઓ',
    startComing:       'સેલોન તરફ આવવાનું શરૂ કરો',
    itsYourTurn:       'તમારો વારો આવી ગયો! {{barber}} પાસે જાઓ',
    goTo:              '{{barber}} પાસે જાઓ',
    barberOnBreak:     '{{barber}} વિરામ પર છે',
    cancelMySpot:      'મારું સ્થાન રદ કરો',
    cancelConfirmTitle:'સ્થાન રદ કરો',
    cancelConfirm:     'શું તમે ખરેખર રદ કરવા માંગો છો?',
    spotCancelled:     'તમારું સ્થાન રદ કરવામાં આવ્યું છે.',
    spotNoShow:        'હાજર ન રહ્યા તરીકે નોંધાયેલ.',
    joinAgain:         'ફરીથી કતારમાં જોડાઓ',
    statusWaiting:     'પ્રતીક્ષામાં',
    statusCalled:      'બોલાવ્યા',
    statusInChair:     'ખુરશીમાં',
    statusDone:        'પૂર્ણ',
    statusCancelled:   'રદ કરેલ',
    statusNoShow:      'હાજર ન રહ્યા',
    notFound:          'સ્થાન મળ્યું નથી',

    receptionTitle:    'રિસેપ્શન ડેશબોર્ડ',
    addWalkIn:         '+ વૉક-ઇન ઉમેરો',
    callNext:          'આગલાને બોલાવો',
    markNoShow:        'હાજર નથી',
    cancelSpot:        'રદ કરો',
    waitingList:       'પ્રતીક્ષા સૂચિ',
    noOneWaitingShort: 'કોઈ રાહ નથી જોઈ રહ્યું',
    waitingTooLong:    '{{min}} મિનિટથી રાહ જોઈ રહ્યા છે',
    currentCustomer:   'વર્તમાન ગ્રાહક',
    timeLeft:          'બાકી સમય',
    noneInChair:       'મુક્ત',

    barberTitle:       'વાળંદ સ્ક્રીન',
    startService:      'શરૂ કરો',
    doneService:       'પૂર્ણ',
    nextForYou:        'તમારા આગલા ગ્રાહક',
    noCurrentCustomer: 'હાલમાં કોઈ ગ્રાહક નથી',
    timerRunning:      'સેવા સમય: {{min}} મિનિટ',
    toggleBreak:       'વિરામ પર',
    toggleAvailable:   'ઉપલબ્ધ',
    cantBreakBusy:     'ગ્રાહકની સેવા દરમિયાન વિરામ પર જઈ શકાતું નથી.',

    displayTitle:      'પ્રતીક્ષા વિસ્તાર ડિસ્પ્લે',
    nowServing:        'હાલમાં: {{token}}',
    upNext:            'આગામી',
    noUpNext:          'કોઈ રાહ નથી જોઈ રહ્યું',
    estTime:           '~{{min}} મિનિટ',

    adminTitle:        'માલિક સેટિંગ્સ',
    services:          'સેવાઓ',
    addService:        '+ સેવા ઉમેરો',
    editService:       'ફેરફાર કરો',
    serviceName:       'સેવાનું નામ',
    serviceNameGu:     'સેવાનું નામ (ગુજરાતી)',
    serviceDuration:   'સમયગાળો (મિનિટ)',
    servicePrice:      'કિંમત (₹)',
    serviceActive:     'સક્રિય',
    barbersOnDuty:     'આજના ફરજ પરના વાળંદ',
    queueSwitch:       'ઑનલાઇન કતાર',
    todayStats:        'આજના આંકડા',
    statsServed:       'સેવા અપાયેલા ગ્રાહકો',
    statsAvgWait:      'સરેરાશ રાહ',
    statsNoShows:      'હાજર ન રહ્યા',
    openingHours:      'ખુલવાનો સમય',
    openTime:          'ખુલવાનો સમય',
    closeTime:         'બંધ થવાનો સમય',
    barberName:        'વાળંદનું નામ',
    addBarber:         '+ વાળંદ ઉમેરો',

    pinTitle:          'સ્ટાફ પિન જરૂરી છે',
    pinPlaceholder:    '૪-અંકનો પિન દાખલ કરો',
    pinError:          'ખોટો પિન. કૃપા કરીને ફરી પ્રયાસ કરો.',
    pinSubmit:         'અનલૉક કરો',
  },
}

// ── Context & hook ────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect } from 'react'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('salon_lang') || 'en'
  })

  const toggle = () => {
    setLang(l => {
      const next = l === 'en' ? 'gu' : 'en'
      localStorage.setItem('salon_lang', next)
      return next
    })
  }

  return (
    <LangContext.Provider value={{ lang, toggle }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const { lang, toggle } = useContext(LangContext)
  const dict = translations[lang] || translations.en

  /** Helper to get ordinal suffix in English */
  function getOrdinal(n) {
    if (lang === 'gu') return ''
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return s[(v - 20) % 10] || s[v] || s[0]
  }

  function t(key, vars = {}) {
    let str = dict[key] ?? translations.en[key] ?? key
    if (vars.n !== undefined && vars.suffix === undefined) {
      vars = { ...vars, suffix: getOrdinal(Number(vars.n)) }
    }
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replaceAll(`{{${k}}}`, String(v))
    })
    return str
  }

  return { lang, toggle, t }
}
