'use client'

import { RUBRO_PRESET_OPTIONS } from '@/lib/store-templates'

type RubroFieldProps = {
  value: string
  onChange: (value: string) => void
  /** id base para select/datalist (evita duplicados en la misma página). */
  fieldId?: string
  hint?: string
}

export function RubroField({
  value,
  onChange,
  fieldId = 'rubro',
  hint = 'Elegí un rubro de la lista o escribí el tuyo.',
}: RubroFieldProps) {
  const listId = `${fieldId}-presets`
  const selectValue = (RUBRO_PRESET_OPTIONS as readonly string[]).includes(value) ? value : ''

  return (
    <div className="mt-1 space-y-2">
      <select
        id={`${fieldId}-select`}
        className="input w-full"
        value={selectValue}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value)
        }}
      >
        <option value="">Seleccionar rubro…</option>
        {RUBRO_PRESET_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <input
        id={fieldId}
        className="input w-full"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej. Plantas, Ropa, Manualidades…"
        autoComplete="off"
      />
      <datalist id={listId}>
        {RUBRO_PRESET_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <p className="text-xs text-zinc-500">{hint}</p>
    </div>
  )
}
