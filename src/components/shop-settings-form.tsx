'use client'

import { useState } from 'react'
import { updateShopSettings } from '@/app/actions/shop'
import { SettingsCollapsible } from '@/components/settings-collapsible'
import { ThemePicker } from '@/components/theme-picker'
import { shopPublicUrl } from '@/lib/publicUrl'
import type { ShopRow } from '@/types/shop'

export function ShopSettingsForm({ shop }: { shop: ShopRow }) {
  const [name, setName] = useState(shop.name)
  const [description, setDescription] = useState(shop.description ?? '')
  const [whatsapp, setWhatsapp] = useState(shop.whatsapp_e164)
  const [rubro, setRubro] = useState(shop.category_label ?? '')
  const [seoTitle, setSeoTitle] = useState(shop.seo_title ?? '')
  const [seoDesc, setSeoDesc] = useState(shop.seo_description ?? '')
  const [theme, setTheme] = useState(shop.theme)
  const [instagram, setInstagram] = useState(shop.instagram_url ?? '')
  const [tiktok, setTiktok] = useState(shop.tiktok_url ?? '')
  const [website, setWebsite] = useState(shop.website_url ?? '')
  const [showWhatsappSocial, setShowWhatsappSocial] = useState(() => shop.social_whatsapp_visible === true)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      theme,
      instagram_url: instagram.trim() || null,
      tiktok_url: tiktok.trim() || null,
      website_url: website.trim() || null,
      social_whatsapp_visible: showWhatsappSocial,
    })
    setLoading(false)
    setMsg('error' in res && res.error ? res.error : 'Guardado correctamente')
  }

  return (
    <form onSubmit={save} className="space-y-8 max-w-2xl">
      <section className="card space-y-3">
        <h2 className="font-semibold">Datos de la tienda</h2>
        <p className="text-sm text-brand-accent break-all">{shopPublicUrl(shop.slug)}</p>
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
          <input className="input mt-1" value={rubro} onChange={(e) => setRubro(e.target.value)} />
        </label>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Mis redes sociales</h2>
        <p className="text-sm text-zinc-400">
          Aparecen al final de tu tienda. Solo se muestran las que completes.
        </p>
        <label className="block text-sm">
          Instagram (usuario o link)
          <input
            className="input mt-1"
            placeholder="@mitienda o https://instagram.com/mitienda"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          TikTok (usuario o link)
          <input
            className="input mt-1"
            placeholder="@mitienda o https://tiktok.com/@mitienda"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Web personal
          <input
            className="input mt-1"
            placeholder="luminamendoza.shop o https://tusitio.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-600"
            checked={showWhatsappSocial}
            onChange={(e) => setShowWhatsappSocial(e.target.checked)}
          />
          Mostrar WhatsApp en el pie (usa el número de pedidos de arriba)
        </label>
      </section>

      <section className="card space-y-1">
        <SettingsCollapsible title="Apariencia" subtitle="Plantillas, fondo y colores" defaultOpen={false}>
          <ThemePicker value={theme} onChange={setTheme} />
        </SettingsCollapsible>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">SEO — cómo se ve tu link al compartir</h2>
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
      </section>

      {msg && <p className={`text-sm ${msg.includes('Error') || msg.includes('error') ? 'text-red-400' : 'text-brand'}`}>{msg}</p>}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
