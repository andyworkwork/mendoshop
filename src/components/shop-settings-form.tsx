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
  const { countryCode: initialCountryCode, localDigits: initialLocalDigits } = splitWhatsAppForUi(
    shop.whatsapp_e164,
  )
  // Separar la carga: `549` (país) + el resto del número (provincia/ciudad + número).
  const [whatsappCountryCode, setWhatsappCountryCode] = useState(initialCountryCode)
  const [whatsappLocalDigits, setWhatsappLocalDigits] = useState(initialLocalDigits)
  const [whatsappCountryCodeConfirm, setWhatsappCountryCodeConfirm] = useState(initialCountryCode)
  const [whatsappLocalDigitsConfirm, setWhatsappLocalDigitsConfirm] = useState(initialLocalDigits)
  const [rubro, setRubro] = useState(shop.category_label ?? '')
  const [seoTitle, setSeoTitle] = useState(shop.seo_title ?? '')
  const [seoDesc, setSeoDesc] = useState(shop.seo_description ?? '')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const wa = `${whatsappCountryCode}${whatsappLocalDigits}`.replace(/\D/g, '')
    const waConfirm = `${whatsappCountryCodeConfirm}${whatsappLocalDigitsConfirm}`.replace(/\D/g, '')
    if (whatsappLocalDigits.replace(/\D/g, '').length < 10) {
      setMsg('Ingresá un WhatsApp válido (provincia/ciudad + número, solo dígitos).')
      return
    }
    if (wa !== waConfirm) {
      setMsg('Los dos campos de WhatsApp no coinciden. Revisá el número de pedidos.')
      return
    }
    setLoading(true)
    setMsg(null)
    const res = await updateShopSettings(shop.id, {
      name: name.trim(),
      description: description.trim() || null,
      whatsapp_e164: wa,
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
        <SettingsCollapsible
          title="Datos de la tienda"
          subtitle={shopPublicUrl(shop.slug)}
          defaultOpen={false}
        >
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
            <div className="space-y-3 rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
              <p className="text-sm text-amber-100/90">
                Los pedidos del carrito se envían a este número. Escribilo dos veces para evitar errores.
              </p>
              <label className="block text-sm">
                WhatsApp (pedidos)
                <div className="mt-1 flex gap-2">
                  <input
                    className="input !w-16"
                    value={whatsappCountryCode}
                    onChange={(e) => setWhatsappCountryCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="549"
                    inputMode="numeric"
                    aria-label="Código de país"
                    required
                  />
                  <input
                    className="input flex-1 !w-auto"
                    value={whatsappLocalDigits}
                    onChange={(e) => setWhatsappLocalDigits(e.target.value.replace(/\D/g, ''))}
                    placeholder="2615000000"
                    inputMode="numeric"
                    aria-label="Provincia/Ciudad + número"
                    required
                  />
                </div>
              </label>

              <label className="block text-sm">
                Repetir WhatsApp
                <div className="mt-1 flex gap-2">
                  <input
                    className="input !w-16"
                    value={whatsappCountryCodeConfirm}
                    onChange={(e) =>
                      setWhatsappCountryCodeConfirm(
                        e.target.value.replace(/\D/g, '').slice(0, 3),
                      )
                    }
                    placeholder="549"
                    inputMode="numeric"
                    aria-label="Código de país (repetir)"
                    required
                  />
                  <input
                    className="input flex-1 !w-auto"
                    value={whatsappLocalDigitsConfirm}
                    onChange={(e) => setWhatsappLocalDigitsConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder="2615000000"
                    inputMode="numeric"
                    aria-label="Provincia/Ciudad + número (repetir)"
                    required
                  />
                </div>
              </label>

              {whatsappLocalDigits.replace(/\D/g, '').length >= 10 &&
                waStrip(whatsappCountryCode, whatsappLocalDigits) ===
                  waStrip(whatsappCountryCodeConfirm, whatsappLocalDigitsConfirm) && (
                  <p className="text-xs text-brand">
                    Los pedidos irán a +{waStrip(whatsappCountryCode, whatsappLocalDigits)}
                  </p>
                )}
            </div>
            <label className="block text-sm">
              Rubro (directorio)
              <RubroField value={rubro} onChange={setRubro} fieldId="shop-rubro" />
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

const AR_COUNTRY_CODE = '549'

function splitWhatsAppForUi(whatsappE164: string): { countryCode: string; localDigits: string } {
  const digits = whatsappE164.replace(/\D/g, '')
  if (digits.startsWith(AR_COUNTRY_CODE)) {
    return { countryCode: AR_COUNTRY_CODE, localDigits: digits.slice(AR_COUNTRY_CODE.length) }
  }
  // Fallback: si no arranca con 549, asumimos que el input completo ya es "localDigits".
  return { countryCode: AR_COUNTRY_CODE, localDigits: digits }
}

function waStrip(countryCode: string, localDigits: string): string {
  return `${countryCode}${localDigits}`.replace(/\D/g, '')
}
