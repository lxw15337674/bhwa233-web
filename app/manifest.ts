import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '工具箱 - 在线生产力工具集合',
        short_name: '工具箱',
        description: '集成云顶之弈攻略、摸鱼办热榜、在线聊天等多功能工具，提升效率与娱乐体验',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        categories: ['productivity', 'utilities', 'games', 'entertainment'],
        lang: 'zh-CN',
        scope: '/',
        icons: [
            {
                src: 'icons/icon-256.png',
                sizes: '72x72',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: 'icons/icon-256.png',
                sizes: '96x96',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: 'icons/icon-256.png',
                sizes: '128x128',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: 'icons/icon-256.png',
                sizes: '144x144',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: 'icons/icon-256.png',
                sizes: '152x152',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: 'icons/icon-256.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: 'icons/icon-256.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: 'icons/icon-256.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
            },
        ],
    };
}