import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'img.youtube.com', 'i.ytimg.com'],
  },
  // Silence monorepo lockfile warning by pointing tracing to workspace root
  outputFileTracingRoot: path.join(__dirname, '..'),
}

export default nextConfig

