/**
 * 图片编辑器类型定义
 */

export interface ImageCanvasEditorProps {
    imageUrl: string;
    onSave: (file: File) => void;
    onClose: () => void;
}
