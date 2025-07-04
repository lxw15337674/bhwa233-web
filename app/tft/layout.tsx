import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        default: '云顶之弈攻略大全 - TFT装备合成表·羁绊搭配·阵容推荐',
        template: '%s | 云顶之弈攻略'
    },
};

export default function TftLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* 结构化数据 - JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebApplication',
                        name: '云顶之弈攻略助手',
                        description: '云顶之弈装备合成表与羁绊搭配指南，提供最新TFT攻略、阵容推荐、装备公式',
                        url: 'https://bhwa233-web.vercel.app/zh/tft',
                        applicationCategory: 'GameApplication',
                        operatingSystem: 'Any',
                        inLanguage: 'zh-CN',
                        audience: {
                            '@type': 'Audience',
                            audienceType: '游戏玩家',
                            geographicArea: {
                                '@type': 'Country',
                                name: '中国',
                            },
                        },
                        offers: {
                            '@type': 'Offer',
                            price: '0',
                            priceCurrency: 'CNY',
                            availability: 'https://schema.org/InStock',
                        },
                        featureList: [
                            '装备合成表查询',
                            '羁绊搭配指南',
                            '阵容推荐',
                            '英雄技能详解',
                            '奥恩神器介绍',
                            '金鳞龙装备说明',
                            '辅助装备列表',
                            '转职纹章大全',
                            '实时版本更新',
                            '移动端适配',
                        ],
                        browserRequirements: 'HTML5, JavaScript enabled',
                        softwareVersion: '1.0',
                        author: {
                            '@type': 'Person',
                            name: '233tools',
                        },
                        provider: {
                            '@type': 'Organization',
                            name: '工具箱',
                            url: 'https://bhwa233-web.vercel.app',
                        },
                        about: {
                            '@type': 'VideoGame',
                            name: '云顶之弈',
                            alternateName: ['TFT', 'Teamfight Tactics'],
                            genre: '自走棋',
                            description: '《英雄联盟》衍生的回合制策略游戏',
                            publisher: {
                                '@type': 'Organization',
                                name: 'Riot Games',
                            },
                            gamePlatform: ['PC', 'Mobile'],
                        },
                        mainEntity: [
                            {
                                '@type': 'Thing',
                                name: '装备合成',
                                description: '通过组合基础装备合成高级装备的游戏机制',
                            },
                            {
                                '@type': 'Thing',
                                name: '羁绊系统',
                                description: '相同种族或职业的棋子组合产生的特殊效果',
                            },
                            {
                                '@type': 'Thing',
                                name: '阵容搭配',
                                description: '合理搭配棋子和装备以获得最佳战斗效果',
                            },
                        ],
                    }),
                }}
            />
            {children}
        </>
    );
}
