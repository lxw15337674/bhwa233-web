import React from 'react';

export { metadata } from './metadata';

interface Props {
    children: React.ReactNode;
}

const BatchImageProcessorLayout: React.FC<Props> = ({ children }) => {
    return (
        <div className="min-h-screen text-foreground">
            <div className=" container mx-auto px-4 py-8 ">
                {children}
            </div>
        </div>
    );
};

export default BatchImageProcessorLayout;