'use client'
import { useEffect } from 'react';
import { ModeToggle } from 'src/components/ModeToggle';
import { useTranslations, useLocale } from 'next-intl';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent
} from '../src/components/ui/navigation-menu';
import { usePathname, useSearchParams } from 'next/navigation';
import { Categories, CategoryItem } from './RouterConfig';
import Link from 'next/link';
import { cn } from '../src/lib/utils';
import { LanguageSwitcher } from '../src/components/LanguageSwitcher';
import { locales } from '../src/lib/i18n';

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 使用 useLocale 获取当前语言
  const currentLocale = locale;

  // 过滤菜单项（非中文环境隐藏摸鱼办）
  const filteredCategories = Categories.map(category => ({
    ...category,
    items: category.items.filter(item => {
      if (item.url === '/fishingTime' && !currentLocale.startsWith('zh')) {
        return false;
      }
      return true;
    })
  })).filter(category => category.items.length > 0);

  const allAppsFlat = filteredCategories.flatMap(category => category.items);
  const currentApp = allAppsFlat.find((app) => pathname?.includes(app.url.split('?')[0]));

  useEffect(() => {
    if (currentApp) {
      document.title = t(currentApp.translationKey);
    }
  }, [pathname, currentApp, t]);

  return (
    <header className="sticky left-0 right-0 top-0 z-50 bg-background border-b-0.5 border-border">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <div className="px-4 py-2 bg-background border-b border-border flex items-center">
        <div className="mr-4 flex items-center space-x-2">
          <NavigationMenu>
            <NavigationMenuList>
              {filteredCategories.map((category: CategoryItem) => {
                const CategoryIcon = category.icon;
                const categoryName = t(category.translationKey);
                return (
                  <NavigationMenuItem key={category.id}>
                    <NavigationMenuTrigger className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4" />
                      {categoryName}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {category.items.map((item) => {
                          const ItemIcon = item.icon;

                          // 更精确的激活状态判断
                          let isActive = false;
                          const baseUrl = item.url.split('?')[0];

                          if (item.url.includes('?')) {
                            // 对于带查询参数的 URL（如 /media-processor?category=audio&function=xxx）
                            const urlParams = new URLSearchParams(item.url.split('?')[1]);
                            const itemFunction = urlParams.get('function');
                            const currentFunction = searchParams?.get('function');

                            // 必须路径匹配且 function 参数也匹配
                            isActive = pathname?.includes(baseUrl) && itemFunction === currentFunction;
                          } else {
                            // 对于普通路径 URL（如 /processor/image）
                            isActive = pathname === `/${currentLocale}${item.url}` || pathname?.startsWith(`/${currentLocale}${item.url}/`);
                          }

                          const itemName = t(item.translationKey);
                          const itemDesc = t(item.descriptionKey);
                          return (
                            <Link
                              key={item.url}
                              href={`/${currentLocale}${item.url}`}
                              className={cn(
                                "flex items-center gap-2 rounded-md p-3 hover:bg-accent hover:text-accent-foreground",
                                isActive && "bg-accent text-accent-foreground"
                              )}
                            >
                              <ItemIcon className="h-5 w-5" />
                              <div className="flex flex-col">
                                <span className="font-medium">{itemName}</span>
                                <span className="text-xs text-muted-foreground mt-1">
                                  {itemDesc}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex-1" />
        <div className='flex items-center space-x-2'>
          <LanguageSwitcher />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
