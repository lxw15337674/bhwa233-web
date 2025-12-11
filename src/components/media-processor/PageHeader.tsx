'use client';

import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    gradient?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    gradient = 'from-green-400 to-blue-400',
}) => {
    return (
        <div className="text-center mb-4">
            <h1 className={`text-4xl font-bold mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {title}
            </h1>
            {description && (
                <p className="text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    );
};
