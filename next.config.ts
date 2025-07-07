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
  experimental: {
    largePageDataBytes: 512 * 100000,
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
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

    // 忽略相关警告和错误
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Failed to parse source map/,
      /Module not found.*@ffmpeg/,
      /Can't resolve.*<dynamic>/,
      /Critical dependency: the request of a dependency is an expression/,
    ];

    return config;
  },
  // 为了支持 SharedArrayBuffer（虽然我们用单线程版本，但这有助于兼容性）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          }
        ]
      }
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    unoptimized: true,
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
      {
        source: '/en/tft/:path*',
        destination: '/zh/tft/:path*',
        permanent: true,
      },
      // 繁体用户访问，重定向到简体中文（因为内容相同）
      {
        source: '/zh-tw/fishingTime',
        destination: '/zh/fishingTime',
        permanent: true,
      },
      {
        source: '/zh-tw/tft/:path*',
        destination: '/zh/tft/:path*',
        permanent: true,
      },
    ];
  },
  rewrites: async () => {
    return [
      {
        source: '/telegraph-upload',
        destination: 'https://telegraph-image-bww.pages.dev/upload',
      },
      {
        source: '/jiaqi',
        destination:
          'https://s3.cn-north-1.amazonaws.com.cn/general.lesignstatic.com/config/jiaqi.json',
      },
      {
        source: '/routing/tftVersionConfig',
        destination:
          'https://lol.qq.com/zmtftzone/public-lib/versionconfig.json',
      },
      {
        source: '/bhwa233-api/:path*',
        destination: 'https://bhwa233-api.vercel.app/api/:path*',
      }
    ];
  },
});

export default nextConfig;
