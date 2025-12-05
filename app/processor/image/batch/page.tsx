'use client';

import React from 'react';
import { BatchTaskGrid } from '@/components/media-processor/batch/BatchTaskGrid';
import { BatchControlPanel } from '@/components/media-processor/batch/BatchControlPanel';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BatchImageProcessorPage() {
    return (
        <div className="container mx-auto p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center gap-4 flex-shrink-0">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/processor/image">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">批量图片处理</h1>
                    <p className="text-muted-foreground">
                        批量转换格式、压缩、调整尺寸
                    </p>
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
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
