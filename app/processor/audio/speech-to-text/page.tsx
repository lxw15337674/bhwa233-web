'use client';

import React from 'react';
import { SpeechToTextControlPanel } from '@/components/media-processor/control-panels/SpeechToTextControlPanel';

export default function SpeechToTextPage() {
  return (
    <div className="space-y-6">
      <SpeechToTextControlPanel />
    </div>
  );
}