import Link from 'next/link'
import { Apps } from './RouterConfig'
import type { Metadata } from 'next'
import { StructuredData, websiteStructuredData } from '@/components/structured-data'

export const metadata: Metadata = {
  title: '工具箱 - 在线生产力工具集合',
  description: '集成云顶之弈攻略助手、摸鱼办热榜、在线聊天等多功能工具，一站式提升您的工作效率和娱乐体验',
  keywords: ['在线工具箱', '云顶之弈攻略', 'TFT助手', '摸鱼办', '热榜资讯', '生产力工具', '装备合成指南'],
  openGraph: {
    title: '工具箱 - 在线生产力工具集合',
    description: '集成云顶之弈攻略助手、摸鱼办热榜、在线聊天等多功能工具',
    url: 'https://bhwa233-web.vercel.app',
    type: 'website',
  },
}

export default function Home() {
  return (
    <>
      <StructuredData data={websiteStructuredData} />
      <div className="container px-4 py-4 mx-auto max-w-7xl">
        <header>
          <h1 className="text-2xl font-bold mb-4">在线工具箱 - 生产力与娱乐工具集合</h1>
          <p className="text-muted-foreground mb-6">
            集成云顶之弈攻略助手、摸鱼办热榜、在线聊天等实用工具，助您提升效率、享受娱乐
          </p>
        </header>

        <section>
          <h2 className="text-lg font-semibold mb-4">应用导航</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Apps.map((app) => (
              <Link
                key={app.url}
                href={app.url}
                className="flex flex-col items-center justify-center p-2 rounded-lg border hover:bg-accent transition-colors"
                title={`使用 ${app.name} 工具`}
              >
                {app.icon && <app.icon className="w-8 h-8 mb-4" aria-hidden="true" />}
                <span className="text-center">{app.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
