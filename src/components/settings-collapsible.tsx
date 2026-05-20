'use client'

import { useId, useState, type ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
}

export function SettingsCollapsible({ title, subtitle, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div className="border-b border-zinc-800/80 last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-2 text-left"
      >
        <span>
          <span className="block text-sm font-semibold text-zinc-100">{title}</span>
          {subtitle && <span className="mt-0.5 block text-xs text-zinc-500">{subtitle}</span>}
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div id={panelId} className="pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
