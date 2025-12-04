/**
 * 撤销/重做 Hook - 基于蒙版快照
 */
import { useCallback, useRef, useState } from 'react';
import type { Canvas } from 'fabric';

interface ClipSnapshot {
    pixel: number;
    blur: number;
}

interface HistoryHookProps {
    canvas: Canvas | null;
    getClipSnapshot: () => ClipSnapshot;
    restoreClipSnapshot: (snapshot: ClipSnapshot) => void;
}

export function useHistory({
    canvas,
    getClipSnapshot,
    restoreClipSnapshot,
}: HistoryHookProps) {
    const historyRef = useRef<ClipSnapshot[]>([]);
    const currentIndexRef = useRef(-1);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const updateState = useCallback(() => {
        setCanUndo(currentIndexRef.current > 0);
        setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
    }, []);

    const saveState = useCallback(() => {
        if (!canvas) return;

        const snapshot = getClipSnapshot();

        // 删除当前位置之后的历史
        historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);

        // 添加新快照
        historyRef.current.push(snapshot);
        currentIndexRef.current = historyRef.current.length - 1;

        // 限制历史记录数量
        const maxHistory = 50;
        if (historyRef.current.length > maxHistory) {
            historyRef.current = historyRef.current.slice(-maxHistory);
            currentIndexRef.current = historyRef.current.length - 1;
        }

        updateState();
    }, [canvas, getClipSnapshot, updateState]);

    const undo = useCallback(() => {
        if (currentIndexRef.current <= 0) return;

        currentIndexRef.current--;
        const snapshot = historyRef.current[currentIndexRef.current];
        restoreClipSnapshot(snapshot);
        updateState();
    }, [restoreClipSnapshot, updateState]);

    const redo = useCallback(() => {
        if (currentIndexRef.current >= historyRef.current.length - 1) return;

        currentIndexRef.current++;
        const snapshot = historyRef.current[currentIndexRef.current];
        restoreClipSnapshot(snapshot);
        updateState();
    }, [restoreClipSnapshot, updateState]);

    const resetHistory = useCallback(() => {
        historyRef.current = [];
        currentIndexRef.current = -1;
        updateState();
    }, [updateState]);

    const initHistory = useCallback(() => {
        // 保存初始状态
        const snapshot = getClipSnapshot();
        historyRef.current = [snapshot];
        currentIndexRef.current = 0;
        updateState();
    }, [getClipSnapshot, updateState]);

    return {
        canUndo,
        canRedo,
        saveState,
        undo,
        redo,
        initHistory,
        resetHistory,
    };
}
