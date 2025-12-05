import React from 'react';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ImageProcessingOptions } from '@/utils/imageProcessor';

interface FormatSelectorProps {
    value: ImageProcessingOptions['outputFormat'];
    onChange: (value: ImageProcessingOptions['outputFormat']) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({ value, onChange }) => {
    return (
        <div className="space-y-3">
            <Label>输出格式</Label>
            <ToggleGroup
                type="single"
                value={value}
                onValueChange={(val) => {
                    if (val) onChange(val as ImageProcessingOptions['outputFormat']);
                }}
                className="justify-start flex-wrap"
            >
                <ToggleGroupItem value="jpeg" aria-label="JPEG">
                    JPEG
                </ToggleGroupItem>
                <ToggleGroupItem value="png" aria-label="PNG">
                    PNG
                </ToggleGroupItem>
                <ToggleGroupItem value="webp" aria-label="WebP">
                    WebP
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
};
