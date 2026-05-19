# Mendoshop en tu cuenta nueva de Supabase

El asistente de Cursor solo estaba conectado a la cuenta **Lumina Mendoza**. Por eso se creó por error un proyecto extra ahí (`azkazexokjnnqlfeasng`). **Podés borrarlo** en el dashboard de Lumina si no lo vas a usar.

Tu repo debe usar **solo** el proyecto de la cuenta nueva (ref en la URL del navegador, ej. `qoyojbjzoyjflhljvisk`).

## 1. Variables en `.env.local`

En el proyecto abierto en el navegador → **Settings → API**:

| Variable | Qué copiar |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (secret) |

Las tres deben ser del **mismo** proyecto.

## 2. Base de datos (una sola vez)

**SQL Editor → New query** → pegá todo el archivo:

`supabase/migrations/001_mendoshop_init.sql`

→ **Run**.

Si ya corriste algo y falla por “already exists”, borrá el proyecto y creá uno vacío, o pedí ayuda para resetear.

## 3. Auth

- **Authentication → Providers**: Email activado.
- Para probar sin mail de confirmación: desactivá **Confirm email**.
- **URL Configuration**: `http://localhost:3000/**` en Redirect URLs.

## 3b. Usuario maestro (panel admin)

1. Ejecutá también `supabase/migrations/002_platform_admin_access.sql` en el SQL Editor.
2. Registrate en la app con **tu** email (`/registro` o `/login`).
3. En SQL Editor:

```sql
insert into public.platform_admins (email) values ('tu@email.com')
on conflict do nothing;
```

4. Entrá a **http://localhost:3000/admin** — ahí podés crear cuentas y tiendas para otros (email confirmado automáticamente).

Necesitás `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` para que el admin cree usuarios.

## 4. Vercel (producción)

En **Project → Settings → Environment Variables** agregá:

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Igual que local |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Igual que local |
| `SUPABASE_SERVICE_ROLE_KEY` | Igual que local |
| `NEXT_PUBLIC_APP_URL` | `https://mendoshop.vercel.app` (tu dominio real) |

En Supabase **Authentication → URL Configuration**, agregá `https://mendoshop.vercel.app/**` en Redirect URLs.

Sin `NEXT_PUBLIC_APP_URL`, la app intenta usar `VERCEL_URL` al desplegar; conviene fijar la URL igual por los QR y WhatsApp.

## 5. Reiniciar la app

```bash
npm run dev
```

Probar: http://localhost:3000/registro

## Conectar Cursor a la cuenta nueva (opcional)

Para que el asistente pueda crear tablas desde acá: en Cursor, reconectá el MCP/plugin de Supabase iniciando sesión con la **cuenta nueva**, no con Lumina.
