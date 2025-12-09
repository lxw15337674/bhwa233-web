import withSerwistInit from "@serwist/next";
import type { NextConfig } from 'next'

const withSerwist = withSerwistInit({
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = withSerwist({
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack 配置（Next.js 16 默认使用 Turbopack）
  turbopack: {},
  webpack: (config, { isServer }) => {
    // FFmpeg.wasm 配置
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // 禁用动态导入的解析以避免 import.meta.url 问题
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // 处理 WASM 文件
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });


    return config;
  },
  images: {
    dangerouslyAllowSVG: true,
    // 启用图片优化，移除unoptimized配置
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'game.gtimg.cn',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'awsl.azureedge.net',
      },
      {
        protocol: 'https',
        hostname: '233tools.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'www.googletagmanager.com',
      },
    ],
  },
  async redirects() {
    return [
      // 英文用户访问中文专属功能，重定向到中文版
      {
        source: '/en/fishingTime',
        destination: '/zh/fishingTime',
        permanent: true,
      },
      // 繁体用户访问，重定向到简体中文（因为内容相同）
      {
        source: '/zh-tw/fishingTime',
        destination: '/zh/fishingTime',
        permanent: true,
      },
      // 将旧的媒体处理器图片/编辑路由重定向到新的独立路由
      {
        source: '/media-processor',
        has: [
          {
            type: 'query',
            key: 'category',
            value: 'image',
          },
        ],
        destination: '/processor/image',
        permanent: true,
      },
      // Deprecated routes
      {
        source: '/audio-converter',
        destination: '/media-processor',
        permanent: true,
      },
      {
        source: '/audio-format-converter',
        destination: '/media-processor',
        permanent: true,
      },
    ];
  },
  rewrites: async () => {
    return [
      {
        source: '/telegraph-upload',
        destination: 'https://cloudflare-imgbed-76v.pages.dev/upload',
      },
      {
        source: '/jiaqi',
        destination:
          'https://s3.cn-north-1.amazonaws.com.cn/general.lesignstatic.com/config/jiaqi.json',
      },
      {
        source: '/bhwa233-api/:path*',
        destination: 'https://bhwa233-api.vercel.app/api/:path*',
      }
    ];
  },
  // 添加 COEP/COOP 头以支持 SharedArrayBuffer（wasm-vips 需要）
  headers: async () => {
    return [
      // 带语言前缀的路由
      {
        source: '/:locale/processor/image/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/:locale/processor/image',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/:locale/processor/batchimage',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/:locale/processor/batchimage/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/:locale/processor/editor',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/:locale/processor/editor/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/:locale/media-processor',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/:locale/media-processor/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      // 旧路由（兼容性）
      {
        source: '/processor/image/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/processor/image',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/media-processor',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/media-processor/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/processor/batchimage',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/processor/batchimage/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      // WASM 库静态文件需要 COEP 头（包括 wasm-vips 和 ffmpeg）
      {
        source: '/wasm-libs/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
});

export default nextConfig;
