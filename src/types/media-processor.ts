import { FFmpeg } from '@ffmpeg/ffmpeg';
import { AudioInfo, MediaMetadata, ConversionState } from '@/utils/audioConverter';

// 媒体处理分类
export type ProcessorCategory = 'video' | 'audio' | 'text';

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

// 控制面板通用接口
export interface ControlPanelProps {
  selectedFile?: File | null;
  mediaMetadata?: MediaMetadata | null;
  audioInfo?: AudioInfo | null;
  ffmpeg?: FFmpeg | null;
  isMultiThread?: boolean;
  ffmpegLoaded?: boolean;
  isAnalyzing?: boolean;
  analyzeError?: string | null;
  onRetryAnalysis?: () => void;
  onStateChange?: (state: Partial<ProcessingState>) => void;
  onOutputReady?: (blob: Blob, filename: string) => void;
  textInput?: string;
}

// 功能定义接口
export interface ProcessorFunction {
  id: string;
  label: string;
  description: string;
  category: ProcessorCategory;
  icon: string;
  component: React.ComponentType<ControlPanelProps>;
  fileValidator: (file: File) => boolean;
  supportedFormats: string[];
  defaultParams?: any;
}

// 媒体处理器状态
export interface MediaProcessorState {
  // 当前模式
  category: ProcessorCategory;
  currentFunction: string;

  // 文件状态
  selectedFile: File | null;
  mediaMetadata: MediaMetadata | null;
  audioInfo: AudioInfo | null;

  // 处理状态（从控制面板接收）
  isProcessing: boolean;
  processingState: ProcessingState;

  // FFmpeg状态
  ffmpeg: FFmpeg | null;
  isMultiThread: boolean;
  ffmpegLoaded: boolean;
  ffmpegLoading: boolean;
  ffmpegError: Error | null;

  // 分析状态
  isAnalyzing: boolean;
  analyzeError: string | null;
}

// URL参数接口
export interface MediaProcessorParams {
  category?: ProcessorCategory;
  function?: string;
} 