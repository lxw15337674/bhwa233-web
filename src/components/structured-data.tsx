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
    "url": "https://233tools.vercel.app",
    "description": "集成摸鱼办、热榜资讯、文件上传、媒体处理等多功能的在线工具箱",
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

