import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AudioProcessorState, ProcessorStoreActions } from './types';
import { getDefaultFunction } from '@/config/processor-functions';

const initialProcessingState = {
  isProcessing: false,
  progress: 0,
  currentStep: '',
  error: null,
  outputFile: null,
  outputFileName: '',
  remainingTime: null,
};

const initialState: AudioProcessorState = {
  // 文件相关
  selectedFile: null,
  mediaMetadata: null,
  audioInfo: null,
  
  // 处理状态
  isProcessing: false,
  processingState: initialProcessingState,
  
  // FFmpeg状态
  ffmpeg: null,
  isMultiThread: false,
  ffmpegLoaded: false,
  ffmpegLoading: false,
  ffmpegError: null,
  
  // 分析状态
  isAnalyzing: false,
  analyzeError: null,
  
  // 音频功能
  currentFunction: getDefaultFunction('audio'),
};

export const useAudioProcessorStore = create<AudioProcessorState & ProcessorStoreActions>()(
  devtools(
    immer((set) => ({
      ...initialState,

      // 文件操作
      setSelectedFile: (file) => set((state) => {
        state.selectedFile = file;
      }),

      clearFile: () => set((state) => {
        state.selectedFile = null;
        state.mediaMetadata = null;
        state.audioInfo = null;
        state.processingState = initialProcessingState;
      }),

      // 处理状态操作
      setProcessingState: (updates) => set((state) => {
        state.processingState = { ...state.processingState, ...updates };
        state.isProcessing = updates.isProcessing ?? state.isProcessing;
      }),

      setIsProcessing: (isProcessing) => set((state) => {
        state.isProcessing = isProcessing;
        state.processingState.isProcessing = isProcessing;
      }),

      setProgress: (progress) => set((state) => {
        state.processingState.progress = progress;
      }),

      setError: (error) => set((state) => {
        state.processingState.error = error;
      }),

      setOutputFile: (file, filename) => set((state) => {
        state.processingState.outputFile = file;
        state.processingState.outputFileName = filename;
      }),

      // FFmpeg状态操作
      setFFmpeg: (ffmpeg) => set((state) => {
        state.ffmpeg = ffmpeg;
      }),

      setFFmpegLoaded: (loaded) => set((state) => {
        state.ffmpegLoaded = loaded;
      }),

      setFFmpegLoading: (loading) => set((state) => {
        state.ffmpegLoading = loading;
      }),

      setFFmpegError: (error) => set((state) => {
        state.ffmpegError = error;
      }),

      // 分析状态操作
      setIsAnalyzing: (analyzing) => set((state) => {
        state.isAnalyzing = analyzing;
      }),

      setAnalyzeError: (error) => set((state) => {
        state.analyzeError = error;
      }),

      setMediaMetadata: (metadata) => set((state) => {
        state.mediaMetadata = metadata;
      }),

      setAudioInfo: (info) => set((state) => {
        state.audioInfo = info;
      }),

      // 重置操作
      reset: () => set(initialState),

      resetProcessing: () => set((state) => {
        state.processingState = initialProcessingState;
        state.isProcessing = false;
      }),

      // 功能相关
      setCurrentFunction: (func) => set((state) => {
        state.currentFunction = func;
        state.processingState = initialProcessingState;
        state.isProcessing = false;
      }),
    })),
    {
      name: 'audio-processor-store',
    }
  )
);