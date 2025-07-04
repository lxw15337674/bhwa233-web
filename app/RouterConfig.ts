import { 
  Fish,
  Gamepad2,
  MessageCircle
} from 'lucide-react';

interface MenuItem {
  name: string;
  url: string;
  icon?: any;
}

export const Apps: MenuItem[] = [

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

