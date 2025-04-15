import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['picsum.photos'],
  },
  experimental: {
    serverActions: true,
  },
  webpack: (config, {isServer}) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }
    config.module.rules.push({
      test: /\.(bin|wasm)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/chunks/[hash][ext][query]',
      },
    });
    return config;
  },
  publicRuntimeConfig: {
    APP_VERSION: process.env.APP_VERSION,
  },
};

export default nextConfig;

