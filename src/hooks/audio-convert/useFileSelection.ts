import { useMemoizedFn, useSetState } from 'ahooks';
import React from 'react';

// 文件选择 Hook
export const useFileSelection = () => {
    const [selectedFile, setSelectedFile] = useSetState<{ file: File | null }>({
        file: null
    });

    const [fileState, setFileState] = useSetState({
        dragOver: false
    });

    const selectFile = useMemoizedFn((file: File) => {
        setSelectedFile({ file });
    });

    const clearFile = useMemoizedFn(() => {
        setSelectedFile({ file: null });
    });

    const handleDragEnter = useMemoizedFn(() => {
        setFileState({ dragOver: true });
    });

    const handleDragLeave = useMemoizedFn(() => {
        setFileState({ dragOver: false });
    });

    const handleDrop = useMemoizedFn((e: React.DragEvent) => {
        e.preventDefault();
        setFileState({ dragOver: false });

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            selectFile(files[0]);
        }
    });

    return {
        selectedFile: selectedFile.file,
        dragOver: fileState.dragOver,
        selectFile,
        clearFile,
        handleDragEnter,
        handleDragLeave,
        handleDrop
    };
};
