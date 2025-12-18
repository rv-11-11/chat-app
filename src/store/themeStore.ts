import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark' | 'cupcake' | 'forest';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  
  loadTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app-theme');
      if (savedTheme && ['light', 'dark', 'cupcake', 'forest'].includes(savedTheme)) {
        set({ theme: savedTheme as Theme });
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  },
  
  setTheme: async (theme: Theme) => {
    try {
      await AsyncStorage.setItem('app-theme', theme);
      set({ theme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  },
}));



