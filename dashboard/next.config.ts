import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: [],
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  async rewrites() {
    // Dynamic OpenClaw backend URL from environment
    const openclawHttpUrl = process.env.NEXT_PUBLIC_OPENCLAW_HTTP_URL ?? 'http://127.0.0.1:18789';

    return [
      {
        source: '/api/openclaw-socket/:path*',
        destination: `${openclawHttpUrl}/:path*`,
      },
    ];
  },

  // Production chunk splitting — isolate heavy libs into their own chunks
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          xyflow: {
            test: /[\\/]node_modules[\\/]@xyflow[\\/]/,
            name: 'xyflow',
            chunks: 'all' as const,
            priority: 30,
          },
          recharts: {
            test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
            name: 'recharts',
            chunks: 'all' as const,
            priority: 30,
          },
          forcegraph: {
            test: /[\\/]node_modules[\\/](react-force-graph|d3-force)[\\/]/,
            name: 'forcegraph',
            chunks: 'all' as const,
            priority: 30,
          },
          tsparticles: {
            test: /[\\/]node_modules[\\/]@tsparticles[\\/]/,
            name: 'tsparticles',
            chunks: 'all' as const,
            priority: 30,
          },
          highlightjs: {
            test: /[\\/]node_modules[\\/]highlight\.js[\\/]/,
            name: 'highlightjs',
            chunks: 'all' as const,
            priority: 30,
          },
          markdown: {
            test: /[\\/]node_modules[\\/](react-markdown|remark-.*|rehype-.*|unified|micromark)[\\/]/,
            name: 'markdown',
            chunks: 'all' as const,
            priority: 25,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
