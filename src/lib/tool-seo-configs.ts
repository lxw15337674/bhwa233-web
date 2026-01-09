/**
 * 所有工具页面的 SEO 配置
 * 集中管理便于维护和优化
 */

import { type ToolSEOConfig } from './seo';

export const TOOL_SEO_CONFIGS = {
    // 视频工具 - 音频提取
    videoExtract: {
        en: {
            title: 'Extract Audio from Video - Free Online Video to Audio Converter | Toolbox',
            description: 'Extract audio from video files online. Convert video to MP3, AAC, WAV, FLAC. Support MP4, AVI, MOV, MKV formats. Fast, free, and privacy-protected.',
            keywords: [
                'extract audio from video',
                'video to audio converter',
                'video to MP3',
                'extract sound from video',
                'video audio extractor online',
                'MP4 to MP3 converter',
                'rip audio from video',
                'video audio separator',
                'convert video to audio',
                'online audio extractor'
            ],
            features: [
                'Extract audio from any video',
                'Multiple output formats (MP3, AAC, WAV, FLAC)',
                'Support all video formats',
                'Maintain original audio quality',
                'Fast processing',
                'Privacy protected',
                'No watermarks',
                'Browser-based processing'
            ]
        },
        zh: {
            title: '视频提取音频 - 免费在线视频转音频工具 | 工具箱',
            description: '在线从视频中提取音频。支持将视频转换为 MP3、AAC、WAV、FLAC 等格式。支持 MP4、AVI、MOV、MKV 等视频格式。快速、免费、隐私保护。',
            keywords: [
                '视频提取音频',
                '视频转音频',
                '视频转MP3',
                '从视频中提取声音',
                '在线视频音频提取器',
                'MP4转MP3',
                '视频音频分离',
                '视频音频提取工具',
                '视频转换音频',
                '在线音频提取'
            ],
            features: [
                '从任何视频中提取音频',
                '多种输出格式（MP3、AAC、WAV、FLAC）',
                '支持所有视频格式',
                '保持原始音质',
                '快速处理',
                '隐私保护',
                '无水印',
                '浏览器端处理'
            ]
        },
        'zh-tw': {
            title: '影片提取音訊 - 免費線上影片轉音訊工具 | 工具箱',
            description: '線上從影片中提取音訊。支援將影片轉換為 MP3、AAC、WAV、FLAC 等格式。支援 MP4、AVI、MOV、MKV 等影片格式。快速、免費、隱私保護。',
            keywords: [
                '影片提取音訊',
                '影片轉音訊',
                '影片轉MP3',
                '從影片中提取聲音',
                '線上影片音訊提取器',
                'MP4轉MP3',
                '影片音訊分離',
                '影片音訊提取工具',
                '影片轉換音訊',
                '線上音訊提取'
            ],
            features: [
                '從任何影片中提取音訊',
                '多種輸出格式（MP3、AAC、WAV、FLAC）',
                '支援所有影片格式',
                '保持原始音質',
                '快速處理',
                '隱私保護',
                '無浮水印',
                '瀏覽器端處理'
            ]
        }
    } as ToolSEOConfig,

    // 视频转 GIF
    videoToGif: {
        en: {
            title: 'Video to GIF Converter - Create Animated GIFs from Videos | Toolbox',
            description: 'Convert videos to GIF animations online. Create high-quality GIFs from MP4, AVI, MOV files. Customize frame rate, quality, and dimensions. Fast and free.',
            keywords: [
                'video to GIF converter',
                'convert video to GIF',
                'make GIF from video',
                'video GIF creator',
                'MP4 to GIF',
                'animated GIF maker',
                'GIF from video online',
                'video to animated GIF',
                'create GIF animation',
                'online GIF converter'
            ],
            features: [
                'Convert any video to GIF',
                'Adjust frame rate and quality',
                'Custom size and dimensions',
                'Trim video clips',
                'High-quality output',
                'Fast conversion',
                'No file size limits',
                'Privacy protected'
            ]
        },
        zh: {
            title: '视频转GIF - 在线视频转动图工具 | 工具箱',
            description: '在线将视频转换为 GIF 动图。支持从 MP4、AVI、MOV 文件创建高质量 GIF。自定义帧率、质量和尺寸。快速免费。',
            keywords: [
                '视频转GIF',
                '视频转动图',
                '视频制作GIF',
                'GIF制作工具',
                'MP4转GIF',
                '动图制作',
                '在线视频转GIF',
                '视频转GIF动图',
                'GIF动画制作',
                '在线GIF转换器'
            ],
            features: [
                '转换任何视频为GIF',
                '调整帧率和质量',
                '自定义尺寸',
                '裁剪视频片段',
                '高质量输出',
                '快速转换',
                '无文件大小限制',
                '隐私保护'
            ]
        },
        'zh-tw': {
            title: '影片轉GIF - 線上影片轉動圖工具 | 工具箱',
            description: '線上將影片轉換為 GIF 動圖。支援從 MP4、AVI、MOV 檔案建立高品質 GIF。自訂影格率、品質和尺寸。快速免費。',
            keywords: [
                '影片轉GIF',
                '影片轉動圖',
                '影片製作GIF',
                'GIF製作工具',
                'MP4轉GIF',
                '動圖製作',
                '線上影片轉GIF',
                '影片轉GIF動圖',
                'GIF動畫製作',
                '線上GIF轉換器'
            ],
            features: [
                '轉換任何影片為GIF',
                '調整影格率和品質',
                '自訂尺寸',
                '裁剪影片片段',
                '高品質輸出',
                '快速轉換',
                '無檔案大小限制',
                '隱私保護'
            ]
        }
    } as ToolSEOConfig,

    // 音频格式转换
    audioConvert: {
        en: {
            title: 'Audio Format Converter - Convert Audio Files Online Free | Toolbox',
            description: 'Free online audio converter. Convert audio files to MP3, AAC, WAV, FLAC, OGG. Adjust bitrate and quality. Support all major audio formats. Fast and secure.',
            keywords: [
                'audio format converter',
                'convert audio online',
                'audio file converter',
                'MP3 converter',
                'WAV to MP3',
                'AAC converter',
                'FLAC converter',
                'audio format changer',
                'online audio converter',
                'free audio converter'
            ],
            features: [
                'Convert to MP3, AAC, WAV, FLAC, OGG',
                'Adjust bitrate and quality',
                'Support all audio formats',
                'Batch conversion',
                'Maintain audio quality',
                'Fast processing',
                'Privacy protected',
                'No software installation'
            ]
        },
        zh: {
            title: '音频格式转换 - 免费在线音频转换工具 | 工具箱',
            description: '免费在线音频转换器。支持将音频文件转换为 MP3、AAC、WAV、FLAC、OGG 等格式。调整比特率和质量。支持所有主流音频格式。快速安全。',
            keywords: [
                '音频格式转换',
                '在线音频转换',
                '音频文件转换',
                'MP3转换器',
                'WAV转MP3',
                'AAC转换',
                'FLAC转换',
                '音频格式转换器',
                '在线音频转换器',
                '免费音频转换'
            ],
            features: [
                '转换为 MP3、AAC、WAV、FLAC、OGG',
                '调整比特率和质量',
                '支持所有音频格式',
                '批量转换',
                '保持音频质量',
                '快速处理',
                '隐私保护',
                '无需安装软件'
            ]
        },
        'zh-tw': {
            title: '音訊格式轉換 - 免費線上音訊轉換工具 | 工具箱',
            description: '免費線上音訊轉換器。支援將音訊檔案轉換為 MP3、AAC、WAV、FLAC、OGG 等格式。調整位元率和品質。支援所有主流音訊格式。快速安全。',
            keywords: [
                '音訊格式轉換',
                '線上音訊轉換',
                '音訊檔案轉換',
                'MP3轉換器',
                'WAV轉MP3',
                'AAC轉換',
                'FLAC轉換',
                '音訊格式轉換器',
                '線上音訊轉換器',
                '免費音訊轉換'
            ],
            features: [
                '轉換為 MP3、AAC、WAV、FLAC、OGG',
                '調整位元率和品質',
                '支援所有音訊格式',
                '批次轉換',
                '保持音訊品質',
                '快速處理',
                '隱私保護',
                '無需安裝軟體'
            ]
        }
    } as ToolSEOConfig,

    // 音频倍速调整
    audioSpeed: {
        en: {
            title: 'Audio Speed Changer - Adjust Audio Speed Online | Toolbox',
            description: 'Change audio playback speed online. Speed up or slow down audio while maintaining pitch. Perfect for podcasts, audiobooks, and music. Free and easy to use.',
            keywords: [
                'audio speed changer',
                'change audio speed',
                'speed up audio',
                'slow down audio',
                'audio tempo changer',
                'adjust audio speed online',
                'audio speed editor',
                'fast forward audio',
                'audio playback speed',
                'time stretch audio'
            ],
            features: [
                'Adjust playback speed (0.5x - 2.0x)',
                'Maintain original pitch',
                'Support all audio formats',
                'Preview before processing',
                'High-quality output',
                'Fast processing',
                'No quality loss',
                'Privacy protected'
            ]
        },
        zh: {
            title: '音频倍速调整 - 在线音频变速工具 | 工具箱',
            description: '在线改变音频播放速度。加速或减速音频的同时保持音调不变。适合播客、有声读物和音乐。免费易用。',
            keywords: [
                '音频倍速',
                '音频变速',
                '音频加速',
                '音频减速',
                '调整音频速度',
                '在线音频变速',
                '音频倍速工具',
                '音频快进',
                '音频播放速度',
                '音频变速器'
            ],
            features: [
                '调整播放速度（0.5x - 2.0x）',
                '保持原始音调',
                '支持所有音频格式',
                '处理前预览',
                '高质量输出',
                '快速处理',
                '无质量损失',
                '隐私保护'
            ]
        },
        'zh-tw': {
            title: '音訊倍速調整 - 線上音訊變速工具 | 工具箱',
            description: '線上改變音訊播放速度。加速或減速音訊的同時保持音調不變。適合播客、有聲讀物和音樂。免費易用。',
            keywords: [
                '音訊倍速',
                '音訊變速',
                '音訊加速',
                '音訊減速',
                '調整音訊速度',
                '線上音訊變速',
                '音訊倍速工具',
                '音訊快進',
                '音訊播放速度',
                '音訊變速器'
            ],
            features: [
                '調整播放速度（0.5x - 2.0x）',
                '保持原始音調',
                '支援所有音訊格式',
                '處理前預覽',
                '高品質輸出',
                '快速處理',
                '無品質損失',
                '隱私保護'
            ]
        }
    } as ToolSEOConfig,
};
