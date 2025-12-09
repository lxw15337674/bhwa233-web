'use client';

import React from 'react';
import { Camera, MapPin, Info } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
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

function formatFocalLength(focalLength?: number, focalLength35mm?: number, t?: any): string | null {
    if (!focalLength) return null;
    let result = `${focalLength.toFixed(0)}mm`;
    if (focalLength35mm && t) {
        result += ` (${focalLength35mm}mm ${t('batchExifPopover.equivalent')})`;
    }
    return result;
}

function formatWhiteBalance(value?: number, t?: any): string | null {
    if (value === undefined || !t) return null;
    return value === 0 ? t('batchExifPopover.auto') : t('batchExifPopover.manual');
}

function formatFlash(value?: number, t?: any): string | null {
    if (value === undefined || !t) return null;
    const fired = (value & 0x01) !== 0;
    const mode = (value >> 3) & 0x03;
    let result = fired ? t('batchExifPopover.fired') : t('batchExifPopover.notFired');
    if (mode === 1) result += ` (${t('batchExifPopover.forced')})`;
    else if (mode === 2) result += ` (${t('batchExifPopover.off')})`;
    else if (mode === 3) result += ` (${t('batchExifPopover.auto')})`;
    return result;
}

function formatExposureBias(value?: number): string | null {
    if (value === undefined) return null;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)} EV`;
}

function formatMeteringMode(value?: number, t?: any): string | null {
    if (value === undefined || !t) return null;
    const modes: Record<number, string> = {
        0: t('batchExifPopover.meteringUnknown'),
        1: t('batchExifPopover.meteringAverage'),
        2: t('batchExifPopover.meteringCenterWeighted'),
        3: t('batchExifPopover.meteringSpot'),
        4: t('batchExifPopover.meteringMultiSpot'),
        5: t('batchExifPopover.meteringPattern'),
        6: t('batchExifPopover.meteringPartial'),
        255: t('batchExifPopover.meteringOther'),
    };
    return modes[value] || `${t('batchExifPopover.meteringUnknown')} (${value})`;
}

function formatOrientation(value?: number, t?: any): string | null {
    if (value === undefined || !t) return null;
    const orientations: Record<number, string> = {
        1: t('batchExifPopover.orientationNormal'),
        2: t('batchExifPopover.orientationFlipH'),
        3: t('batchExifPopover.orientationRotate180'),
        4: t('batchExifPopover.orientationFlipV'),
        5: t('batchExifPopover.orientationTranspose'),
        6: t('batchExifPopover.orientationRotate90'),
        7: t('batchExifPopover.orientationTransverse'),
        8: t('batchExifPopover.orientationRotate270'),
    };
    return orientations[value] || `${t('batchExifPopover.meteringUnknown')} (${value})`;
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
    const { t } = useTranslation();
    const exif = exifMetadata;

    // 格式化数据
    const deviceInfo = exif ? [exif.make, exif.model].filter(Boolean).join(' ') : null;
    const shootTime = exif ? formatExifDateTime(exif.dateTimeOriginal || exif.dateTime) : null;
    const aperture = exif ? formatAperture(exif.fNumber) : null;
    const focalLength = exif ? formatFocalLength(exif.focalLength, exif.focalLength35mm, t) : null;
    const whiteBalance = exif ? formatWhiteBalance(exif.whiteBalance, t) : null;
    const flash = exif ? formatFlash(exif.flash, t) : null;
    const exposureBias = exif ? formatExposureBias(exif.exposureBias) : null;
    const meteringMode = exif ? formatMeteringMode(exif.meteringMode, t) : null;
    const orientation = exif ? formatOrientation(exif.orientation, t) : null;
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
                        <span className="font-semibold text-sm">{t('batchExifPopover.exifInfo')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate" title={fileName}>
                        {fileName}
                    </p>
                </div>

                <div className="p-4">
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                            {t('batchExifPopover.loading')}
                        </div>
                    ) : !hasValidExif(exif) ? (
                        <div className="py-8 text-center">
                            <Info className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                                <p className="text-sm text-muted-foreground">{t('batchExifPopover.noExifInfo')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Table>
                                <TableBody>
                                            <ExifRow label={t('batchExifPopover.device')} value={deviceInfo} />
                                            <ExifRow label={t('batchExifPopover.lens')} value={exif?.lensModel} />
                                            <ExifRow label={t('batchExifPopover.software')} value={exif?.software} />
                                            <ExifRow label={t('batchExifPopover.time')} value={shootTime} />
                                            <ExifRow label={t('batchExifPopover.aperture')} value={aperture} />
                                            <ExifRow label={t('batchExifPopover.shutter')} value={exif?.exposureTime} />
                                            <ExifRow label={t('batchExifPopover.iso')} value={exif?.iso} />
                                            <ExifRow label={t('batchExifPopover.focalLength')} value={focalLength} />
                                            <ExifRow label={t('batchExifPopover.exposureCompensation')} value={exposureBias} />
                                            <ExifRow label={t('batchExifPopover.meteringMode')} value={meteringMode} />
                                            <ExifRow label={t('batchExifPopover.whiteBalance')} value={whiteBalance} />
                                            <ExifRow label={t('batchExifPopover.flash')} value={flash} />
                                            <ExifRow label={t('batchExifPopover.orientation')} value={orientation} />
                                            <ExifRow label={t('batchExifPopover.colorSpace')} value={exif?.colorSpace} />
                                            <ExifRow label={t('batchExifPopover.resolution')} value={dpi} />
                                            <ExifRow label={t('batchExifPopover.author')} value={exif?.artist} />
                                            <ExifRow label={t('batchExifPopover.copyright')} value={exif?.copyright} />
                                </TableBody>
                            </Table>

                            {hasGps && (
                                <div className="pt-3 border-t">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                                <span className="font-medium text-xs">{t('batchExifPopover.locationInfo')}</span>
                                                <span className="text-xs text-orange-500">{t('batchExifPopover.privacySensitive')}</span>
                                    </div>
                                    <Table>
                                        <TableBody>
                                                    <ExifRow label={t('batchExifPopover.latitude')} value={gpsLat} />
                                                    <ExifRow label={t('batchExifPopover.longitude')} value={gpsLng} />
                                                    <ExifRow label={t('batchExifPopover.altitude')} value={gpsAlt} />
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
