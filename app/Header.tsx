'use client'
import React, { useEffect } from 'react';
import { ModeToggle } from 'src/components/ModeToggle';
import { useTranslation } from '../src/components/TranslationProvider';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent
} from '../src/components/ui/navigation-menu';
import { Button } from '../src/components/ui/button';
import { LayoutGrid } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Categories, CategoryItem } from './RouterConfig';
import Link from 'next/link';
import { ScrollToTop } from '../src/components/ScrollToTop';
import { ArrowUpToLine } from 'lucide-react';
import { cn } from '../src/lib/utils';
import { LanguageSwitcher } from '../src/components/LanguageSwitcher';
import { locales } from '../src/lib/i18n';

export default function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();

  // 从路径中提取当前语言
  const currentLocale = locales.find(locale =>
    pathname?.startsWith(`/${locale}`)
  ) || 'en';

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
      document.title = currentApp.name;
    }
  }, [pathname, currentApp]);

  return (
    <header className="sticky left-0 right-0 top-0 z-50 bg-background border-b-0.5 border-border">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <div className="px-4 py-2 bg-background border-b border-border flex items-center">
        <div className="mr-4 flex items-center space-x-2">
          <NavigationMenu>
            <NavigationMenuList>
              {filteredCategories.map((category: CategoryItem) => {
                const CategoryIcon = category.icon;
                const categoryName = category.translationKey ? t(category.translationKey) : category.name;
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
                          const isActive = pathname?.includes(item.url.split('?')[0]);
                          const itemName = item.translationKey ? t(item.translationKey) : item.name;
                          const itemDesc = item.descriptionKey ? t(item.descriptionKey) : item.description;
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
                                {itemDesc && (
                                  <span className="text-xs text-muted-foreground mt-1">
                                    {itemDesc}
                                  </span>
                                )}
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
          <span className="font-bold">
            {currentApp?.translationKey ? t(currentApp.translationKey) : currentApp?.name}
          </span>
        </div>
        <div className="flex-1" />
        <div className='flex items-center space-x-2'>
          <LanguageSwitcher />
          <ScrollToTop scrollTo={10} variant="outline" size="icon">
            <ArrowUpToLine />
          </ScrollToTop>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
