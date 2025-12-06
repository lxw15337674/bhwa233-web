'use client';

import React from 'react';
import { Camera, MapPin, Info } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@/components/ui/table';
import { ExifMetadata } from '@/stores/media-processor/image-store';

/**
 * 格式化 EXIF 日期时间
 */
function formatExifDateTime(dateStr?: string): string | null {
    if (!dateStr) return null;
    try {
        const match = dateStr.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2})/);
        if (match) {
            const [, year, month, day, hour, minute] = match;
            return `${year}-${month}-${day} ${hour}:${minute}`;
        }
        return dateStr;
    } catch {
        return dateStr;
    }
}

function formatAperture(fNumber?: number): string | null {
    if (!fNumber) return null;
    return `f/${fNumber.toFixed(1)}`;
}

function formatFocalLength(focalLength?: number, focalLength35mm?: number): string | null {
    if (!focalLength) return null;
    let result = `${focalLength.toFixed(0)}mm`;
    if (focalLength35mm) {
        result += ` (${focalLength35mm}mm 等效)`;
    }
    return result;
}

function formatWhiteBalance(value?: number): string | null {
    if (value === undefined) return null;
    return value === 0 ? '自动' : '手动';
}

function formatFlash(value?: number): string | null {
    if (value === undefined) return null;
    const fired = (value & 0x01) !== 0;
    const mode = (value >> 3) & 0x03;
    let result = fired ? '已闪光' : '未闪光';
    if (mode === 1) result += ' (强制)';
    else if (mode === 2) result += ' (关闭)';
    else if (mode === 3) result += ' (自动)';
    return result;
}

