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
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: any;
  items: MenuItem[];
}

// 定义功能分类
export const Categories: CategoryItem[] = [
  {
    id: 'tools',
    name: '工具箱',
    icon: Wrench,
    items: [
      {
        name: '文件上传',
        url: '/upload',
        icon: Upload,
        description: '安全快速的文件上传服务，支持多种文件格式'
      },
      {
        name: '摸鱼办',
        url: '/fishingTime',
        icon: Fish,
        description: '专为上班族打造的假期倒计时和工资倒计时工具'
      }
    ]
  },
  {
    id: 'media-processor',
    name: '综合媒体处理',
    icon: Video,
    items: [
      {
        name: '图片处理',
        url: '/media-processor?category=image',
        icon: Image,
        description: '通过综合媒体处理器访问图片处理功能'
      },
      {
        name: '图片编辑',
        url: '/media-processor?category=editor',
        icon: Edit,
        description: '通过综合媒体处理器访问图片编辑功能'
      },
      {
        name: '批量处理',
        url: '/media-processor?category=batch',
        icon: Settings,
        description: '通过综合媒体处理器访问批量处理功能'
      }
    ]
  },
  {
    id: 'audio-tools',
    name: '音频工具',
    icon: AudioLines,
    items: [
      {
        name: '音频格式转换',
        url: '/processor/audio/convert',
        icon: Music,
        description: '将音频文件转换为不同的格式和质量，支持多种音频格式'
      },
      {
        name: '音频倍速调整',
        url: '/processor/audio/audio-speed-change',
        icon: Mic,
        description: '调整音频的播放速度，同时保持音调不变'
      },
      {
        name: '语音转文字',
        url: '/processor/audio/speech-to-text',
        icon: MessageCircle,
        description: '独立的语音转文字工具，将音频文件转换为文字，支持自动语言检测'
      }
    ]
  },
  {
    id: 'standalone-tools',
    name: '独立工具',
    icon: Wrench,
    items: [
      {
        name: '图片处理器',
        url: '/processor/image',
        icon: FileImage,
        description: '独立的图片处理器，支持格式转换、尺寸调整、质量优化、EXIF信息查看等'
      },
      {
        name: '图片编辑器',
        url: '/processor/editor',
        icon: Edit,
        description: '独立的图片编辑器，支持裁剪、滤镜、标注、水印等高级功能'
      },
      {
        name: '批量图片处理',
        url: '/processor/image/batch',
        icon: FileImage,
        description: '独立的批量图片处理工具，批量转换格式、压缩、调整尺寸'
      }
    ]
  }
];

