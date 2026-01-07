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
  url: string;
  icon?: any;
  translationKey: string;
  descriptionKey: string;
}

export interface CategoryItem {
  id: string;
  icon: any;
  items: MenuItem[];
  translationKey: string;
}

// 定义功能分类
export const Categories: CategoryItem[] = [
  {
    id: 'tools',
    translationKey: 'navigation.categories.tools',
    icon: Wrench,
    items: [
      {
        translationKey: 'navigation.menuItems.fileUpload',
        descriptionKey: 'navigation.menuItems.fileUploadDesc',
        url: '/upload',
        icon: Upload
      },
      {
        translationKey: 'navigation.menuItems.fishingTime',
        descriptionKey: 'navigation.menuItems.fishingTimeDesc',
        url: '/fishingTime',
        icon: Fish
      }
    ]
  },
  {
    id: 'media-processor',
    translationKey: 'navigation.categories.mediaProcessor',
    icon: Video,
    items: [
      {
        translationKey: 'navigation.menuItems.imageProcess',
        descriptionKey: 'navigation.menuItems.imageProcessDesc',
        url: '/processor/image',
        icon: Image
      },
      {
        translationKey: 'navigation.menuItems.imageEditor',
        descriptionKey: 'navigation.menuItems.imageEditorDesc',
        url: '/processor/editor',
        icon: Edit
      },
      {
        translationKey: 'navigation.menuItems.batchProcess',
        descriptionKey: 'navigation.menuItems.batchProcessDesc',
        url: '/processor/batch/image',
        icon: Settings
      }
    ]
  },
  {
    id: 'video-tools',
    translationKey: 'navigation.categories.videoTools',
    icon: FileVideo,
    items: [
      {
        translationKey: 'navigation.menuItems.audioExtract',
        descriptionKey: 'navigation.menuItems.audioExtractDesc',
        url: '/processor/video/extract',
        icon: Music
      },
      {
        translationKey: 'navigation.menuItems.videoToGif',
        descriptionKey: 'navigation.menuItems.videoToGifDesc',
        url: '/processor/video/gif',
        icon: FileImage
      }
    ]
  },
  {
    id: 'audio-tools',
    translationKey: 'navigation.categories.audioTools',
    icon: AudioLines,
    items: [
      {
        translationKey: 'navigation.menuItems.audioFormatConvert',
        descriptionKey: 'navigation.menuItems.audioFormatConvertDesc',
        url: '/processor/audio/convert',
        icon: AudioLines
      },
      {
        translationKey: 'navigation.menuItems.audioSpeedChange',
        descriptionKey: 'navigation.menuItems.audioSpeedChangeDesc',
        url: '/processor/audio/speed',
        icon: Music
      }
      // {
      //   translationKey: 'navigation.menuItems.speechToText',
      //   descriptionKey: 'navigation.menuItems.speechToTextDesc',
      //   url: '/processor/audio/speech-text',
      //   icon: Mic
      // }
    ]
  }
];

