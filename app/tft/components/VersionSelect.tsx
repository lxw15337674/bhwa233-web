'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { redirect } from 'next/navigation';
import { ISeasonInfo } from '../../../src/api/tft';

interface Props {
  versionData: ISeasonInfo[];
  currentVersion: ISeasonInfo;
}
const VersionSelect = ({ versionData, currentVersion }: Props) => {
  return (
    <Select
      value={currentVersion.idSeason}
      onValueChange={(value) => {
        redirect(`/tft/${value}`);
      }}
    >
      <SelectTrigger className="w-full border-[1px] mb-2">
        <SelectValue placeholder="选择版本" />
      </SelectTrigger>
      <SelectContent>
        {versionData?.map((item) => {
          return (
            <SelectItem value={item.idSeason} key={item.idSeason}>
              {item.stringName}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default VersionSelect;
