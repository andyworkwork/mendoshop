'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  hexToHsv,
  hexToRgb,
  hsvToHex,
  normalizeHex,
  rgbToHex,
} from '@/lib/color-hex'

type Props = {
  label: string
  value: string
  onChange: (hex: string) => void
  fallback?: string
}

export function ThemeColorField({ label, value, onChange, fallback = '#808080' }: Props) {
  const hex = normalizeHex(value, fallback)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const paletteId = useId()

  const applyHex = useCallback(
    (next: string) => {
      onChange(normalizeHex(next, fallback))
    },
    [fallback, onChange],
  )

  return (
    <div className="block text-sm">
      <span className="font-medium text-zinc-200">{label}</span>
      <div className="mt-1.5 flex items-center gap-2">
        <div
          className="h-10 w-14 shrink-0 rounded-lg border border-zinc-600 shadow-inner"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 font-mono text-xs text-zinc-100"
          value={hex}
          onChange={(e) => applyHex(e.target.value)}
          onBlur={(e) => applyHex(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="mt-2 text-xs font-medium text-brand-accent hover:underline"
        aria-expanded={paletteOpen}
        aria-controls={paletteId}
        onClick={() => setPaletteOpen((o) => !o)}
      >
        {paletteOpen ? 'Ocultar paleta' : 'Paleta de color (RGB)'}
      </button>
      {paletteOpen && (
        <div id={paletteId} className="mt-2">
          <RgbColorPalette hex={hex} onChange={applyHex} />
        </div>
      )}
    </div>
  )
}

function RgbColorPalette({ hex, onChange }: { hex: string; onChange: (hex: string) => void }) {
  const [hsv, setHsv] = useState(() => hexToHsv(hex))
  const [rgb, setRgb] = useState(() => hexToRgb(hex))
  const svRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  useEffect(() => {
    setHsv(hexToHsv(hex))
    setRgb(hexToRgb(hex))
  }, [hex])

  const pushHsv = useCallback(
    (next: { h?: number; s?: number; v?: number }) => {
      const merged = { ...hsv, ...next }
      setHsv(merged)
      const nextHex = hsvToHex(merged.h, merged.s, merged.v)
      setRgb(hexToRgb(nextHex))
      onChange(nextHex)
    },
    [hsv, onChange],
  )

  const pushRgb = useCallback(
    (next: { r?: number; g?: number; b?: number }) => {
      const merged = { ...rgb, ...next }
      setRgb(merged)
      const nextHex = rgbToHex(merged.r, merged.g, merged.b)
      setHsv(hexToHsv(nextHex))
      onChange(nextHex)
    },
    [rgb, onChange],
  )

  const pickFromSvPlane = useCallback(
    (clientX: number, clientY: number) => {
      const el = svRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
      pushHsv({ s: x * 100, v: (1 - y) * 100 })
    },
    [pushHsv],
  )

  const onSvPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    pickFromSvPlane(e.clientX, e.clientY)
  }

  const onSvPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    pickFromSvPlane(e.clientX, e.clientY)
  }

  const onSvPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const svX = `${hsv.s}%`
  const svY = `${100 - hsv.v}%`

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
      <div
        ref={svRef}
        className="relative h-36 w-full touch-none cursor-crosshair overflow-hidden rounded-lg"
        style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
        onPointerDown={onSvPointerDown}
        onPointerMove={onSvPointerMove}
        onPointerUp={onSvPointerUp}
        onPointerCancel={onSvPointerUp}
        role="slider"
        aria-label="Saturación y brillo"
        aria-valuetext={`${Math.round(hsv.s)}% saturación, ${Math.round(hsv.v)}% brillo`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/40"
          style={{ left: svX, top: svY }}
        />
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-zinc-400">Matiz</span>
        <input
          type="range"
          min={0}
          max={360}
          value={Math.round(hsv.h)}
          className="theme-hue-slider h-3 w-full cursor-pointer appearance-none rounded-full"
          onChange={(e) => pushHsv({ h: Number(e.target.value) })}
        />
      </label>

      <div className="grid grid-cols-3 gap-2">
        <RgbInput label="R" value={rgb.r} onChange={(r) => pushRgb({ r })} />
        <RgbInput label="G" value={rgb.g} onChange={(g) => pushRgb({ g })} />
        <RgbInput label="B" value={rgb.b} onChange={(b) => pushRgb({ b })} />
      </div>
    </div>
  )
}

function RgbInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <label className="block text-xs text-zinc-400">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        type="number"
        min={0}
        max={255}
        value={value}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm text-zinc-100"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