function formatExposureBias(value?: number): string | null {
    if (value === undefined) return null;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)} EV`;
}

function formatMeteringMode(value?: number): string | null {
    if (value === undefined) return null;
    const modes: Record<number, string> = {
        0: '未知', 1: '平均', 2: '中央重点', 3: '点测光',
        4: '多点', 5: '多区域', 6: '局部', 255: '其他',
    };
    return modes[value] || `未知 (${value})`;
}

function formatOrientation(value?: number): string | null {
    if (value === undefined) return null;
    const orientations: Record<number, string> = {
        1: '正常', 2: '水平翻转', 3: '旋转 180°', 4: '垂直翻转',
        5: '顺时针 90° + 水平翻转', 6: '顺时针 90°',
        7: '逆时针 90° + 水平翻转', 8: '逆时针 90°',
    };
    return orientations[value] || `未知 (${value})`;
}

function formatGpsCoordinate(value?: number, ref?: string): string | null {
    if (value === undefined) return null;
    return `${value.toFixed(6)}° ${ref || ''}`;
}

function formatAltitude(value?: number): string | null {
    if (value === undefined) return null;
    return `${value.toFixed(1)} m`;
}

function hasValidExif(exif: ExifMetadata | null | undefined): boolean {
    if (!exif) return false;
    return !!(
        exif.make || exif.model || exif.dateTimeOriginal || exif.dateTime ||
        exif.fNumber || exif.exposureTime || exif.iso || exif.focalLength ||
        exif.colorSpace || exif.xResolution || exif.lensModel ||
        exif.whiteBalance !== undefined || exif.flash !== undefined ||
        exif.gpsLatitude || exif.gpsLongitude
    );
}

interface ExifRowProps {
    label: string;
    value: string | number | null | undefined;
}

const ExifRow: React.FC<ExifRowProps> = ({ label, value }) => {
    if (!value) return null;
    return (
        <TableRow>
            <TableCell className="text-muted-foreground py-1.5 w-20 text-xs">{label}</TableCell>
            <TableCell className="font-medium py-1.5 text-sm">{value}</TableCell>
        </TableRow>
    );
};

interface BatchExifPopoverProps {
    children: React.ReactNode;
    fileName: string;
    exifMetadata?: ExifMetadata | null;
    isLoading?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const BatchExifPopover: React.FC<BatchExifPopoverProps> = ({
    children,
    fileName,
    exifMetadata,
    isLoading = false,
    onOpenChange,
}) => {
    const exif = exifMetadata;

    // 格式化数据
    const deviceInfo = exif ? [exif.make, exif.model].filter(Boolean).join(' ') : null;
    const shootTime = exif ? formatExifDateTime(exif.dateTimeOriginal || exif.dateTime) : null;
    const aperture = exif ? formatAperture(exif.fNumber) : null;
    const focalLength = exif ? formatFocalLength(exif.focalLength, exif.focalLength35mm) : null;
    const whiteBalance = exif ? formatWhiteBalance(exif.whiteBalance) : null;
    const flash = exif ? formatFlash(exif.flash) : null;
    const exposureBias = exif ? formatExposureBias(exif.exposureBias) : null;
    const meteringMode = exif ? formatMeteringMode(exif.meteringMode) : null;
    const orientation = exif ? formatOrientation(exif.orientation) : null;
    const dpi = exif?.xResolution && exif?.yResolution
        ? `${Math.round(exif.xResolution)} × ${Math.round(exif.yResolution)} DPI`
        : exif?.xResolution
            ? `${Math.round(exif.xResolution)} DPI`
            : null;

    // GPS
    const gpsLat = exif ? formatGpsCoordinate(exif.gpsLatitude, exif.gpsLatitudeRef) : null;
    const gpsLng = exif ? formatGpsCoordinate(exif.gpsLongitude, exif.gpsLongitudeRef) : null;
    const gpsAlt = exif ? formatAltitude(exif.gpsAltitude) : null;
    const hasGps = gpsLat || gpsLng;

    return (
        <Popover onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent
                className="w-[500px] max-h-[600px] overflow-y-auto p-0"
                side="left"
                align="start"
                sideOffset={8}
            >
                <div className="sticky top-0 bg-popover border-b p-4 z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <Camera className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-sm">EXIF 信息</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate" title={fileName}>
                        {fileName}
                    </p>
                </div>

                <div className="p-4">
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                            加载中...
                        </div>
                    ) : !hasValidExif(exif) ? (
                        <div className="py-8 text-center">
                            <Info className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                            <p className="text-sm text-muted-foreground">无 EXIF 信息</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Table>
                                <TableBody>
                                    <ExifRow label="设备" value={deviceInfo} />
                                    <ExifRow label="镜头" value={exif?.lensModel} />
                                    <ExifRow label="软件" value={exif?.software} />
                                    <ExifRow label="时间" value={shootTime} />
                                    <ExifRow label="光圈" value={aperture} />
                                    <ExifRow label="快门" value={exif?.exposureTime} />
                                    <ExifRow label="ISO" value={exif?.iso} />
                                    <ExifRow label="焦距" value={focalLength} />
                                    <ExifRow label="曝光补偿" value={exposureBias} />
                                    <ExifRow label="测光模式" value={meteringMode} />
                                    <ExifRow label="白平衡" value={whiteBalance} />
                                    <ExifRow label="闪光灯" value={flash} />
                                    <ExifRow label="方向" value={orientation} />
                                    <ExifRow label="色彩空间" value={exif?.colorSpace} />
                                    <ExifRow label="分辨率" value={dpi} />
                                    <ExifRow label="作者" value={exif?.artist} />
                                    <ExifRow label="版权" value={exif?.copyright} />
                                </TableBody>
                            </Table>

                            {hasGps && (
                                <div className="pt-3 border-t">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                        <span className="font-medium text-xs">位置信息</span>
                                        <span className="text-xs text-orange-500">⚠️ 隐私敏感</span>
                                    </div>
                                    <Table>
                                        <TableBody>
                                            <ExifRow label="纬度" value={gpsLat} />
                                            <ExifRow label="经度" value={gpsLng} />
                                            <ExifRow label="海拔" value={gpsAlt} />
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
