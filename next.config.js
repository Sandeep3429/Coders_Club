/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure static exports for static hosting (GitHub Pages, Netlify, Cloudflare Pages, S3)
  output: 'export',
  // Disable image optimization API as it requires a server backend
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
