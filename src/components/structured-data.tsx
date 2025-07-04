import Script from 'next/script'

interface StructuredDataProps {
    data: object
}

export function StructuredData({ data }: StructuredDataProps) {
    return (
        <Script
            id="structured-data"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    )
}

// 网站结构化数据
export const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "工具箱",
    "url": "https://bhwa233-web.vercel.app",
    "description": "集成云顶之弈攻略、摸鱼办、热榜资讯等多功能的在线工具箱",
    "applicationCategory": "Utility",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    },
    "author": {
        "@type": "Person",
        "name": "233tools"
    },
    "publisher": {
        "@type": "Organization",
        "name": "工具箱"
    }
}

// 云顶之弈攻略结构化数据
export const tftGuideStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "云顶之弈攻略助手",
    "description": "最新云顶之弈装备合成表、羁绊搭配推荐、英雄技能详解",
    "url": "https://bhwa233-web.vercel.app/tft",
    "author": {
        "@type": "Person",
        "name": "233tools"
    },
    "publisher": {
        "@type": "Organization",
        "name": "工具箱"
    },
    "dateModified": new Date().toISOString(),
    "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://bhwa233-web.vercel.app/tft"
    }
}
