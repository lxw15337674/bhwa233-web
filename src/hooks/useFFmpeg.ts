import { useEffect } from "react";
import { useFFmpegStore } from "../stores/ffmpeg-store";

// FFmpeg 管理 Hook
export const useFFmpegManager = () => {
    const { 
        ffmpeg,
        isLoaded,
        isLoading,
        error,
        isMultiThread,
        loadFFmpeg
    } = useFFmpegStore();

    useEffect(() => {
        // 在组件挂载时尝试加载 FFmpeg
        if (!isLoaded && !isLoading) {
            console.log('[useFFmpegManager] 组件挂载，尝试加载 FFmpeg');
            loadFFmpeg();
        }
    }, [isLoaded, isLoading, loadFFmpeg]); // 依赖项确保只在必要时触发

    return {
        ffmpeg,
        ffmpegLoaded: isLoaded,
        ffmpegLoading: isLoading,
        ffmpegError: error,
        isMultiThread,
        initFFmpeg: loadFFmpeg // 提供一个手动触发加载的方法，如果需要
    };
};