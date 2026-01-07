import { AudioConvertControlPanel } from '@/components/media-processor/control-panels/AudioConvertControlPanel';
import { AudioSpeedControlPanel } from '@/components/media-processor/control-panels/AudioSpeedControlPanel';
import { AudioExtractControlPanel } from '@/components/media-processor/control-panels/AudioExtractControlPanel';
// import { SpeechToTextControlPanel } from '@/components/media-processor/control-panels/SpeechToTextControlPanel';
import { BatchControlPanel } from '@/components/media-processor/batch/BatchControlPanel';
import { VideoToGifControlPanel } from '@/components/media-processor/control-panels/VideoToGifControlPanel';
import { ProcessorFunction, ProcessorCategory } from '@/types/media-processor';

// 文件验证器
const audioFileValidator = (file: File): boolean => {
    const supportedFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '');
};

const imageFileValidator = (file: File): boolean => {
    const supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'svg', 'ico'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '') || file.type.startsWith('image/');
};

const videoFileValidator = (file: File): boolean => {
    const supportedFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '') || file.type.startsWith('video/');
};


const PROCESSOR_FUNCTIONS: ProcessorFunction[] = [
    // 音频功能
    {
        id: 'audio-convert',
        path: 'convert',
        label: '音频格式转换',
        labelKey: 'mediaProcessor.functions.audioConvert.label',
        category: 'audio',
        description: '将音频文件转换为不同的格式和质量。',
        descriptionKey: 'mediaProcessor.functions.audioConvert.description',
        icon: '🎵',
        component: AudioConvertControlPanel,
        fileValidator: audioFileValidator,
        supportedFormats: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'aiff'],
    },
    {
        id: 'audio-speed-change',
        path: 'speed',
        label: '音频倍速调整',
        labelKey: 'mediaProcessor.functions.audioSpeedChange.label',
        category: 'audio',
        description: '调整音频的播放速度，同时保持音调不变。',
        descriptionKey: 'mediaProcessor.functions.audioSpeedChange.description',
        icon: '⏩',
        component: AudioSpeedControlPanel,
        fileValidator: audioFileValidator,
        supportedFormats: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'aiff'],
    },
    // {
    //     id: 'speech-to-text',
    //     path: 'speech-text',
    //     label: '语音转文字',
    //     labelKey: 'mediaProcessor.functions.speechToText.label',
    //     category: 'audio',
    //     description: '将音频文件转换为文字，支持自动语言检测。',
    //     descriptionKey: 'mediaProcessor.functions.speechToText.description',
    //     icon: '🎤',
    //     component: SpeechToTextControlPanel,
    //     fileValidator: audioFileValidator,
    //     supportedFormats: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'],
    // },
    // 视频功能
    {
        id: 'audio-extract',
        path: 'extract',
        label: '音频提取',
        labelKey: 'mediaProcessor.functions.audioExtract.label',
        category: 'video',
        description: '从视频文件中快速提取音频轨道。',
        descriptionKey: 'mediaProcessor.functions.audioExtract.description',
        icon: '🎬',
        component: AudioExtractControlPanel,
        fileValidator: videoFileValidator,
        supportedFormats: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv'],
    },
    {
        id: 'video-gif',
        path: 'gif',
        label: '视频转 GIF',
        labelKey: 'mediaProcessor.functions.videoGif.label',
        category: 'video',
        description: '将视频片段转换为高质量的 GIF 动图。',
        descriptionKey: 'mediaProcessor.functions.videoGif.description',
        icon: '🎞️',
        component: VideoToGifControlPanel,
        fileValidator: videoFileValidator,
        supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    },
    // 批量处理
    {
        id: 'image-batch',
        path: 'image',
        label: '批量图片处理',
        labelKey: 'mediaProcessor.functions.imageBatch.label',
        category: 'batch',
        description: '批量转换格式、压缩、调整尺寸。',
        descriptionKey: 'mediaProcessor.functions.imageBatch.description',
        icon: '📚',
        component: BatchControlPanel as any, // Cast to any to avoid strict prop type mismatch with ControlPanelProps
        fileValidator: imageFileValidator,
        supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'svg', 'ico'],
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
