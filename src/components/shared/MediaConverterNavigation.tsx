'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Video, Music } from 'lucide-react';

export const MediaConverterNavigation: React.FC = () => {
    const pathname = usePathname();

    const navItems = [
        {
            href: '/audio-converter',
            label: '视频音频提取',
            icon: Video,
            active: pathname === '/audio-converter',
            description: '从视频文件中提取音频'
        },
        {
            href: '/audio-format-converter',
            label: '音频格式转换',
            icon: Music,
            active: pathname === '/audio-format-converter',
            description: '音频格式之间的转换'
        }
    ];

    return (
        <nav className="mb-8">
            <div className="flex justify-center">
                <div className="flex bg-muted p-1 rounded-lg">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                    item.active
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};
