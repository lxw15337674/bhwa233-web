'use client';

import { useEffect } from 'react';

interface ImagePreloaderProps {
    images: string[];
    priority?: boolean;
}

/**
 * 图片预加载组件
 * 在后台预加载图片，提升用户体验
 */
export function ImagePreloader({ images, priority = false }: ImagePreloaderProps) {
    useEffect(() => {
        // 只在浏览器环境中执行
        if (typeof window === 'undefined') return;

        const preloadImages = () => {
            images.forEach((src) => {
                if (!src) return;

                const img = new Image();
                img.src = src;

                // 如果是高优先级图片，设置更高的优先级
                if (priority) {
                    img.loading = 'eager';
                }
            });
        };

        // 延迟预加载，避免影响关键渲染路径
        if (priority) {
            preloadImages();
        } else {
            const timer = setTimeout(preloadImages, 100);
            return () => clearTimeout(timer);
        }
    }, [images, priority]);

    return null;
}

/**
 * 为装备图片创建预加载列表
 */
export function getEquipmentImageUrls(equipsByType: Map<string, any[]>): string[] {
    const imageUrls: string[] = [];

    equipsByType.forEach((equips) => {
        equips.forEach((equip) => {
            if (equip.imagePath) {
                imageUrls.push(equip.imagePath);
            }
        });
    });

    return imageUrls;
}

/**
 * 图片懒加载错误处理
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget;

    // 设置默认占位符
    if (!img.dataset.hasErrored) {
        img.dataset.hasErrored = 'true';
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0yMCAyOEM5IDE2IDkgOSAxNyA5SDIzQzMxIDkgMzEgMTYgMjAgMjhaIiBmaWxsPSIjZTFlNGU3Ii8+Cjwvc3ZnPgo=';
    }
}
