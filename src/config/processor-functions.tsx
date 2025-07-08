import { ConversionSettings } from '@/components/media-processor/control-panels/ConversionSettings';
import { AudioSpeedControlPanel } from '@/components/media-processor/control-panels/AudioSpeedControlPanel';
import { AudioConvertControlPanel } from '@/components/media-processor/control-panels/AudioConvertControlPanel';
import { AudioExtractControlPanel } from '@/components/media-processor/control-panels/AudioExtractControlPanel';
import { VideoCompressControlPanel } from '@/components/media-processor/control-panels/VideoCompressControlPanel';
import { ProcessorFunction, ProcessorCategory } from '@/types/media-processor';
import { getMediaType } from '@/utils/audioConverter';

const audioFileValidator = (file: File) => getMediaType(file.name) === 'audio';
const videoFileValidator = (file: File) => getMediaType(file.name) === 'video';

export const PROCESSOR_CATEGORIES: Record<ProcessorCategory, { label: string; icon: string }> = {
    audio: { label: '音频', icon: '🎵' },
    video: { label: '视频', icon: '🎥' },
};

const PROCESSOR_FUNCTIONS: ProcessorFunction[] = [
// 音频功能
    {
        id: 'audio-convert',
        label: '音频格式转换',
        category: 'audio',
        description: '将音频文件转换为不同的格式和质量。',
        icon: '🎵',
        component: AudioConvertControlPanel,
        fileValidator: audioFileValidator,
        supportedFormats: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'aiff'],
    },
    {
        id: 'audio-speed-change',
        label: '音频倍速调整',
        category: 'audio',
        description: '调整音频的播放速度，同时保持音调不变。',
        icon: '⏩',
        component: AudioSpeedControlPanel,
        fileValidator: audioFileValidator,
        supportedFormats: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'aiff'],
    },

    // 视频功能
    {
        id: 'video-compress',
        label: '视频压缩',
        category: 'video',
        description: '压缩视频文件，减小文件大小并调整分辨率。',
        icon: '🗜️',
        component: VideoCompressControlPanel,
        fileValidator: videoFileValidator,
        supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'],
    },
    {
        id: 'audio-extract',
        label: '音频提取',
        category: 'video',
        description: '从视频文件中提取音频轨道。',
        icon: '🎤',
        component: AudioExtractControlPanel,
        fileValidator: videoFileValidator,
        supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'],
    },
];

export const getFunctionsByCategory = (category: ProcessorCategory): ProcessorFunction[] => {
    return PROCESSOR_FUNCTIONS.filter(func => func.category === category);
};

export const getFunctionById = (id: string): ProcessorFunction | undefined => {
    return PROCESSOR_FUNCTIONS.find(func => func.id === id);
};

export const getDefaultFunction = (category: ProcessorCategory): string => {
    return getFunctionsByCategory(category)[0]?.id || '';
}
