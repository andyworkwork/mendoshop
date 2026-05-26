export function PromoStarRating({ rating }: { rating: number }) {
  const label = `${String(rating).replace('.', ',')} de 5`

  return (
    <div className="mt-3 flex items-center gap-1.5" aria-label={label}>
      <span className="text-sm font-semibold tabular-nums text-zinc-200">{String(rating).replace('.', ',')}</span>
      <div className="flex text-base leading-none">
        {[1, 2, 3, 4, 5].map((i) => {
          if (rating >= i) {
            return (
              <span key={i} className="text-brand">
                ★
              </span>
            )
          }
          if (rating >= i - 0.5) {
            return (
              <span key={i} className="relative inline-block">
                <span className="text-zinc-600">★</span>
                <span className="absolute left-0 top-0 overflow-hidden text-brand" style={{ width: '0.5em' }}>
                  ★
                </span>
              </span>
            )
          }
          return (
            <span key={i} className="text-zinc-600">
              ★
            </span>
          )
        })}
      </div>
    </div>
  )
}
