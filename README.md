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

| Plan | Productos | Fotos/producto |
|------|-----------|----------------|
| Prueba 14 días | 15 | 2 |
| Básico | 60 | 4 |
| Pro | 300 | 8 |

Los pagos (Mercado Pago) se pueden activar manualmente actualizando `plan` y `plan_until` en la tabla `shops`.

## SEO (para el vendedor)

En **Dashboard → Ajustes y SEO** cada tienda define título y descripción. Eso alimenta las meta etiquetas y Open Graph cuando comparten el link en WhatsApp o Instagram.

## QR

**Dashboard → QR** genera un PNG con el link `mendoshop.com/tienda/slug` listo para imprimir o mostrar en el local.
