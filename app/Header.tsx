'use client'
import React, { useEffect } from 'react';
import { ModeToggle } from 'src/components/ModeToggle';
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

export default function Header() {
  const router = usePathname();
  const allAppsFlat = Categories.flatMap(category => category.items);
  const currentApp = allAppsFlat.find((app) => router?.startsWith(app.url.split('?')[0]));

  useEffect(() => {
    if (currentApp) {
      document.title = currentApp.name;
    }
  }, [router, currentApp]);

  return (
    <header className="sticky left-0 right-0 top-0 z-50 bg-background border-b-0.5 border-border">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <div className="px-4 py-2 bg-background border-b border-border flex items-center">
        <div className="mr-4 flex items-center space-x-2">
          <NavigationMenu>
            <NavigationMenuList>
              {Categories.map((category: CategoryItem) => {
                const CategoryIcon = category.icon;
                return (
                  <NavigationMenuItem key={category.id}>
                    <NavigationMenuTrigger className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4" />
                      {category.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {category.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = router?.startsWith(item.url.split('?')[0]);
                          return (
                            <Link
                              key={item.url}
                              href={item.url}
                              className={cn(
                                "flex items-center gap-2 rounded-md p-3 hover:bg-accent hover:text-accent-foreground",
                                isActive && "bg-accent text-accent-foreground"
                              )}
                            >
                              <ItemIcon className="h-5 w-5" />
                              <div className="flex flex-col">
                                <span className="font-medium">{item.name}</span>
                                {item.description && (
                                  <span className="text-xs text-muted-foreground mt-1">
                                    {item.description}
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
          <span className="font-bold">{currentApp?.name}</span>
        </div>
        <div className="flex-1" />
        <div className='space-x-2'>
          <ScrollToTop scrollTo={10} variant="outline" size="icon">
            <ArrowUpToLine />
          </ScrollToTop>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
