'use client'

import { useState } from 'react'
import { updateShopSettings } from '@/app/actions/shop'
import { QrPanel } from '@/components/qr-panel'
import { RubroField } from '@/components/rubro-field'
import { SettingsCollapsible } from '@/components/settings-collapsible'
import { shopPublicUrl } from '@/lib/publicUrl'
import { PLAN_LIMITS } from '@/lib/plans'
import type { ShopRow } from '@/types/shop'

export function ShopSettingsForm({ shop }: { shop: ShopRow }) {
  const [name, setName] = useState(shop.name)
  const [description, setDescription] = useState(shop.description ?? '')
  const [whatsapp, setWhatsapp] = useState(shop.whatsapp_e164)
  const [rubro, setRubro] = useState(shop.category_label ?? '')
  const [seoTitle, setSeoTitle] = useState(shop.seo_title ?? '')
  const [seoDesc, setSeoDesc] = useState(shop.seo_description ?? '')
  const [instagram, setInstagram] = useState(shop.instagram_url ?? '')
  const [tiktok, setTiktok] = useState(shop.tiktok_url ?? '')
  const [website, setWebsite] = useState(shop.website_url ?? '')
  const [showWhatsappSocial, setShowWhatsappSocial] = useState(() => shop.social_whatsapp_visible === true)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const socialLimit = PLAN_LIMITS[shop.plan].maxSocialLinks

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const res = await updateShopSettings(shop.id, {
      name: name.trim(),
      description: description.trim() || null,
      whatsapp_e164: whatsapp.replace(/\D/g, ''),
      category_label: rubro.trim() || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDesc.trim() || null,
      instagram_url: instagram.trim() || null,
      tiktok_url: tiktok.trim() || null,
      website_url: website.trim() || null,
      social_whatsapp_visible: showWhatsappSocial,
    })
    setLoading(false)
    setMsg('error' in res && res.error ? res.error : 'Guardado correctamente')
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-6">
      <div className="card overflow-hidden px-4">
        <SettingsCollapsible title="Datos de la tienda" subtitle={shopPublicUrl(shop.slug)} defaultOpen>
          <div className="space-y-3">
            <label className="block text-sm">
              Nombre
              <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="block text-sm">
              Descripción corta
              <textarea
                className="input mt-1 min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              WhatsApp (pedidos)
              <input
                className="input mt-1"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                required
              />
            </label>
            <label className="block text-sm">
              Rubro (directorio)
              <RubroField value={rubro} onChange={setRubro} fieldId="shop-rubro" />
            </label>
          </div>
        </SettingsCollapsible>

        <SettingsCollapsible title="Mis redes sociales" defaultOpen={false}>
          <div className="space-y-3">
            {socialLimit === 0 ? (
              <p className="text-sm text-zinc-400">
                Disponible desde el plan Básico. En Cuenta podés ver cómo activarlo.
              </p>
            ) : (
              <p className="text-sm text-zinc-400">
                Aparecen al final de tu tienda.{' '}
                {shop.plan === 'pro'
                  ? 'Podés mostrar todas las redes que configures.'
                  : `Tu plan muestra hasta ${socialLimit} enlaces en el pie de la tienda.`}
              </p>
            )}
            <label className={`block text-sm ${socialLimit === 0 ? 'opacity-50' : ''}`}>
              Instagram (usuario o link)
              <input
                className="input mt-1"
                placeholder="@mitienda o https://instagram.com/mitienda"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={socialLimit === 0}
              />
            </label>
            <label className={`block text-sm ${socialLimit === 0 ? 'opacity-50' : ''}`}>
              TikTok (usuario o link)
              <input
                className="input mt-1"
                placeholder="@mitienda o https://tiktok.com/@mitienda"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                disabled={socialLimit === 0}
              />
            </label>
            <label className={`block text-sm ${socialLimit === 0 ? 'opacity-50' : ''}`}>
              Web personal
              <input
                className="input mt-1"
                placeholder="luminamendoza.shop o https://tusitio.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                disabled={socialLimit === 0}
              />
            </label>
            <label
              className={`flex cursor-pointer items-center gap-2 text-sm ${socialLimit === 0 ? 'opacity-50' : ''}`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-600"
                checked={showWhatsappSocial}
                onChange={(e) => setShowWhatsappSocial(e.target.checked)}
                disabled={socialLimit === 0}
              />
              Mostrar WhatsApp en el pie (usa el número de pedidos de arriba)
            </label>
          </div>
        </SettingsCollapsible>

        <SettingsCollapsible
          title="SEO"
          subtitle="Título y descripción al compartir tu link"
          defaultOpen={false}
        >
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              Cuando alguien pega tu link en WhatsApp, Instagram o Google, el título y la descripción que
              configurás acá son los que aparecen en la vista previa. Si los dejás vacíos, usamos el nombre
              de tu tienda.
            </p>
            <label className="block text-sm">
              Título para buscadores y redes
              <input
                className="input mt-1"
                placeholder={`${shop.name} | Mendoshop`}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                maxLength={70}
              />
            </label>
            <label className="block text-sm">
              Descripción (1–2 frases)
              <textarea
                className="input mt-1 min-h-[72px]"
                placeholder="Ej: Joyas artesanales en Mendoza. Pedí por WhatsApp."
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                maxLength={160}
              />
            </label>
          </div>
        </SettingsCollapsible>

        <SettingsCollapsible title="QR" subtitle="Código para imprimir o mostrar en tu local" defaultOpen={false}>
          <QrPanel slug={shop.slug} shopName={shop.name} />
        </SettingsCollapsible>
      </div>

      {msg && (
        <p className={`text-sm ${msg.includes('Error') || msg.includes('error') ? 'text-red-400' : 'text-brand'}`}>
          {msg}
        </p>
      )}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
