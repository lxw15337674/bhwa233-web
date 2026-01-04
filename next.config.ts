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
  // turbopack: {}, // 暂时禁用 turbopack，因为它与 dynamic import 有兼容性问题
  webpack: (config, { isServer }) => {
    // 在服务器端排除 canvas 包
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }

    // 处理 WASM 文件
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });
    return config;
  },
  transpilePackages: ['react-filerobot-image-editor'],
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
        hostname: 'tools.bhwa233.com',
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
      // 支持带 locale 前缀的请求（例如 /en/telegraph-upload）
      {
        source: '/:locale/telegraph-upload',
        destination: 'https://cloudflare-imgbed-76v.pages.dev/upload',
      },
      {
        source: '/:locale/jiaqi',
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
      // WASM 库静态文件需要额外的 CORP 头（包括 wasm-vips 和 ffmpeg）
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      }
    ];
  },
});

export default nextConfig;
