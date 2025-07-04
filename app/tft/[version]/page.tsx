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

type Params = { version: string };

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
          {equips.get(EquipmentType['ink'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} allEquips={equipData} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['job']) && (
        <div className="mt-2">
          <h2 className="text-xl font-semibold mb-4">
            无法合成的特殊转职纹章
          </h2>
          {equips.get(EquipmentType['job'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} allEquips={equipData} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['ornn']) && (
        <div className="mt-2">
          <h2 className="text-xl font-semibold mb-4">
            奥恩神器
          </h2>
          {equips.get(EquipmentType['ornn'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} allEquips={equipData} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['golden']) && (
        <div className="mt-2">
          <h2 className="text-xl font-semibold mb-4">
            金鳞龙装备
          </h2>
          {equips.get(EquipmentType['golden'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} allEquips={equipData} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['support']) && (
        <div className="mt-2">
          <h2 className="text-xl font-semibold mb-4">
            辅助装备
          </h2>
          {equips.get(EquipmentType['support'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} allEquips={equipData} />;
          })}
        </div>
      )}
    </div>
  );
} 