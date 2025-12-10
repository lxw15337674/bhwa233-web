'use client';

import React from 'react';
import { useTranslation } from '@/components/TranslationProvider';
import { ProcessorLayout } from '@/components/media-processor/layout/ProcessorLayout';
import { BatchTaskGrid } from '@/components/media-processor/batch/BatchTaskGrid';
import { BatchControlPanel } from '@/components/media-processor/batch/BatchControlPanel';

export default function BatchImagePage() {
  const { t } = useTranslation();

  const leftColumn = (
    <BatchTaskGrid />
  );

  const rightColumn = (
    <BatchControlPanel />
  );

  return (
    <ProcessorLayout
      title={t('mediaProcessor.functions.imageBatch.label')}
      description={t('mediaProcessor.functions.imageBatch.description')}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
}
