'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ControlPanelProps } from '@/types/media-processor';
import { Construction } from 'lucide-react';

export const VideoCompressControlPanel: React.FC<ControlPanelProps> = ({
  selectedFile,
  onStateChange,
  onOutputReady
}) => {
  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto">
              <Construction className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">视频压缩功能</h3>
              <p className="text-muted-foreground text-sm">
                该功能正在开发中，敬请期待...
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              即将支持：
              <ul className="mt-2 space-y-1">
                <li>• 智能压缩算法</li>
                <li>• 多种输出格式</li>
                <li>• 质量与大小平衡</li>
                <li>• 批量处理</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoCompressControlPanel; 