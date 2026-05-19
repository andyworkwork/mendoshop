/**
 * Uso (una vez):
 *   node --env-file=.env.local scripts/setup-platform-admin.mjs
 *
 * Opcional:
 *   SETUP_ADMIN_EMAIL, SETUP_PASSWORD, SETUP_SHOP_SLUG, SETUP_SHOP_NAME, SETUP_WHATSAPP
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail = (process.env.SETUP_ADMIN_EMAIL ?? 'andyworkwork2026@gmail.com').toLowerCase()
const password = process.env.SETUP_PASSWORD ?? ''
const shopSlug = process.env.SETUP_SHOP_SLUG ?? 'andy'
const shopName = process.env.SETUP_SHOP_NAME ?? 'Andy'
const whatsapp = (process.env.SETUP_WHATSAPP ?? '5492615550000').replace(/\D/g, '')

if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}
if (!password || password.length < 6) {
  console.error('Definí SETUP_PASSWORD (mín. 6 caracteres) o editá el script.')
  process.exit(1)
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } })

async function findUserIdByEmail(email) {
  let page = 1
  while (page <= 10) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email)
    if (hit) return hit.id
    if (data.users.length < 200) break
    page += 1
  }
  return null
}

async function main() {
  const { error: adminErr } = await sb.from('platform_admins').upsert({ email: adminEmail })
  if (adminErr) throw adminErr
  console.log('✓ Admin de plataforma:', adminEmail)

  let userId = null
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
  })

  if (createErr) {
    if (!createErr.message.toLowerCase().includes('already')) throw createErr
    userId = await findUserIdByEmail(adminEmail)
    if (!userId) throw new Error('Usuario ya existe pero no se pudo resolver el id')
    const { error: updErr } = await sb.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    })
    if (updErr) throw updErr
    console.log('✓ Usuario existente actualizado (contraseña y email confirmado)')
  } else {
    userId = created.user?.id ?? null
    console.log('✓ Usuario Auth creado')
  }

  if (!userId) throw new Error('Sin user id')

  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  let shopId = null
  const { data: existingShop } = await sb.from('shops').select('id').eq('slug', shopSlug).maybeSingle()
  if (existingShop?.id) {
    shopId = existingShop.id
    console.log('✓ Tienda ya existe:', shopSlug)
  } else {
    const { data: shop, error: shopErr } = await sb
      .from('shops')
      .insert({
        slug: shopSlug,
        name: shopName,
        whatsapp_e164: whatsapp,
        plan: 'free_trial',
        plan_until: trialEnd,
        active: true,
      })
      .select('id')
      .single()
    if (shopErr) throw shopErr
    shopId = shop.id
    console.log('✓ Tienda creada:', shopSlug)
  }

  const { error: memberErr } = await sb.from('shop_members').upsert(
    { shop_id: shopId, user_id: userId, role: 'owner' },
    { onConflict: 'shop_id,user_id' },
  )
  if (memberErr) throw memberErr
  console.log('✓ Dueño de la tienda vinculado')
  console.log('\nListo. Entrá en /login o /admin con:', adminEmail)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
