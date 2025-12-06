import {
  Fish,
  MessageCircle,
  Upload,
  Music,
  Video,
  Image,
  Settings,
  Wrench,
  Mic,
  Edit,
  AudioLines,
  FileImage,
  FileVideo
} from 'lucide-react';

export interface MenuItem {
  name: string;
  url: string;
  icon?: any;
  description?: string;
  translationKey?: string;
  descriptionKey?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: any;
  items: MenuItem[];
  translationKey?: string;
}

// 定义功能分类
export const Categories: CategoryItem[] = [
  {
    id: 'tools',
    name: '工具箱',
    translationKey: 'navigation.categories.tools',
    icon: Wrench,
    items: [
      {
        name: '文件上传',
        translationKey: 'navigation.menuItems.fileUpload',
        descriptionKey: 'navigation.menuItems.fileUploadDesc',
        url: '/upload',
        icon: Upload,
        description: '安全快速的文件上传服务，支持多种文件格式'
      },
      {
        name: '摸鱼办',
        translationKey: 'navigation.menuItems.fishingTime',
        descriptionKey: 'navigation.menuItems.fishingTimeDesc',
        url: '/fishingTime',
        icon: Fish,
        description: '专为上班族打造的假期倒计时和工资倒计时工具'
      }
    ]
  },
  {
    id: 'media-processor',
    name: '图片处理',
    translationKey: 'navigation.categories.mediaProcessor',
    icon: Video,
    items: [
      {
        name: '图片处理',
        translationKey: 'navigation.menuItems.imageProcess',
        descriptionKey: 'navigation.menuItems.imageProcessDesc',
        url: '/processor/image',
        icon: Image,
        description: '图片压缩、格式转换、尺寸调整等基础处理功能'
      },
      {
        name: '图片编辑',
        translationKey: 'navigation.menuItems.imageEditor',
        descriptionKey: 'navigation.menuItems.imageEditorDesc',
        url: '/processor/editor',
        icon: Edit,
        description: '在线图片编辑器，支持裁剪、旋转、滤镜等高级编辑'
      },
      {
        name: '批量处理',
        translationKey: 'navigation.menuItems.batchProcess',
        descriptionKey: 'navigation.menuItems.batchProcessDesc',
        url: '/processor/batchimage',
        icon: Settings,
        description: '批量压缩、格式转换，高效处理多张图片'
      }
    ]
  },
  {
    id: 'audio-tools',
    name: '音频工具',
    translationKey: 'navigation.categories.audioTools',
    icon: AudioLines,
    items: [
      {
        name: '音频格式转换',
        translationKey: 'navigation.menuItems.audioFormatConvert',
        descriptionKey: 'navigation.menuItems.audioFormatConvertDesc',
        url: '/media-processor?category=audio&function=audio-convert',
        icon: Music,
        description: '将音频文件转换为不同的格式和质量，支持多种音频格式'
      },
      {
        name: '音频倍速调整',
        translationKey: 'navigation.menuItems.audioSpeedChange',
        descriptionKey: 'navigation.menuItems.audioSpeedChangeDesc',
        url: '/media-processor?category=audio&function=audio-speed-change',
        icon: Mic,
        description: '调整音频的播放速度，同时保持音调不变'
      },
      {
        name: '语音转文字',
        translationKey: 'navigation.menuItems.speechToText',
        descriptionKey: 'navigation.menuItems.speechToTextDesc',
        url: '/media-processor?category=audio&function=speech-to-text',
        icon: MessageCircle,
        description: '将音频文件转换为文字，支持自动语言检测'
      }
    ]
  }
];

