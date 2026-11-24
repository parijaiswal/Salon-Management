/**
 * BarberAvatar.jsx — Coloured circle with initials.
 * Used everywhere instead of photos.
 */
import React from 'react'
import { barberColour, initials } from '../queueRules'

export default function BarberAvatar({ name = '', size = 40 }) {
  const bg  = barberColour(name)
  const ini = initials(name)
  return (
    <div
      style={{ width: size, height: size, backgroundColor: bg, flexShrink: 0 }}
      className="rounded-full flex items-center justify-center text-white font-bold select-none"
    >
      <span style={{ fontSize: size * 0.38 }}>{ini}</span>
    </div>
  )
}
