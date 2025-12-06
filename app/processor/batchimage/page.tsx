'use client';

import React from 'react';
import { BatchTaskGrid } from '@/components/media-processor/batch/BatchTaskGrid';
import { BatchControlPanel } from '@/components/media-processor/batch/BatchControlPanel';
import { PageHeader } from '@/components/media-processor/PageHeader';

export default function BatchImageProcessorPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="图片批量处理器"
                description="支持批量转换格式、压缩、尺寸调整、旋转翻转等功能"
            />

            <div className="flex gap-6">
                {/* Left Side: Task Grid (Main Content) */}
                <div className="flex-1 min-w-0">
                    <BatchTaskGrid />
                </div>

                {/* Right Side: Controls (Sidebar) */}
                <div className="w-80 flex-shrink-0">
                    <BatchControlPanel />
                </div>
            </div>
        </div>
    );
}
