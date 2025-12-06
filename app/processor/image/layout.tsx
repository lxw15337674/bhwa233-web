
import React from 'react';

export { metadata } from './metadata';

interface Props {
    children: React.ReactNode;
}

const ImageProcessorLayout: React.FC<Props> = ({ children }) => {
    return (
        <div className="min-h-screen text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-6xl">


                {children}
            </div>
        </div>
    );
};

export default ImageProcessorLayout;
