/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/dispatches",
        permanent: true,
      },
      {
        source: "/blog/:path*",
        destination: "/dispatches/:path*",
        permanent: true,
      },
    ];
  },
}

export default nextConfig
