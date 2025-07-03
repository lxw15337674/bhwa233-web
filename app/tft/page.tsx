import { getVersionConfig } from '@/api/tft';
import { redirect } from 'next/navigation';

export default async function TftRedirectPage() {
  const versionData = await getVersionConfig();
  const latestVersion = versionData[0]; // 假设第一个是最新版本

  redirect(`/tft/${latestVersion.idSeason}`);
}
