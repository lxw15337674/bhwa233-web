import { useRequest, useMemoizedFn } from 'ahooks';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import {
    analyzeMediaFile,
} from '@/utils/audioConverter';

// 统一媒体分析 Hook（优化版本 - 快速分析 + 超时处理）
export const useUnifiedMediaAnalysis = (ffmpeg: FFmpeg | undefined | null) => {
    const {
        data: analysisResult,
        loading: isAnalyzing,
        error: analyzeError,
        run: runAnalysis
    } = useRequest(
        async (file: File) => {
            if (!ffmpeg) {
                throw new Error('FFmpeg not loaded');
            }

            console.log(`开始快速分析文件: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            const startTime = Date.now();

            try {
                const result = await analyzeMediaFile(file, ffmpeg);
                const duration = Date.now() - startTime;
                console.log(`文件分析完成，耗时: ${duration}ms`);
                return result;
            } catch (error: any) {
                const duration = Date.now() - startTime;
                console.error(`文件分析失败，耗时: ${duration}ms`, error);

                // 提供更友好的错误信息
                if (error.message?.includes('timeout')) {
                    throw new Error('文件分析超时，请尝试选择较小的文件或重试');
                } else if (error.message?.includes('not loaded')) {
                    throw new Error('FFmpeg 未加载完成，请等待加载完成后重试');
                } else {
                    throw new Error(`文件分析失败: ${error.message || '未知错误'}`);
                }
            }
        },
        {
            manual: true,
            refreshDeps: [ffmpeg],
            onError: (error) => {
                console.error('Media analysis failed:', error);
            },
            onSuccess: (result) => {
                if (result?.audioInfo) {
                    console.log('音频信息:', result.audioInfo);
                }
                if (result?.metadata) {
                    console.log('媒体元数据:', result.metadata);
                }
            }
        }
    );

    const analyzeMedia = useMemoizedFn((file: File) => {
        if (!ffmpeg) {
            console.log('FFmpeg not loaded, skipping media analysis');
            return;
        }

        // 文件大小检查（可选的预防措施）
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > 500) { // 500MB 以上的文件给出提示
            console.warn(`文件较大 (${fileSizeMB.toFixed(2)}MB)，分析可能需要较长时间`);
        }

        runAnalysis(file);
    });

    return {
        audioInfo: analysisResult?.audioInfo || null,
        mediaMetadata: analysisResult?.metadata || null,
        isAnalyzing,
        analyzeError: analyzeError?.message || null,
        analyzeMedia,
        clearAnalysis: () => {
            // Placeholder for future implementation
        }
    };
};
