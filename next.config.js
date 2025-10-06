/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: ['maps.googleapis.com'],
  },
}

module.exports = nextConfig