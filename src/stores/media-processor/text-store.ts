import { create } from 'zustand';

interface TextInputStore {
  inputText: string;
  setInputText: (text: string) => void;
  clearTextData: () => void;
}

export const useTextProcessorStore = create<TextInputStore>()((set) => ({
  inputText: '',
  setInputText: (text) => set({ inputText: text }),
  clearTextData: () => set({ inputText: '' }),
}));