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

## 4. Reiniciar la app

```bash
npm run dev
```

Probar: http://localhost:3000/registro

## Conectar Cursor a la cuenta nueva (opcional)

Para que el asistente pueda crear tablas desde acá: en Cursor, reconectá el MCP/plugin de Supabase iniciando sesión con la **cuenta nueva**, no con Lumina.
