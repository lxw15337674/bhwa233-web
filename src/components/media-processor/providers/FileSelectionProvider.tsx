'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useFileSelection } from '@/hooks/useAudioConverter';

interface FileSelectionProviderType {
  selectedFile: File | null;
  dragOver: boolean;
  selectFile: (file: File) => void;
  clearFile: () => void;
  handleDragEnter: () => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
}

const FileSelectionContext = createContext<FileSelectionProviderType | undefined>(undefined);

export const useFileSelectionContext = () => {
  const context = useContext(FileSelectionContext);
  if (!context) {
    throw new Error('useFileSelectionContext must be used within a FileSelectionProvider');
  }
  return context;
};

interface FileSelectionProviderProps {
  children: ReactNode;
}

export const FileSelectionProvider: React.FC<FileSelectionProviderProps> = ({ children }) => {
  const {
    selectedFile,
    dragOver,
    selectFile,
    clearFile,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  } = useFileSelection();

  const contextValue: FileSelectionProviderType = {
    selectedFile,
    dragOver,
    selectFile,
    clearFile,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  };

  return (
    <FileSelectionContext.Provider value={contextValue}>
      {children}
    </FileSelectionContext.Provider>
  );
};