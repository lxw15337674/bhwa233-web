import { AudioConvertControlPanel } from '@/components/media-processor/control-panels/AudioConvertControlPanel';
import { AudioExtractControlPanel } from '@/components/media-processor/control-panels/AudioExtractControlPanel';
import { AudioSpeedControlPanel } from '@/components/media-processor/control-panels/AudioSpeedControlPanel';
import { VideoCompressControlPanel } from '@/components/media-processor/control-panels/VideoCompressControlPanel';
import { SpeechToTextControlPanel } from '@/components/media-processor/control-panels/SpeechToTextControlPanel';
import { ProcessorFunction, ProcessorCategory } from '@/types/media-processor';
import { getMediaType } from '@/utils/audioConverter';

// 文件验证器
const audioFileValidator = (file: File): boolean => {
    const supportedFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '');
};

const videoFileValidator = (file: File): boolean => {
    const supportedFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '');
};

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
    {
        id: 'speech-to-text',
        label: '语音转文字',
        category: 'audio',
        description: '将音频文件转换为文字，支持自动语言检测。',
        icon: '🎤',
        component: SpeechToTextControlPanel,
        fileValidator: audioFileValidator,
        supportedFormats: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'],
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
    const functions = getFunctionsByCategory(category);
    return functions.length > 0 ? functions[0].id : '';
};
