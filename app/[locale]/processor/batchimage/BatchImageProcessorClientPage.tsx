'use client';

import React from 'react';
import { BatchTaskGrid } from '@/components/media-processor/batch/BatchTaskGrid';
import { BatchControlPanel } from '@/components/media-processor/batch/BatchControlPanel';
import { PageHeader } from '@/components/media-processor/PageHeader';
import { useTranslation } from '@/components/TranslationProvider';

const BatchImageProcessorClientPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className=" container mx-auto px-4 py-8 ">
            <PageHeader
                title={t('batchImageProcessor.title')}
                description={t('batchImageProcessor.description')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：任务列表（主要内容区） */}
                <div className="lg:col-span-2">
                    <BatchTaskGrid />
                </div>

                {/* 右侧：控制面板 */}
                <div>
                    <BatchControlPanel />
                </div>
            </div>
        </div>
    );
};

export default BatchImageProcessorClientPage;
