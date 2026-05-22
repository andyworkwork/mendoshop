'use client'

import { useState } from 'react'
import { updateShopSettings } from '@/app/actions/shop'
import Link from 'next/link'
import { RubroField } from '@/components/rubro-field'
import { SettingsCollapsible } from '@/components/settings-collapsible'
import { shopPublicUrl } from '@/lib/publicUrl'
import type { ShopRow } from '@/types/shop'

export function ShopSettingsForm({ shop }: { shop: ShopRow }) {
  const [name, setName] = useState(shop.name)
  const [description, setDescription] = useState(shop.description ?? '')
  const [whatsapp, setWhatsapp] = useState(shop.whatsapp_e164)
  const [rubro, setRubro] = useState(shop.category_label ?? '')
  const [seoTitle, setSeoTitle] = useState(shop.seo_title ?? '')
  const [seoDesc, setSeoDesc] = useState(shop.seo_description ?? '')
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

        <div className="border-t border-zinc-800 px-4 py-4">
          <p className="text-sm text-zinc-400">
            Link para compartir, QR y redes sociales están en{' '}
            <Link href="/dashboard/mis-redes" className="text-brand-accent font-medium underline">
              Mis redes
            </Link>
            .
          </p>
        </div>

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
