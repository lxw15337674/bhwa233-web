import { useSetState, useMemoizedFn } from 'ahooks';
import { isValidAudioFile, getMediaType, SUPPORTED_AUDIO_FORMATS } from '@/utils/audioConverter';

export const useAudioFileSelection = () => {
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
            const file = files[0];
            const mediaType = getMediaType(file.name);

            if (mediaType === 'video') {
                alert('检测到视频文件，请前往视频音频提取页面处理此文件。');
                return;
            }

            if (!isValidAudioFile(file.name)) {
                alert(`不支持的音频格式。支持的格式: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`);
                return;
            }

            selectFile(file);
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
