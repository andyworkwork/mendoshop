/** Fondo de páginas públicas Mendoshop (sin carrusel de fotos; el hero usa plantillas). */
export function MendoshopPageBackground() {
  return (
    <div
      aria-hidden
      className="mendoshop-page-bg__layers pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_65%_at_50%_-18%,color-mix(in_srgb,var(--brand-orange)_28%,transparent),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_35%,color-mix(in_srgb,var(--brand-coral)_14%,transparent),transparent_52%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#141416] via-[var(--brand-ink)] to-[#101012]" />
    </div>
  )
}
