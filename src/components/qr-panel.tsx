'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { shopPublicUrl } from '@/lib/publicUrl'

export function QrPanel({ slug, shopName }: { slug: string; shopName: string }) {
  const url = shopPublicUrl(slug)
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: '#0f766e', light: '#ffffff' } })
      .then(setDataUrl)
      .catch(console.error)
  }, [url])

  return (
    <div className="card max-w-md mx-auto text-center space-y-4">
      <h2 className="text-lg font-semibold">QR de tu tienda</h2>
      <p className="text-sm text-zinc-400">
        Imprimilo o mostralo en tu local. Al escanearlo abren <strong className="text-zinc-200">{shopName}</strong>.
      </p>
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={`QR ${shopName}`} className="mx-auto rounded-xl border border-zinc-700" />
      ) : (
        <div className="mx-auto h-[280px] w-[280px] animate-pulse rounded-xl bg-zinc-800" />
      )}
      <p className="break-all text-xs text-teal-400">{url}</p>
      <a href={dataUrl ?? '#'} download={`mendoshop-${slug}-qr.png`} className="btn-primary inline-block">
        Descargar PNG
      </a>
    </div>
  )
}
