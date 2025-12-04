'use client';

import React from 'react';
import { Camera, Info, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@/components/ui/table';
import { useImageProcessorStore, ExifMetadata } from '@/stores/media-processor/image-store';

/**
 * 格式化 EXIF 日期时间
 * 输入格式: "2025:12:01 14:30:00"
 * 输出格式: "2025-12-01 14:30"
 */
function formatExifDateTime(dateStr?: string): string | null {
    if (!dateStr) return null;

    try {
        // EXIF 日期格式: "YYYY:MM:DD HH:MM:SS"
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

/**
 * 格式化光圈值
 */
function formatAperture(fNumber?: number): string | null {
    if (!fNumber) return null;
    return `f/${fNumber.toFixed(1)}`;
}

/**
 * 格式化焦距
 */
function formatFocalLength(focalLength?: number, focalLength35mm?: number): string | null {
    if (!focalLength) return null;

    let result = `${focalLength.toFixed(0)}mm`;
    if (focalLength35mm) {
        result += ` (${focalLength35mm}mm 等效)`;
    }
    return result;
}

/**
 * 检查是否有有效的 EXIF 数据
 */
function hasValidExif(exif: ExifMetadata | null): boolean {
    if (!exif) return false;

    return !!(
        exif.make ||
        exif.model ||
        exif.dateTimeOriginal ||
        exif.dateTime ||
        exif.fNumber ||
        exif.exposureTime ||
        exif.iso ||
        exif.focalLength ||
        exif.colorSpace ||
        exif.xResolution ||
        exif.lensModel ||
        exif.whiteBalance !== undefined ||
        exif.flash !== undefined ||
        exif.gpsLatitude ||
        exif.gpsLongitude
    );
}

/**
 * 格式化白平衡
 */
function formatWhiteBalance(value?: number): string | null {
    if (value === undefined) return null;
    return value === 0 ? '自动' : '手动';
}

/**
 * 格式化闪光灯状态
 */
function formatFlash(value?: number): string | null {
    if (value === undefined) return null;

    // Flash 是一个位字段，最低位表示是否闪光
    const fired = (value & 0x01) !== 0;
    const mode = (value >> 3) & 0x03;

    let result = fired ? '已闪光' : '未闪光';

    if (mode === 1) result += ' (强制)';
    else if (mode === 2) result += ' (关闭)';
    else if (mode === 3) result += ' (自动)';

    return result;
}

/**
 * 格式化曝光补偿
 */
function formatExposureBias(value?: number): string | null {
    if (value === undefined) return null;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)} EV`;
}

/**
 * 格式化测光模式
 */
function formatMeteringMode(value?: number): string | null {
    if (value === undefined) return null;

    const modes: Record<number, string> = {
        0: '未知',
        1: '平均',
        2: '中央重点',
        3: '点测光',
        4: '多点',
        5: '多区域',
        6: '局部',
        255: '其他',
    };

    return modes[value] || `未知 (${value})`;
}

/**
 * 格式化方向
 */
function formatOrientation(value?: number): string | null {
    if (value === undefined) return null;

    const orientations: Record<number, string> = {
        1: '正常',
        2: '水平翻转',
        3: '旋转 180°',
        4: '垂直翻转',
        5: '顺时针 90° + 水平翻转',
        6: '顺时针 90°',
        7: '逆时针 90° + 水平翻转',
        8: '逆时针 90°',
    };

    return orientations[value] || `未知 (${value})`;
}

/**
 * 格式化 GPS 坐标
 */
function formatGpsCoordinate(
    value?: number,
    ref?: string
): string | null {
    if (value === undefined) return null;

    const direction = ref || '';
    return `${value.toFixed(6)}° ${direction}`;
}

/**
 * 格式化海拔
 */
function formatAltitude(value?: number): string | null {
    if (value === undefined) return null;
    return `${value.toFixed(1)} m`;
}

interface ExifRowProps {
    label: string;
    value: string | number | null | undefined;
    strikethrough?: boolean;
}

const ExifRow: React.FC<ExifRowProps> = ({ label, value, strikethrough }) => {
    if (!value) return null;

    return (
        <TableRow>
            <TableCell className="text-muted-foreground py-1.5 w-20">{label}</TableCell>
            <TableCell className={`py-1.5 ${strikethrough ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                {value}
            </TableCell>
        </TableRow>
    );
};

export const ImageExifPanel: React.FC = () => {
    const { exifMetadata, inputFile, options } = useImageProcessorStore();
    const willBeStripped = options.stripMetadata;

    // 无图片时不显示
    if (!inputFile) {
        return null;
    }

    // 无有效 EXIF 数据时显示提示
    if (!hasValidExif(exifMetadata)) {
        return (
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">元数据</span>
                </div>
                <p className="text-sm text-muted-foreground">无 EXIF 信息</p>
            </Card>
        );
    }

    const exif = exifMetadata!;

    // 设备信息
    const deviceInfo = [exif.make, exif.model].filter(Boolean).join(' ');

    // 拍摄时间
    const shootTime = formatExifDateTime(exif.dateTimeOriginal || exif.dateTime);

    // 拍摄参数
    const aperture = formatAperture(exif.fNumber);
    const focalLength = formatFocalLength(exif.focalLength, exif.focalLength35mm);
    const whiteBalance = formatWhiteBalance(exif.whiteBalance);
    const flash = formatFlash(exif.flash);
    const exposureBias = formatExposureBias(exif.exposureBias);
    const meteringMode = formatMeteringMode(exif.meteringMode);

    // 图像属性
    const orientation = formatOrientation(exif.orientation);
    const dpi = exif.xResolution && exif.yResolution
        ? `${Math.round(exif.xResolution)} × ${Math.round(exif.yResolution)} DPI`
        : exif.xResolution
            ? `${Math.round(exif.xResolution)} DPI`
            : null;

    // GPS 信息
    const gpsLat = formatGpsCoordinate(exif.gpsLatitude, exif.gpsLatitudeRef);
    const gpsLng = formatGpsCoordinate(exif.gpsLongitude, exif.gpsLongitudeRef);
    const gpsAlt = formatAltitude(exif.gpsAltitude);
    const hasGps = gpsLat || gpsLng;

    return (
        <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">元数据</span>
                {willBeStripped && (
                    <span className="text-xs text-muted-foreground">(将被移除)</span>
                )}
            </div>

            <Table>
                <TableBody>
                    {/* ===== 器材信息 ===== */}
                    <ExifRow label="设备" value={deviceInfo} strikethrough={willBeStripped} />
                    <ExifRow label="镜头" value={exif.lensModel} strikethrough={willBeStripped} />
                    <ExifRow label="软件" value={exif.software} strikethrough={willBeStripped} />

                    {/* ===== 拍摄时间 ===== */}
                    <ExifRow label="时间" value={shootTime} strikethrough={willBeStripped} />

                    {/* ===== 拍摄参数 ===== */}
                    <ExifRow label="光圈" value={aperture} strikethrough={willBeStripped} />
                    <ExifRow label="快门" value={exif.exposureTime} strikethrough={willBeStripped} />
                    <ExifRow label="ISO" value={exif.iso} strikethrough={willBeStripped} />
                    <ExifRow label="焦距" value={focalLength} strikethrough={willBeStripped} />
                    <ExifRow label="曝光补偿" value={exposureBias} strikethrough={willBeStripped} />
                    <ExifRow label="测光模式" value={meteringMode} strikethrough={willBeStripped} />
                    <ExifRow label="白平衡" value={whiteBalance} strikethrough={willBeStripped} />
                    <ExifRow label="闪光灯" value={flash} strikethrough={willBeStripped} />

                    {/* ===== 图像属性 ===== */}
                    <ExifRow label="方向" value={orientation} strikethrough={willBeStripped} />
                    <ExifRow label="色彩空间" value={exif.colorSpace} strikethrough={willBeStripped} />
                    <ExifRow label="分辨率" value={dpi} strikethrough={willBeStripped} />

                    {/* ===== 版权信息 ===== */}
                    <ExifRow label="作者" value={exif.artist} strikethrough={willBeStripped} />
                    <ExifRow label="版权" value={exif.copyright} strikethrough={willBeStripped} />
                </TableBody>
            </Table>

            {/* GPS 信息 - 单独显示，带隐私警告 */}
            {hasGps && (
                <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-sm">位置信息</span>
                        <span className="text-xs text-orange-500">⚠️ 隐私敏感</span>
                    </div>
                    <Table>
                        <TableBody>
                            <ExifRow label="纬度" value={gpsLat} strikethrough={willBeStripped} />
                            <ExifRow label="经度" value={gpsLng} strikethrough={willBeStripped} />
                            <ExifRow label="海拔" value={gpsAlt} strikethrough={willBeStripped} />
                        </TableBody>
                    </Table>
                </div>
            )}
        </Card>
    );
};
