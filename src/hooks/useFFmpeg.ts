import { useRequest } from "ahooks";
import { useRef, useEffect, useState } from "react";
import { ffmpegManager } from "../lib/ffmpeg-instance";

// FFmpeg 管理 Hook
export const useFFmpegManager = () => {
    const mountedRef = useRef(false);
    const [checkedSingleton, setCheckedSingleton] = useState(false);

    const {
        data: ffmpegData,
        loading: ffmpegLoading,
        error: ffmpegError,
        run: initFFmpeg
    } = useRequest(
        async () => {
            // 直接从单例管理器获取实例
            const result = await ffmpegManager.getInstance();
            return result;
        },
        {
            manual: true,
            // 移除 cacheKey 和 staleTime，让单例自己管理缓存
            onError: (error) => {
                console.error('[useFFmpegManager] ❌ 加载失败:', error);
            },
            onSuccess: (result) => {
                if (result) {
                    console.log('[useFFmpegManager] ✅ 加载成功');
                }
            }
        }
    );

    // 使用 useEffect 管理组件挂载状态和 FFmpeg 初始化
    useEffect(() => {
        console.log('[useFFmpegManager] 组件挂载');

        // 标记组件已挂载
        mountedRef.current = true;

        // 首先检查单例是否已经加载完成
        const checkAndInitFFmpeg = async () => {
            try {
                // 尝试从单例获取实例（如果已加载，会立即返回）
                const instance = await ffmpegManager.getInstance();

                if (instance && mountedRef.current) {
                    console.log('[useFFmpegManager] ✅ 单例已加载，触发状态同步');
                    // 如果单例已经加载，手动触发 useRequest 同步状态
                    initFFmpeg();
                }
                setCheckedSingleton(true);
            } catch (error) {
                console.error('[useFFmpegManager] ❌ 单例加载失败:', error);
                setCheckedSingleton(true);
                // 即使检查失败，也尝试加载
                if (mountedRef.current && !ffmpegData && !ffmpegLoading) {
                    initFFmpeg();
                }
            }
        };

        checkAndInitFFmpeg();

        // 清理函数：标记组件已卸载
        return () => {
            mountedRef.current = false;
        };
    }, []); // 空依赖数组确保只在首次挂载时执行

    const currentFFmpegLoaded = !!ffmpegData;
    const currentFFmpeg = ffmpegData?.ffmpeg;

    return {
        ffmpeg: currentFFmpeg,
        isMultiThread: ffmpegData?.isMultiThread || false,
        ffmpegLoaded: currentFFmpegLoaded,
        ffmpegLoading,
        ffmpegError,
        initFFmpeg: () => {
            if (mountedRef.current) {
                console.log('[useFFmpegManager] 手动触发加载');
                initFFmpeg();
            }
        }
    };
};