import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Deshabilitar StrictMode temporalmente para debugging
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Removido output: 'export' para permitir APIs dinámicas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'clipboard-write',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
