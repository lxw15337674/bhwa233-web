import { FFmpeg } from '@ffmpeg/ffmpeg';
import { AudioInfo, MediaMetadata, ConversionState } from '@/utils/audioConverter';

// 媒体处理分类

export type ProcessorCategory = 'image' | 'editor' | 'batch' | 'audio';



// 处理状态接口

export interface ProcessingState {

  isProcessing: boolean;

  progress: number;

  currentStep: string;

  error: string | null;

  outputFile: Blob | null;

  outputFileName: string;

  remainingTime: string | null;

}



// 功能定义接口

export interface ProcessorFunction {

  id: string;

  label: string;

  labelKey?: string; // 翻译键

  description: string;

  descriptionKey?: string; // 翻译键

  category: ProcessorCategory;

  icon: string;

  path?: string; // 路由路径

  component: React.ComponentType<any>; // Changed to any as props are store-managed now

  fileValidator: (file: File) => boolean;

  supportedFormats: string[];

  defaultParams?: any;

}



// 媒体处理器状态 (No longer needed as useAppStore handles it)

// export interface MediaProcessorState { ... }



// URL参数接口

export interface MediaProcessorParams {

  category?: ProcessorCategory;

  function?: string;

} 