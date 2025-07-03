import {
  getChessData,
  getEquipData,
  getJobData,
  getRaceData,
  getVersionConfig,
} from '@/api/tft';
import EquipmentBox from '../components/EquipmentBox';
import { Typography } from '@mui/material';
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

// 为静态生成预构建所有版本页面
export async function generateStaticParams(): Promise<Params[]> {
  const versionData = await getVersionConfig();
  return versionData.map((version) => ({
    version: version.idSeason,
  }));
}

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
      <Typography variant="h5" gutterBottom>
        羁绊公式
      </Typography>
      <div className="mt-3">
        <FetterGrid
          items={items}
          currentVersion={currentVersion}
          races={races}
          jobs={jobs}
        />
      </div>
      <div className="mt-2">
        <Typography variant="h5" gutterBottom>
          装备公式
        </Typography>
        <EquipmentBox equipsByType={equips} />
      </div>
      {equips.get(EquipmentType['ink']) && (
        <div className="mt-2">
          <Typography variant="h5" gutterBottom>
            额外装备
          </Typography>
          {equips.get(EquipmentType['ink'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['job']) && (
        <div className="mt-2">
          <Typography variant="h5" gutterBottom>
            无法合成的特殊转职纹章
          </Typography>
          {equips.get(EquipmentType['job'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['ornn']) && (
        <div className="mt-2">
          <Typography variant="h5" gutterBottom>
            奥恩神器
          </Typography>
          {equips.get(EquipmentType['ornn'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['golden']) && (
        <div className="mt-2">
          <Typography variant="h5" gutterBottom>
            金鳞龙装备
          </Typography>
          {equips.get(EquipmentType['golden'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} />;
          })}
        </div>
      )}
      {equips.get(EquipmentType['support']) && (
        <div className="mt-2">
          <Typography variant="h5" gutterBottom>
            辅助装备
          </Typography>
          {equips.get(EquipmentType['support'])?.map((equip: TFTEquip) => {
            return <Equipment equip={equip} key={equip.equipId} />;
          })}
        </div>
      )}
    </div>
  );
} 