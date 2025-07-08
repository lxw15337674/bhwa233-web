import React from 'react';
import { ProcessorFunction } from '@/types/media-processor';
import { isValidVideoFile, isValidAudioFile, SUPPORTED_VIDEO_FORMATS, SUPPORTED_AUDIO_FORMATS } from '@/utils/audioConverter';

// 导入控制面板组件
import AudioExtractControlPanel from '@/components/media-processor/control-panels/AudioExtractControlPanel';
import AudioConvertControlPanel from '@/components/media-processor/control-panels/AudioConvertControlPanel';
import VideoCompressControlPanel from '@/components/media-processor/control-panels/VideoCompressControlPanel';

// 功能注册表
export const PROCESSOR_FUNCTIONS: ProcessorFunction[] = [
    {
        id: 'audio-extract',
        label: '音频提取',
        description: '从视频文件中提取音频轨道',
        category: 'video',
        icon: '🎵',
        component: AudioExtractControlPanel,
        fileValidator: (file: File) => isValidVideoFile(file.name),
        supportedFormats: SUPPORTED_VIDEO_FORMATS,
        defaultParams: {
            outputFormat: 'mp3',
            qualityMode: 'original'
        }
    },
    {
        id: 'video-compress',
        label: '视频压缩',
        description: '压缩视频文件以减小文件大小',
        category: 'video',
        icon: '📦',
        component: VideoCompressControlPanel,
        fileValidator: (file: File) => isValidVideoFile(file.name),
        supportedFormats: SUPPORTED_VIDEO_FORMATS,
        defaultParams: {
            outputFormat: 'mp4',
            compressionLevel: 'medium'
        }
    },
    {
        id: 'audio-convert',
        label: '格式转换',
        description: '音频格式之间的转换',
        category: 'audio',
        icon: '🔄',
        component: AudioConvertControlPanel,
        fileValidator: (file: File) => isValidAudioFile(file.name),
        supportedFormats: SUPPORTED_AUDIO_FORMATS,
        defaultParams: {
            outputFormat: 'mp3',
            qualityMode: 'original'
        }
    }
];

// 根据分类获取功能列表
export const getFunctionsByCategory = (category: 'video' | 'audio'): ProcessorFunction[] => {
    return PROCESSOR_FUNCTIONS.filter(func => func.category === category);
};

// 根据ID获取功能
export const getFunctionById = (id: string): ProcessorFunction | undefined => {
    return PROCESSOR_FUNCTIONS.find(func => func.id === id);
};

// 获取默认功能
export const getDefaultFunction = (category: 'video' | 'audio'): string => {
    const functions = getFunctionsByCategory(category);
    return functions.length > 0 ? functions[0].id : '';
};

// 分类配置
export const PROCESSOR_CATEGORIES = {
    video: {
        label: '视频处理',
        icon: '🎬',
        description: '视频相关的处理功能'
    },
    audio: {
        label: '音频处理',
        icon: '🎧',
        description: '音频相关的处理功能'
    }
} as const; 