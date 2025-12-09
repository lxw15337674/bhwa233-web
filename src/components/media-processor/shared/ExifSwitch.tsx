import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShieldX } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';

interface ExifSwitchProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

export const ExifSwitch: React.FC<ExifSwitchProps> = ({ checked, onCheckedChange }) => {
    const { t } = useTranslation();
    
    return (
        <div className="space-y-2">
             <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-normal cursor-pointer">
                    <ShieldX className="w-4 h-4" />
                    {t('imageProcessor.stripExif')}
                </Label>
                <Switch
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                />
            </div>
            <p className="text-xs text-muted-foreground">
                {t('imageProcessor.stripExifHint')}
            </p>
        </div>
    );
};
