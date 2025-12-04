/**
 * 图片编辑器组件 - 使用 filerobot-image-editor
 */
'use client';

import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ImageCanvasEditorProps } from './types';

// 动态导入 FilerobotImageEditor（仅客户端）
const FilerobotImageEditor = dynamic(
    () => import('react-filerobot-image-editor').then((mod) => mod.default),
    { ssr: false }
);

// 深色主题配置 - 完整的 @scaleflex/ui 调色板覆盖
const darkTheme = {
    palette: {
        // === 文字颜色 ===
        'txt-primary': '#fafafa',                    // 主文字（白色）
        'txt-secondary': '#a3a3a3',                  // 次级文字（灰色）
        'txt-secondary-invert': '#262626',           // 反转次级文字
        'txt-placeholder': '#525252',                // 占位文字
        'txt-warning': '#f59e0b',                    // 警告文字
        'txt-error': '#ef4444',                      // 错误文字
        'txt-info': '#3b82f6',                       // 信息文字

        // === 强调色/主题色 ===
        'accent-primary': '#3b82f6',                 // 主强调色（蓝色）
        'accent-primary-hover': '#2563eb',           // 悬停
        'accent-primary-active': '#1d4ed8',          // 激活
        'accent-primary-disabled': '#1e3a5f',        // 禁用
        'accent-secondary-disabled': '#1e293b',
        'accent-stateless': '#3b82f6',
        'accent-stateless_0_4_opacity': 'rgba(59, 130, 246, 0.4)',
        'accent_0_5_5_opacity': 'rgba(59, 130, 246, 0.55)',
        'accent_0_5_opacity': 'rgba(59, 130, 246, 0.05)',
        'accent_0_7_opacity': 'rgba(59, 130, 246, 0.7)',
        'accent_1_2_opacity': 'rgba(59, 130, 246, 0.12)',
        'accent_1_8_opacity': 'rgba(59, 130, 246, 0.18)',
        'accent_2_8_opacity': 'rgba(59, 130, 246, 0.28)',
        'accent_4_0_opacity': 'rgba(59, 130, 246, 0.4)',

        // === 背景颜色 ===
        'bg-grey': '#171717',
        'bg-stateless': '#141414',                   // 无状态背景
        'bg-active': '#262626',                      // 激活背景
        'bg-base-light': '#1e293b',
        'bg-base-medium': '#1e3a5f',
        'bg-primary': '#141414',                     // 主背景（侧边栏）
        'bg-primary-light': '#1a1a1a',
        'bg-primary-hover': '#1e1e1e',               // 悬停背景
        'bg-primary-active': '#262626',              // 激活背景
        'bg-primary-stateless': '#0a0a0a',
        'bg-primary-0-5-opacity': 'rgba(20, 20, 20, 0.5)',
        'bg-secondary': '#0a0a0a',                   // 次级背景（画布）
        'bg-hover': '#1e1e1e',
        'bg-green': '#052e16',
        'bg-green-medium': '#065f46',
        'bg-blue': '#172554',
        'bg-red': '#450a0a',
        'bg-red-light': '#7f1d1d',
        'background-red-medium': '#991b1b',
        'bg-orange': '#431407',
        'bg-tooltip': '#27272a',

        // === 图标颜色 ===
        'icon-primary': '#fafafa',                   // 主图标
        'icons-primary-opacity-0-6': 'rgba(250, 250, 250, 0.6)',
        'icons-secondary': '#a3a3a3',                // 次级图标
        'icons-placeholder': '#404040',              // 占位图标
        'icons-invert': '#171717',                   // 反转图标
        'icons-muted': '#525252',                    // 静音图标
        'icons-primary-hover': '#ffffff',            // 悬停图标
        'icons-secondary-hover': '#d4d4d4',

        // === 按钮颜色 ===
        'btn-primary-text': '#ffffff',               // 主按钮文字
        'btn-primary-text-0-6': 'rgba(255, 255, 255, 0.6)',
        'btn-primary-text-0-4': 'rgba(255, 255, 255, 0.4)',
        'btn-disabled-text': '#525252',              // 禁用按钮文字
        'btn-secondary-text': '#fafafa',             // 次级按钮文字

        // === 链接颜色 ===
        'link-primary': '#60a5fa',
        'link-stateless': '#a3a3a3',
        'link-hover': '#93c5fd',
        'link-active': '#3b82f6',
        'link-muted': '#525252',
        'link-pressed': '#3b82f6',

        // === 边框颜色 ===
        'borders-primary': '#404040',                // 主边框
        'borders-primary-hover': '#525252',
        'borders-secondary': '#262626',              // 次级边框
        'borders-strong': '#525252',                 // 强边框
        'borders-invert': '#d4d4d4',
        'border-hover-bottom': 'rgba(59, 130, 246, 0.18)',
        'border-active-bottom': '#3b82f6',
        'border-primary-stateless': '#404040',
        'borders-disabled': '#27272a',
        'borders-button': '#404040',
        'borders-item': '#303030',
        'borders-base-light': '#1e3a5f',
        'borders-base-medium': '#1e40af',
        'borders-green': 'rgba(34, 197, 94, 0.22)',
        'borders-green-medium': 'rgba(34, 197, 94, 0.4)',
        'borders-red': 'rgba(239, 68, 68, 0.4)',

        // === 激活状态 ===
        'active-secondary': '#262626',
        'active-secondary-hover': 'rgba(59, 130, 246, 0.05)',

        // === 状态颜色 ===
        'error': '#ef4444',
        'error-0-28-opacity': 'rgba(239, 68, 68, 0.28)',
        'error-0-12-opacity': 'rgba(239, 68, 68, 0.12)',
        'error-hover': '#dc2626',
        'error-active': '#b91c1c',
        'success': '#22c55e',
        'success-hover': '#16a34a',
        'success-Active': '#15803d',
        'warning': '#f59e0b',
        'warning-hover': '#d97706',
        'warning-active': '#b45309',
        'info': '#3b82f6',
        'modified': '#a78bfa',

        // === 阴影 ===
        'light-shadow': 'rgba(0, 0, 0, 0.4)',
        'medium-shadow': 'rgba(0, 0, 0, 0.5)',
        'large-shadow': 'rgba(0, 0, 0, 0.6)',
        'x-large-shadow': 'rgba(0, 0, 0, 0.7)',

        // === 其他 ===
        'tag': '#525252',
        'states-error-disabled-text': 'rgba(239, 68, 68, 0.3)',
        'gradient-right': 'linear-gradient(270deg, #0a0a0a 1.56%, rgba(10, 10, 10, 0.89) 52.4%, rgba(10, 10, 10, 0.53) 76.04%, rgba(10, 10, 10, 0) 100%)',
        'extra-0-3-overlay': 'rgba(0, 0, 0, 0.3)',
        'gradient-right-active': 'linear-gradient(270deg, #141414 1.56%, #141414 52.4%, rgba(20, 20, 20, 0.53) 76.04%, rgba(20, 20, 20, 0) 100%)',
        'gradient-right-hover': 'linear-gradient(270deg, #1a1a1a 1.56%, #1a1a1a 52.4%, rgba(26, 26, 26, 0.53) 76.04%, rgba(26, 26, 26, 0) 100%)',
        'extra-0-5-overlay': 'rgba(0, 0, 0, 0.5)',
        'extra-0-7-overlay': 'rgba(0, 0, 0, 0.7)',
        'extra-0-9-overlay': 'rgba(0, 0, 0, 0.9)',
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

export const ImageCanvasEditor: React.FC<ImageCanvasEditorProps> = ({
    imageUrl,
    onSave,
    onClose,
}) => {
    // 处理保存
    const handleSave = useCallback((editedImageObject: any) => {
        // editedImageObject 包含 imageBase64, imageCanvas, fullName 等
        const { imageBase64, fullName, mimeType } = editedImageObject;

        // 将 base64 转换为 File
        fetch(imageBase64)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], fullName || 'edited-image.png', {
                    type: mimeType || 'image/png'
                });
                onSave(file);
            });
    }, [onSave]);

    // 处理关闭
    const handleClose = useCallback((closingReason: string) => {
        console.log('Editor closed, reason:', closingReason);
        onClose();
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
            <div className="w-[95vw] h-[95vh] bg-neutral-900 rounded-lg overflow-hidden filerobot-dark">
                <style jsx global>{`
                    /* === 全局深色覆盖 === */
                    .filerobot-dark,
                    .filerobot-dark * {
                        --sfx-bg-primary: #141414;
                        --sfx-bg-secondary: #0a0a0a;
                    }

                    /* === 主容器和应用包装 === */
                    .filerobot-dark [class*="SfxModal"],
                    .filerobot-dark [class*="StyledAppWrapper"],
                    .filerobot-dark [class*="AppContainer"],
                    .filerobot-dark > div > div {
                        background-color: #141414 !important;
                        background: #141414 !important;
                    }

                    /* === 标签栏和工具栏 === */
                    .filerobot-dark [class*="StyledTabs"],
                    .filerobot-dark [class*="StyledToolsBar"],
                    .filerobot-dark [class*="TabsBar"],
                    .filerobot-dark [class*="ToolsBar"],
                    .filerobot-dark [class*="Topbar"],
                    .filerobot-dark [class*="Footer"],
                    .filerobot-dark [class*="Header"],
                    .filerobot-dark header,
                    .filerobot-dark footer {
                        background-color: #141414 !important;
                        background: #141414 !important;
                        border-color: #262626 !important;
                    }

                    /* === 画布区域 === */
                    .filerobot-dark [class*="StyledMainCanvas"],
                    .filerobot-dark [class*="StyledCanvasNode"],
                    .filerobot-dark [class*="CanvasNode"],
                    .filerobot-dark [class*="CanvasContainer"],
                    .filerobot-dark [class*="MainArea"] {
                        background-color: #0a0a0a !important;
                        background: #0a0a0a !important;
                    }

                    /* === 侧边栏和面板 === */
                    .filerobot-dark [class*="Sidebar"],
                    .filerobot-dark [class*="Panel"],
                    .filerobot-dark [class*="ToolsWrapper"],
                    .filerobot-dark [class*="Carousel"],
                    .filerobot-dark [class*="FitItems"],
                    .filerobot-dark [class*="ItemsList"],
                    .filerobot-dark [class*="Menu"],
                    .filerobot-dark [class*="Dropdown"],
                    .filerobot-dark [class*="Popover"] {
                        background-color: #141414 !important;
                        background: #141414 !important;
                        border-color: #262626 !important;
                    }

                    /* === 滤镜和效果项 === */
                    .filerobot-dark [class*="FilterItem"],
                    .filerobot-dark [class*="EffectItem"],
                    .filerobot-dark [class*="PresetItem"],
                    .filerobot-dark [class*="OptionItem"] {
                        background-color: #1a1a1a !important;
                        border-color: #303030 !important;
                    }

                    .filerobot-dark [class*="FilterItem"]:hover,
                    .filerobot-dark [class*="EffectItem"]:hover,
                    .filerobot-dark [class*="PresetItem"]:hover {
                        background-color: #262626 !important;
                    }

                    /* === 文字和标签 === */
                    .filerobot-dark [class*="Label"],
                    .filerobot-dark [class*="Text"],
                    .filerobot-dark [class*="Title"],
                    .filerobot-dark span:not([class*="Icon"]),
                    .filerobot-dark label,
                    .filerobot-dark p {
                        color: #fafafa !important;
                    }

                    .filerobot-dark [class*="Secondary"],
                    .filerobot-dark [class*="Hint"],
                    .filerobot-dark [class*="Description"] {
                        color: #a3a3a3 !important;
                    }

                    /* === 按钮样式 === */
                    .filerobot-dark [class*="StyledButton"]:not([class*="primary"]):not([class*="Primary"]) {
                        background-color: #262626 !important;
                        color: #fafafa !important;
                        border-color: #404040 !important;
                    }

                    .filerobot-dark [class*="StyledButton"][class*="primary"],
                    .filerobot-dark [class*="StyledButton"][class*="Primary"],
                    .filerobot-dark button[class*="primary"],
                    .filerobot-dark button[class*="Primary"] {
                        background-color: #3b82f6 !important;
                        color: #ffffff !important;
                    }

                    .filerobot-dark [class*="StyledButton"]:hover {
                        background-color: #303030 !important;
                    }

                    /* === 图标 === */
                    .filerobot-dark [class*="StyledIconWrapper"] svg,
                    .filerobot-dark [class*="Icon"] svg,
                    .filerobot-dark svg {
                        fill: currentColor !important;
                        color: #fafafa !important;
                    }

                    /* === 菜单和标签项 === */
                    .filerobot-dark [class*="StyledMenuItem"],
                    .filerobot-dark [class*="MenuItem"],
                    .filerobot-dark [class*="TabItem"],
                    .filerobot-dark [class*="Tab-"] {
                        background-color: transparent !important;
                        color: #a3a3a3 !important;
                    }

                    .filerobot-dark [class*="StyledMenuItem"]:hover,
                    .filerobot-dark [class*="MenuItem"]:hover,
                    .filerobot-dark [class*="TabItem"]:hover,
                    .filerobot-dark [class*="Tab-"]:hover {
                        background-color: #262626 !important;
                        color: #fafafa !important;
                    }

                    .filerobot-dark [class*="active"],
                    .filerobot-dark [class*="Active"],
                    .filerobot-dark [class*="selected"],
                    .filerobot-dark [class*="Selected"] {
                        background-color: #262626 !important;
                        color: #fafafa !important;
                    }

                    /* === 表单元素 === */
                    .filerobot-dark input,
                    .filerobot-dark select,
                    .filerobot-dark textarea {
                        background-color: #1a1a1a !important;
                        color: #fafafa !important;
                        border-color: #404040 !important;
                    }

                    .filerobot-dark input:focus,
                    .filerobot-dark select:focus,
                    .filerobot-dark textarea:focus {
                        border-color: #3b82f6 !important;
                        outline: none !important;
                    }

                    .filerobot-dark input::placeholder {
                        color: #525252 !important;
                    }

                    /* === 滑块 === */
                    .filerobot-dark [class*="Slider"],
                    .filerobot-dark [class*="Range"] {
                        background-color: #404040 !important;
                    }

                    .filerobot-dark [class*="SliderTrack"],
                    .filerobot-dark [class*="RangeTrack"] {
                        background-color: #3b82f6 !important;
                    }

                    .filerobot-dark [class*="SliderThumb"],
                    .filerobot-dark [class*="RangeThumb"] {
                        background-color: #ffffff !important;
                        border-color: #3b82f6 !important;
                    }

                    /* === 滚动条 === */
                    .filerobot-dark ::-webkit-scrollbar {
                        width: 8px;
                        height: 8px;
                    }

                    .filerobot-dark ::-webkit-scrollbar-track {
                        background: #141414;
                    }

                    .filerobot-dark ::-webkit-scrollbar-thumb {
                        background: #404040;
                        border-radius: 4px;
                    }

                    .filerobot-dark ::-webkit-scrollbar-thumb:hover {
                        background: #525252;
                    }

                    /* === 分隔线 === */
                    .filerobot-dark [class*="Divider"],
                    .filerobot-dark hr {
                        background-color: #262626 !important;
                        border-color: #262626 !important;
                    }

                    /* === 工具提示 === */
                    .filerobot-dark [class*="Tooltip"] {
                        background-color: #27272a !important;
                        color: #fafafa !important;
                    }
                `}</style>
                <FilerobotImageEditor
                    source={imageUrl}
                    onSave={handleSave}
                    onClose={handleClose}
                    theme={darkTheme}
                    translations={translations}
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
                    avoidChangesNotSavedAlertOnLeave
                    closeAfterSave
                    showBackButton
                />
            </div>
        </div>
    );
};

export default ImageCanvasEditor;
