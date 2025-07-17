import { useRequest } from "ahooks";
import { useRef, useEffect } from "react";
import { ffmpegManager } from "../lib/ffmpeg-instance";

// FFmpeg 管理 Hook
export const useFFmpegManager = () => {
    const mountedRef = useRef(false);

    const {
        data: ffmpegData,
        loading: ffmpegLoading,
        error: ffmpegError,
        run: initFFmpeg
    } = useRequest(
        async () => {
            // 检查组件是否仍然挂载
            if (!mountedRef.current) {
                return null;
            }

            // 直接从单例管理器获取实例
            const result = await ffmpegManager.getInstance();
            return result;
        },
        {
            manual: true,
            cacheKey: 'ffmpeg-instance', // cacheKey 保证 useRequest 在组件重新挂载时不会重复执行
            staleTime: Infinity,
            onError: (error) => {
                // 只在组件仍然挂载时处理错误
                if (mountedRef.current) {
                    console.error('FFmpeg singleton failed to load:', error);
                }
            },
            onSuccess: (result) => {
                // 只在组件仍然挂载时处理成功结果
                if (mountedRef.current && result) {
                    console.log('FFmpeg singleton loaded successfully');
                }
            }
        }
    );

    // 使用 useEffect 管理组件挂载状态和 FFmpeg 初始化
    useEffect(() => {
        // 标记组件已挂载
        mountedRef.current = true;

        // 只在组件首次挂载且 FFmpeg 还未加载时初始化
        if (!ffmpegData && !ffmpegLoading && !ffmpegError) {
            // 使用 setTimeout 确保在下一个事件循环中执行，避免在 render 期间触发状态更新
            const timeoutId = setTimeout(() => {
                if (mountedRef.current) {
                    initFFmpeg();
                }
            }, 0);

            return () => {
                clearTimeout(timeoutId);
            };
        }

        // 清理函数：标记组件已卸载
        return () => {
            mountedRef.current = false;
        };
    }, []); // 空依赖数组确保只在首次挂载时执行

    return {
        ffmpeg: ffmpegData?.ffmpeg,
        isMultiThread: ffmpegData?.isMultiThread || false,
        ffmpegLoaded: !!ffmpegData,
        ffmpegLoading,
        ffmpegError,
        initFFmpeg: () => {
            if (mountedRef.current) {
                initFFmpeg();
            }
        }
    };
};