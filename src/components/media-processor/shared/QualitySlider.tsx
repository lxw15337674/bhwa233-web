import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface QualitySliderProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}

export const QualitySlider: React.FC<QualitySliderProps> = ({ value, onChange, disabled }) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>压缩质量</Label>
                <span className="text-sm font-medium">{value}%</span>
            </div>
            <Slider
                value={[value]}
                onValueChange={(vals) => onChange(vals[0])}
                min={1}
                max={100}
                step={1}
                disabled={disabled}
            />
            {disabled && (
                <p className="text-xs text-muted-foreground">PNG 格式为无损压缩，质量设置不生效</p>
            )}
        </div>
    );
};
