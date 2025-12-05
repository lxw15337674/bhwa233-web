import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShieldX } from 'lucide-react';

interface ExifSwitchProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

export const ExifSwitch: React.FC<ExifSwitchProps> = ({ checked, onCheckedChange }) => {
    return (
        <div className="space-y-2">
             <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-normal cursor-pointer">
                    <ShieldX className="w-4 h-4" />
                    去除 EXIF 信息
                </Label>
                <Switch
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                />
            </div>
            <p className="text-xs text-muted-foreground">
                移除 GPS 位置、拍摄设备等隐私信息
            </p>
        </div>
    );
};
