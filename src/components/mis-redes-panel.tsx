'use client'

import { useState } from 'react'
import { updateShopSettings } from '@/app/actions/shop'
import { QrPanel } from '@/components/qr-panel'
import { shopPublicUrl } from '@/lib/publicUrl'
import { PLAN_LIMITS } from '@/lib/plans'
import type { ShopRow } from '@/types/shop'

function shareText(shop: ShopRow, url: string) {
  return `¡Mirá mi tienda ${shop.name}! Pedí por WhatsApp: ${url}`
}

export function MisRedesPanel({ shop }: { shop: ShopRow }) {
  const url = shopPublicUrl(shop.slug)
  const [instagram, setInstagram] = useState(shop.instagram_url ?? '')
  const [tiktok, setTiktok] = useState(shop.tiktok_url ?? '')
  const [website, setWebsite] = useState(shop.website_url ?? '')
  const [showWhatsappSocial, setShowWhatsappSocial] = useState(shop.social_whatsapp_visible === true)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const socialLimit = PLAN_LIMITS[shop.plan].maxSocialLinks

  async function saveSocial(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const res = await updateShopSettings(shop.id, {
      instagram_url: instagram.trim() || null,
      tiktok_url: tiktok.trim() || null,
      website_url: website.trim() || null,
      social_whatsapp_visible: showWhatsappSocial,
    })
    setLoading(false)
    setMsg('error' in res && res.error ? res.error : 'Redes guardadas')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMsg('No se pudo copiar el link')
    }
  }

  const waShare = `https://wa.me/?text=${encodeURIComponent(shareText(shop, url))}`

  return (
    <div className="space-y-8 max-w-2xl">
      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Tu link para redes</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Ponelo en la bio de Instagram, TikTok, estados de WhatsApp y donde quieras.
          </p>
        </div>
        <p className="break-all rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-brand-accent">
          {url}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copyLink} className="btn-primary text-sm">
            {copied ? 'Copiado ✓' : 'Copiar link'}
          </button>
          <a href={waShare} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800">
            Compartir por WhatsApp
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800"
          >
            Ver mi tienda
          </a>
        </div>
      </section>

      <section className="card">
        <QrPanel slug={shop.slug} shopName={shop.name} />
      </section>

      <form onSubmit={saveSocial} className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Redes en tu tienda</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Aparecen al final de la vitrina.{' '}
            {socialLimit === 0
              ? 'Disponible desde el plan Básico.'
              : shop.plan === 'pro'
                ? 'Podés mostrar todas las que configures.'
                : `Tu plan muestra hasta ${socialLimit} enlaces.`}
          </p>
        </div>
        {socialLimit === 0 ? (
          <p className="text-sm text-amber-200/90">
            Activá un plan en{' '}
            <a href="/dashboard/account" className="underline">
              Cuenta
            </a>{' '}
            para mostrar redes.
          </p>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm">
              Instagram
              <input
                className="input mt-1"
                placeholder="@mitienda"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={socialLimit === 0}
              />
            </label>
            <label className="block text-sm">
              TikTok
              <input
                className="input mt-1"
                placeholder="@mitienda"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                disabled={socialLimit === 0}
              />
            </label>
            <label className="block text-sm">
              Web personal
              <input
                className="input mt-1"
                placeholder="https://tusitio.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                disabled={socialLimit === 0}
              />
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={showWhatsappSocial}
                onChange={(e) => setShowWhatsappSocial(e.target.checked)}
                disabled={socialLimit === 0}
              />
              Mostrar WhatsApp en el pie de la tienda
            </label>
          </div>
        )}
        {msg && (
          <p className={`text-sm ${msg.includes('Error') || msg.includes('error') ? 'text-red-400' : 'text-brand'}`}>
            {msg}
          </p>
        )}
        <button type="submit" disabled={loading || socialLimit === 0} className="btn-primary">
          {loading ? 'Guardando…' : 'Guardar redes'}
        </button>
      </form>
    </div>
  )
}
