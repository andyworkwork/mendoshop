# Mendoshop

Plataforma multi-tenant para emprendedores de Mendoza: cada suscriptor tiene su vitrina en `/tienda/[slug]`, catálogo con categorías, fotos optimizadas (WebP), plantillas de colores, carrito que redirige a **su WhatsApp**, QR y SEO para redes.

## Stack

- **Next.js 16** (App Router) → deploy en **Vercel**
- **Supabase** (Postgres + Auth + Storage + RLS)

## Proyecto Supabase

Mendoshop debe vivir en **tu cuenta nueva** de Supabase (no en la organización Lumina Mendoza).

Guía paso a paso: **[supabase/SETUP-CUENTA-NUEVA.md](supabase/SETUP-CUENTA-NUEVA.md)**

Resumen:

1. Creá (o usá) un proyecto en la cuenta nueva.
2. Copiá URL + publishable + service_role a `.env.local` (las tres del mismo proyecto).
3. Ejecutá `supabase/migrations/001_mendoshop_init.sql` en el SQL Editor.
4. Configurá Auth (email, redirect URLs).

Si se creó por error un proyecto **Mendoshop** dentro de Lumina (`azkazexokjnnqlfeasng`), podés eliminarlo en ese dashboard; no lo usa este repo.

## Variables de entorno

Copiá `.env.example` → `.env.local` y completá las claves del dashboard de Supabase.

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable (o `ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor — API de carritos |
| `NEXT_PUBLIC_APP_URL` | URL pública (en producción tu dominio) |

## Desarrollo

```bash
npm install
npm run dev
```

- Home: http://localhost:3000
- Registro: http://localhost:3000/registro
- Panel: http://localhost:3000/dashboard
- Tienda demo: http://localhost:3000/tienda/tu-slug

## Deploy en Vercel

1. Importá el repo/carpeta `mendoshop`.
2. Configurá las mismas variables (service role en **Secrets**).
3. Conectá tu dominio (ej. `mendoshop.com`).
4. En Supabase → Authentication → URL Configuration, agregá la URL de producción.

## Planes (límites en código)

| Plan | Productos | Redes en pie | Visitas |
|------|-----------|--------------|---------|
| Prueba 7 días | 30 | — | — |
| Básico | 30 | hasta 2 | — |
| Pro | 80 | todas | sí |

### Pagos con Mercado Pago (opcional)

En **Dashboard → Cuenta** cada plan de pago tiene un botón que abre Checkout Pro de Mercado Pago. Al aprobarse el pago, un webhook activa el plan y suma 30 días de vigencia.

Variables en Vercel / `.env.local`:

| Variable | Uso |
|----------|-----|
| `MERCADOPAGO_ACCESS_TOKEN` | Access token de tu aplicación MP (producción o `TEST-…` en sandbox) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secret de firma del mismo panel Webhooks (valida `x-signature`) |
| `NEXT_PUBLIC_APP_URL` | URL pública, ej. `https://mendoshop.vercel.app` (webhook y vuelta post-pago) |

En [Mercado Pago Developers](https://www.mercadopago.com.ar/developers) → tu app → **Webhooks**, configurá la URL:

`https://TU_DOMINIO/api/payments/mercadopago/webhook`

Copiá el **secret** que muestra MP a `MERCADOPAGO_WEBHOOK_SECRET` en Vercel. Sin eso, el endpoint acepta POST sin verificar firma (solo recomendable en pruebas locales).

Aplicá la migración `supabase/migrations/006_shop_plan_payments.sql` en Supabase.

Sin `MERCADOPAGO_ACCESS_TOKEN`, los botones abren WhatsApp con el plan elegido (como antes).

## SEO (para el vendedor)

En **Dashboard → Ajustes y SEO** cada tienda define título y descripción. Eso alimenta las meta etiquetas y Open Graph cuando comparten el link en WhatsApp o Instagram.

## QR

**Dashboard → QR** genera un PNG con el link `mendoshop.com/tienda/slug` listo para imprimir o mostrar en el local.
