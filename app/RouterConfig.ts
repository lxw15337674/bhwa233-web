import { 
  Fish,
  Gamepad2,
  MessageCircle,
  Upload,
  Music
} from 'lucide-react';

interface MenuItem {
  name: string;
  url: string;
  icon?: any;
}

export const Apps: MenuItem[] = [
  {
    name: '文件上传',
    url: '/upload',
    icon: Upload
  },
  {
    name: '音频转换',
    url: '/audio-converter',
    icon: Music
  },
  // {
  //   name : '图床',
  //   url: '/gallery',
  //   icon: Image
  // },
  {
    name: '摸鱼办',
    url: '/fishingTime',
    icon: Fish
  },
  {
    name: '云顶之弈一图流',
    url: '/tft',
    icon: Gamepad2
  },
];

