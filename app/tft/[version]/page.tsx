import {
  getChessData,
  getEquipData,
  getJobData,
  getRaceData,
  getVersionConfig,
} from '@/api/tft';
import EquipmentBox from '../components/EquipmentBox';
import { getFetter } from '@/utils/tftf';
import { TFTCard, TFTChess } from '@/api/tft/type';
import Equipment from '../components/Equipment';
import {
  EquipmentType,
  EquipsByType,
  TFTEquip,
} from '@/api/tft/model/Equipment';
import RaceJob from '../components/RaceJob';
import RaceJobChessItem from '../components/RaceJobChessItem';
import VersionSelect from '../components/VersionSelect';
import FetterGrid from '../components/FetterGrid';
import { TftImagePreloader } from '../components/TftClientComponents';
import type { Metadata } from 'next';

type Params = { version: string };

// 生成动态metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { version } = await params;
  const versionData = await getVersionConfig();
  const currentVersion = versionData.find((item) => item.idSeason === version) ?? versionData[0];

  const versionName = currentVersion.stringName || `S${version}`;

  return {
    title: `${versionName} 云顶之弈攻略 - TFT装备合成表·羁绊搭配一图流`,
    description: `${versionName} 云顶之弈最新攻略，包含装备合成表、羁绊搭配指南、阵容推荐、奥恩神器、金鳞龙装备等。实时更新，助您快速上分！`,
    keywords: [
      `${versionName}云顶之弈`, `${versionName}TFT`, `${versionName}装备合成`,
      `${versionName}羁绊`, `${versionName}阵容`, '云顶之弈攻略', 'TFT攻略',
      '装备合成表', '羁绊搭配', '阵容推荐', '一图流', '云顶之弈助手'
    ],
    openGraph: {
      title: `${versionName} 云顶之弈攻略 - 装备合成表·羁绊搭配一图流`,
      description: `${versionName} 云顶之弈最新攻略，装备合成、羁绊搭配、阵容推荐一应俱全`,
      url: `https://233tools.vercel.app/zh/tft/${version}`,
      siteName: '工具箱',
      locale: 'zh_CN',
      type: 'website',
      images: [
        {
          url: '/icons/icon-256.png',
          width: 256,
          height: 256,
          alt: `${versionName} 云顶之弈攻略`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${versionName} 云顶之弈攻略 - TFT装备合成表·羁绊搭配`,
      description: `${versionName} 云顶之弈最新攻略，装备合成、羁绊搭配、阵容推荐`,
      images: ['/icons/icon-256.png'],
    },
    alternates: {
      canonical: `https://233tools.vercel.app/zh/tft/${version}`,
      languages: {
        'zh-CN': `https://233tools.vercel.app/zh/tft/${version}`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// ISR配置：12小时重新验证一次
export const revalidate = 43200;

export default async function Page({
  params,
}: {
  params: Promise<Params>
}) {
  const { version } = await params;
  const versionData = await getVersionConfig();
  const currentVersion =
    versionData.find((item) => item.idSeason === version) ?? versionData[0];
  
  // 并行获取所有数据以提升性能
  const [chesses, jobs, races, equipData] = await Promise.all([
    getChessData(currentVersion.urlChessData),
    getJobData(currentVersion.urlJobData),
    getRaceData(currentVersion.urlRaceData),
    getEquipData(currentVersion.urlEquipData),
  ]);

  // 处理装备数据
  const equips = equipData.reduce(
    (acc: EquipsByType, equip: TFTEquip) => {
      return acc.set(equip.type, (acc.get(equip.type) || []).concat(equip));
    },
    new Map(),
  );

  const items = getFetter(jobs, races, chesses);

  return (
    <div className="p-3  ">
      {/* 图片预加载组件 */}
      <TftImagePreloader equipsByType={equips} />

      <VersionSelect
        currentVersion={currentVersion}
        versionData={versionData}
      />
      <h2 className="text-xl font-semibold mb-4">
        羁绊公式
      </h2>
      <div className="mt-3">
        <FetterGrid
          items={items}
          currentVersion={currentVersion}
          races={races}
          jobs={jobs}
        />
      </div>
      <div className="mt-2">
        <h2 className="text-xl font-semibold mb-4">
          装备公式
        </h2>
        <div className="equipment-container">
          <EquipmentBox equipsByType={equips} allEquips={equipData} />
        </div>
        <div className="text-xs text-gray-500 mt-2 flex items-center justify-center md:hidden">
          <span className="inline-flex items-center gap-1">
            👈� 左右滑动查看完整装备合成表
          </span>
        </div>
      </div>
      {equips.get(EquipmentType['ink']) && (
        <div className="mt-2">
          <h2 className="text-xl font-semibold mb-4">
            额外装备
          </h2>
          <div className="equipment-grid-wrap">
            <div className="equipment-row-wrap">
              {equips.get(EquipmentType['ink'])?.map((equip: TFTEquip) => (
                <div className="equipment-cell" key={equip.equipId}>
                  <Equipment equip={equip} allEquips={equipData} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {equips.get(EquipmentType['job']) && (
        <div className="mt-2">
          <h2 className="text-xl font-semibold mb-4">
            无法合成的特殊转职纹章
          </h2>
          <div className="equipment-grid-wrap">
            <div className="equipment-row-wrap">
              {equips.get(EquipmentType['job'])?.map((equip: TFTEquip) => (
                <div className="equipment-cell" key={equip.equipId}>
                  <Equipment equip={equip} allEquips={equipData} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {equips.get(EquipmentType['ornn']) && (
        <div className="mt-2">
          <h2 className="text-xl font-semibold mb-4">
            奥恩神器
          </h2>
          <div className="equipment-grid-wrap">
            <div className="equipment-row-wrap">
              {equips.get(EquipmentType['ornn'])?.map((equip: TFTEquip) => (
                <div className="equipment-cell" key={equip.equipId}>
                  <Equipment equip={equip} allEquips={equipData} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {equips.get(EquipmentType['golden']) && (
        <div className="mt-2">
          <h2 className="text-xl font-semibold mb-4">
            金鳞龙装备
          </h2>
          <div className="equipment-grid-wrap">
            <div className="equipment-row-wrap">
              {equips.get(EquipmentType['golden'])?.map((equip: TFTEquip) => (
                <div className="equipment-cell" key={equip.equipId}>
                  <Equipment equip={equip} allEquips={equipData} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {equips.get(EquipmentType['support']) && (
        <div className="mt-2">
          <h2 className="text-xl font-semibold mb-4">
            辅助装备
          </h2>
          <div className="equipment-grid-wrap">
            <div className="equipment-row-wrap">
              {equips.get(EquipmentType['support'])?.map((equip: TFTEquip) => (
                <div className="equipment-cell" key={equip.equipId}>
                  <Equipment equip={equip} allEquips={equipData} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 