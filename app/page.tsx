import Link from 'next/link'
import { Categories } from './RouterConfig'
import type { Metadata } from 'next'
import { StructuredData, websiteStructuredData } from '@/components/structured-data'

export const metadata: Metadata = {
  title: '工具箱 - 在线生产力工具集合',
  description: '集成摸鱼办热榜、在线聊天、文件上传、媒体处理等多功能工具，一站式提升您的工作效率和娱乐体验',
  keywords: ['在线工具箱', '摸鱼办', '热榜资讯', '生产力工具'],
  openGraph: {
    title: '工具箱 - 在线生产力工具集合',
    description: '集成摸鱼办热榜、在线聊天、文件上传、媒体处理等多功能工具',
    url: 'https://233tools.vercel.app',
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
            集成摸鱼办热榜、在线聊天、文件上传、媒体处理等实用工具，助您提升效率、享受娱乐
          </p>
        </header>

        <section>
          <h2 className="text-lg font-semibold mb-4">应用导航</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Categories.flatMap(category => category.items).map((app) => (
              <Link
                key={app.url}
                href={app.url}
                className="flex flex-col items-center justify-center p-2 rounded-lg border hover:bg-accent transition-colors"
                title={app.description || `使用 ${app.name} 工具`}
              >
                {app.icon && <app.icon className="w-8 h-8 mb-4" aria-hidden="true" />}
                <span className="text-center">{app.name}</span>
                {app.description && (
                  <span className="text-xs text-muted-foreground mt-1 text-center">
                    {app.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
