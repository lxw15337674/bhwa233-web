'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ImageUploadArea } from '@/components/media-processor/ImageUploadArea';
import { PageHeader } from '@/components/media-processor/PageHeader';
import { useTranslation } from '@/components/TranslationProvider';

// 动态导入 FilerobotImageEditor（仅客户端）
const FilerobotImageEditor = dynamic(
    () => import('react-filerobot-image-editor').then((mod) => mod.default),
    { ssr: false, loading: () => <div className="h-[70vh] flex items-center justify-center">加载编辑器中...</div> }
);

// 深色主题配置
const darkTheme = {
    palette: {
        'txt-primary': '#fafafa',
        'txt-secondary': '#a3a3a3',
        'txt-secondary-invert': '#262626',
        'txt-placeholder': '#525252',
        'txt-warning': '#f59e0b',
        'txt-error': '#ef4444',
        'txt-info': '#3b82f6',
        'accent-primary': '#3b82f6',
        'accent-primary-hover': '#2563eb',
        'accent-primary-active': '#1d4ed8',
        'accent-primary-disabled': '#1e3a5f',
        'accent-secondary-disabled': '#1e293b',
        'accent-stateless': '#3b82f6',
        'bg-grey': '#171717',
        'bg-stateless': '#141414',
        'bg-active': '#262626',
        'bg-primary': '#141414',
        'bg-primary-light': '#1a1a1a',
        'bg-primary-hover': '#1e1e1e',
        'bg-primary-active': '#262626',
        'bg-primary-stateless': '#0a0a0a',
        'bg-secondary': '#0a0a0a',
        'bg-hover': '#1e1e1e',
        'bg-tooltip': '#27272a',
        'icon-primary': '#fafafa',
        'icons-secondary': '#a3a3a3',
        'icons-placeholder': '#404040',
        'icons-invert': '#171717',
        'icons-muted': '#525252',
        'icons-primary-hover': '#ffffff',
        'icons-secondary-hover': '#d4d4d4',
        'btn-primary-text': '#ffffff',
        'btn-disabled-text': '#525252',
        'btn-secondary-text': '#fafafa',
        'link-primary': '#60a5fa',
        'link-stateless': '#a3a3a3',
        'link-hover': '#93c5fd',
        'link-active': '#3b82f6',
        'link-muted': '#525252',
        'link-pressed': '#3b82f6',
        'borders-primary': '#404040',
        'borders-primary-hover': '#525252',
        'borders-secondary': '#262626',
        'borders-strong': '#525252',
        'borders-invert': '#d4d4d4',
        'border-active-bottom': '#3b82f6',
        'borders-disabled': '#27272a',
        'borders-button': '#404040',
        'borders-item': '#303030',
        'active-secondary': '#262626',
        'error': '#ef4444',
        'error-hover': '#dc2626',
        'error-active': '#b91c1c',
        'success': '#22c55e',
        'success-hover': '#16a34a',
        'warning': '#f59e0b',
        'warning-hover': '#d97706',
        'info': '#3b82f6',
        'light-shadow': 'rgba(0, 0, 0, 0.4)',
        'medium-shadow': 'rgba(0, 0, 0, 0.5)',
    },
    typography: {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
};

// 中文翻译
const translations = {
    name: '名称',
    save: '保存',
    saveAs: '另存为',
    back: '返回',
    loading: '加载中...',
    resetOperations: '重置/删除所有操作',
    changesLoseConfirmation: '所有更改将丢失',
    changesLoseConfirmationHint: '确定要继续吗？',
    cancel: '取消',
    continue: '继续',
    undoTitle: '撤销上一步操作',
    redoTitle: '重做上一步操作',
    showImageTitle: '显示原图',
    zoomInTitle: '放大',
    zoomOutTitle: '缩小',
    toggleZoomMenuTitle: '切换缩放菜单',
    adjustTab: '调整',
    finetuneTab: '微调',
    filtersTab: '滤镜',
    watermarkTab: '水印',
    annotateTab: '标注',
    resize: '调整大小',
    resizeTab: '调整大小',
    imageName: '图片名称',
    invalidImageError: '提供的图片无效',
    uploadImageError: '上传图片时出错',
    areNotImages: '不是图片',
    isNotImage: '不是图片',
    toBeUploaded: '待上传',
    cropTool: '裁剪',
    original: '原始',
    custom: '自定义',
    square: '正方形',
    landscape: '横向',
    portrait: '纵向',
    ellipse: '椭圆',
    classicTv: '经典电视',
    cinemascope: '宽银幕',
    arrowTool: '箭头',
    blurTool: '模糊',
    brightnessTool: '亮度',
    contrastTool: '对比度',
    ellipseTool: '椭圆',
    unFlipX: '取消水平翻转',
    flipX: '水平翻转',
    unFlipY: '取消垂直翻转',
    flipY: '垂直翻转',
    hsvTool: '色相/饱和度/明度',
    hue: '色相',
    saturation: '饱和度',
    value: '明度',
    imageTool: '图片',
    importing: '导入中...',
    addImage: '+ 添加图片',
    uploadImage: '上传图片',
    fromGallery: '从图库',
    lineTool: '线条',
    penTool: '画笔',
    polygonTool: '多边形',
    sides: '边数',
    rectTool: '矩形',
    rotateTool: '旋转',
    sliderLabel: '滑块',
    textTool: '文字',
    textSpacings: '文字间距',
    textAlignment: '文字对齐',
    fontFamily: '字体',
    size: '大小',
    letterSpacing: '字符间距',
    lineHeight: '行高',
    warmthTool: '色温',
    addWatermark: '+ 添加水印',
    addWatermarkTitle: '选择水印类型',
    uploadWatermark: '上传水印',
    addWatermarkAsText: '添加文字',
    padding: '内边距',
    shadow: '阴影',
    horizontal: '水平',
    vertical: '垂直',
    blur: '模糊',
    opacity: '不透明度',
    position: '位置',
    stroke: '描边',
    saveAsModalLabel: '将图片另存为',
    extension: '格式',
    actualSize: '实际大小（100%）',
    fitSize: '适应大小',
    quality: '质量',
    width: '宽度',
    height: '高度',
    plus: '+',
    cropSizeLowerThanResizedWarning: '注意：所选裁剪区域小于应用的调整大小，可能导致质量下降',
    actualSizeWarning: '注意：您可能对保存图片的输出质量产生不利影响',
    discardWarning: '放弃更改？',
    discardWarningHint: '您确定要放弃所有未保存的更改吗？',
    resetWarning: '重置更改？',
    resetWarningHint: '您确定要重置所有更改吗？',
    mutuallyExclusive: '互斥',
    noCrop: '无裁剪',
    brightness: '亮度',
    contrast: '对比度',
    warmth: '色温',
    HSV: '色相/饱和度/明度',
};

const ImageEditorPage: React.FC = () => {
    const { t, locale } = useTranslation();
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // 仅中文使用翻译,英文使用编辑器默认
    const editorTranslations = locale.startsWith('zh') ? translations : undefined;

    // 处理文件选择
    const handleFileSelect = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            return;
        }
        const url = URL.createObjectURL(file);
        setImageUrl(url);
    }, []);

    // 处理保存
    const handleSave = useCallback((editedImageObject: any) => {
        const { imageBase64, fullName } = editedImageObject;

        // 下载图片
        const link = document.createElement('a');
        link.href = imageBase64;
        link.download = fullName || 'edited-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    // 处理关闭（重新上传）
    const handleClose = useCallback(() => {
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
        setImageUrl(null);
    }, [imageUrl]);

    // 未上传图片时显示上传区域
    if (!imageUrl) {
        return (
            <div className="container mx-auto px-4 py-8">
                <PageHeader
                    title={t('imageEditor.title')}
                    description={t('imageEditor.description')}
                    gradient="from-purple-400 to-pink-400"
                />
                <ImageUploadArea
                    onFileSelect={handleFileSelect}
                    showPreview={false}
                />
            </div>
        );
    }

    // 已上传图片时显示编辑器
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="rounded-lg overflow-hidden border bg-neutral-900">
                <div className="h-[80vh] filerobot-editor-root">
                <FilerobotImageEditor
                    source={imageUrl}
                    onSave={handleSave}
                    onClose={handleClose}
                    theme={darkTheme}
                    translations={editorTranslations}
                    annotationsCommon={{
                        fill: '#ff0000',
                        stroke: '#ff0000',
                        strokeWidth: 2,
                    }}
                    Text={{
                        text: '请输入文字...',
                        fonts: [
                            { label: '系统默认', value: 'system-ui, sans-serif' },
                            { label: 'Arial', value: 'Arial' },
                            { label: '黑体', value: 'SimHei, sans-serif' },
                            { label: '宋体', value: 'SimSun, serif' },
                            { label: '微软雅黑', value: 'Microsoft YaHei, sans-serif' },
                        ],
                        fontSize: 24,
                    }}
                    Rotate={{
                        angle: 90,
                        componentType: 'slider',
                    }}
                    Crop={{
                        presetsItems: [
                            {
                                titleKey: 'classicTv',
                                descriptionKey: '4:3',
                                ratio: 4 / 3,
                            },
                            {
                                titleKey: 'cinemascope',
                                descriptionKey: '21:9',
                                ratio: 21 / 9,
                            },
                        ],
                        presetsFolders: [
                            {
                                titleKey: '社交媒体',
                                groups: [
                                    {
                                        titleKey: '微信',
                                        items: [
                                            {
                                                titleKey: '头像',
                                                width: 640,
                                                height: 640,
                                                descriptionKey: '640×640',
                                            },
                                            {
                                                titleKey: '朋友圈',
                                                width: 1080,
                                                height: 1080,
                                                descriptionKey: '1080×1080',
                                            },
                                        ],
                                    },
                                    {
                                        titleKey: '抖音/小红书',
                                        items: [
                                            {
                                                titleKey: '封面',
                                                width: 1080,
                                                height: 1440,
                                                descriptionKey: '3:4',
                                            },
                                            {
                                                titleKey: '横版',
                                                width: 1920,
                                                height: 1080,
                                                descriptionKey: '16:9',
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    }}
                    savingPixelRatio={4}
                    previewPixelRatio={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
                    defaultSavedImageName="edited-image"
                    defaultSavedImageType="png"
                    defaultSavedImageQuality={0.92}
                    useBackendTranslations={false}
                    showBackButton
                />
            </div>
        </div>
        </div>
    );
};

export default ImageEditorPage;
