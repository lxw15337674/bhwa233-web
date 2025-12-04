
import React from 'react';
import { CategoryNavigation } from '@/components/media-processor/CategoryNavigation';

export { metadata } from './metadata';

interface Props {
    children: React.ReactNode;
}

const ImageProcessorLayout: React.FC<Props> = ({ children }) => {
    return (
        <div className="min-h-screen text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* 分类导航 */}
                <CategoryNavigation />

                {children}
            </div>
        </div>
    );
};

export default ImageProcessorLayout;
