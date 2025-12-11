import React from 'react';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ImageProcessingOptions } from '@/utils/imageProcessor';
import { useTranslation } from '@/components/TranslationProvider';

interface FormatSelectorProps {
    value: ImageProcessingOptions['outputFormat'];
    onChange: (value: ImageProcessingOptions['outputFormat']) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({ value, onChange }) => {
    const { t } = useTranslation();
    
    return (
        <div className="space-y-3">
            <Label>{t('imageProcessor.outputFormat')}</Label>
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
                <ToggleGroupItem value="avif" aria-label="AVIF">
                    AVIF
                </ToggleGroupItem>
                <ToggleGroupItem value="ico" aria-label="ICO">
                    ICO
                </ToggleGroupItem>
                <ToggleGroupItem value="svg" aria-label="SVG">
                    SVG
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
};
