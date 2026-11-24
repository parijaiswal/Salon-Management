import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from './lang'
import PinGate from './components/PinGate'

import Home      from './pages/Home'
import Join      from './pages/Join'
import Status    from './pages/Status'
import Reception from './pages/Reception'
import Barber    from './pages/Barber'
import Display   from './pages/Display'
import Admin     from './pages/Admin'

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"           element={<Home />} />
          <Route path="/join"       element={<Join />} />
          <Route path="/status/:id" element={<Status />} />
          <Route path="/display"    element={<Display />} />

          {/* PIN-protected routes */}
          <Route path="/reception"      element={<PinGate><Reception /></PinGate>} />
          <Route path="/barber/:name"   element={<PinGate><Barber /></PinGate>} />
          <Route path="/admin"          element={<PinGate><Admin /></PinGate>} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  )
}
