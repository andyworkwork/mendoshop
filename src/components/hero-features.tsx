const features = [
  {
    title: 'Link propio',
    text: 'Compartí tu link /tienda/tu-nombre en Instagram o con un QR.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden>
        <path
          d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M14 11a5 5 0 0 0-7.07 0L5.52 12.41a5 5 0 0 0 7.07 7.07L14 19"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: 'Colores y categorías',
    text: 'Elegí la paleta de tu tienda y organizá el catálogo como quieras.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
        <path
          d="M3 15l4.5-3 3 2 5-4 5.5 5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    title: 'WhatsApp',
    text: 'El carrito arma el mensaje con productos y total para tu número.',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 0 1-4.082-1.123l-.293-.175-2.87.86.86-2.87-.175-.293A8 8 0 1 1 12 20z" />
      </svg>
    ),
  },
] as const

export function HeroFeatures() {
  return (
    <section className="relative z-10 mt-10 grid gap-5 sm:grid-cols-3">
      {features.map((f) => (
        <article key={f.title} className="hero-feature-card text-left">
          <div className="mb-4 text-brand">{f.icon}</div>
          <h2 className="text-lg font-semibold text-white">{f.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-200">{f.text}</p>
        </article>
      ))}
    </section>
  )
}
