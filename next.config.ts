import type { NextConfig } from 'next'

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: supabaseHost
    ? {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: supabaseHost,
            pathname: '/storage/v1/object/public/shop-images/**',
          },
        ],
      }
    : undefined,
}

export default nextConfig
