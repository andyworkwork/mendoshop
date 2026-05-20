import type { NextConfig } from 'next'

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1536, 1920, 2048],
    qualities: [75, 85, 92],
    ...(supabaseHost
      ? {
          remotePatterns: [
            {
              protocol: 'https' as const,
              hostname: supabaseHost,
              pathname: '/storage/v1/object/public/shop-images/**',
            },
          ],
        }
      : {}),
  },
}

export default nextConfig
