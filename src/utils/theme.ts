import { useThemeStore, type Theme } from '../store/themeStore';
import { SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from './designSystem';

// Theme color mappings for React Native
export const THEME_COLORS: Record<Theme, {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  border: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  destructive: string;
  success: string;
  warning: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarBorder: string;
  sidebarAccent: string;
}> = {
  light: {
    background: '#ffffff',
    foreground: '#1a1a1a',
    card: '#ffffff',
    cardForeground: '#1a1a1a',
    primary: '#5a67d8',
    primaryForeground: '#ffffff',
    secondary: '#e0e7ff',
    secondaryForeground: '#3730a3',
    border: '#e5e5e5',
    muted: '#f5f5f5',
    mutedForeground: '#666666',
    accent: '#f0f0f0',
    destructive: '#ef4444',
    success: '#22c55e',
    warning: '#eab308',
    sidebar: '#fafafa',
    sidebarForeground: '#1a1a1a',
    sidebarBorder: '#e8e8e8',
    sidebarAccent: '#f5f5f5',
  },
  dark: {
    background: '#1f2937',
    foreground: '#fafafa',
    card: '#2a2a2a',
    cardForeground: '#fafafa',
    primary: '#7c3aed', // Darkened from #8b5cf6 for better contrast
    primaryForeground: '#ffffff',
    secondary: '#3730a3',
    secondaryForeground: '#e0e7ff',
    border: 'rgba(255, 255, 255, 0.1)',
    muted: '#3a3a3a',
    mutedForeground: '#999999',
    accent: '#3a3a3a',
    destructive: '#f87171',
    success: '#4ade80',
    warning: '#facc15',
    sidebar: '#2a2a2a',
    sidebarForeground: '#fafafa',
    sidebarBorder: 'rgba(255, 255, 255, 0.1)',
    sidebarAccent: '#3a3a3a',
  },
  cupcake: {
    background: '#f5f5f4',
    foreground: '#291334',
    card: '#ffffff',
    cardForeground: '#291334',
    primary: '#65c3c8',
    primaryForeground: '#291334', // Changed to dark text for contrast
    secondary: '#ef9fbc',
    secondaryForeground: '#291334',
    border: '#e5e5e5',
    muted: '#f0f0f0',
    mutedForeground: '#666666',
    accent: '#ef9fbc',
    destructive: '#ff5724',
    success: '#36d399',
    warning: '#fbbd23',
    sidebar: '#f5f5f4',
    sidebarForeground: '#291334',
    sidebarBorder: '#e8e8e8',
    sidebarAccent: '#f5f5f5',
  },
  forest: {
    background: '#1f1d1d',
    foreground: '#e2e8f0',
    card: '#2a2a2a',
    cardForeground: '#e2e8f0',
    primary: '#3ebc96',
    primaryForeground: '#1f1d1d', // Changed to dark text for contrast
    secondary: '#254f3b',
    secondaryForeground: '#e2e8f0',
    border: 'rgba(255, 255, 255, 0.1)',
    muted: '#3a3a3a',
    mutedForeground: '#999999',
    accent: '#70c217',
    destructive: '#ef4444',
    success: '#22c55e',
    warning: '#eab308',
    sidebar: '#1f1d1d',
    sidebarForeground: '#e2e8f0',
    sidebarBorder: 'rgba(255, 255, 255, 0.1)',
    sidebarAccent: '#3a3a3a',
  },
};

export const THEMES = [
  {
    name: 'light' as Theme,
    label: 'Light',
    colors: ['#ffffff', '#5a67d8', '#8b5cf6', '#1a202c'],
  },
  {
    name: 'dark' as Theme,
    label: 'Dark',
    colors: ['#1f2937', '#8b5cf6', '#ec4899', '#1a202c'],
  },
  {
    name: 'cupcake' as Theme,
    label: 'Cupcake',
    colors: ['#f5f5f4', '#65c3c8', '#ef9fbc', '#291334'],
  },
  {
    name: 'forest' as Theme,
    label: 'Forest',
    colors: ['#1f1d1d', '#3ebc96', '#70c217', '#1a202c'],
  },
];

export const useThemeColors = () => {
  const { theme } = useThemeStore();
  return THEME_COLORS[theme];
};

export const useAppTheme = () => {
  const colors = useThemeColors();
  return {
    colors,
    spacing: SPACING,
    radius: RADIUS,
    typography: TYPOGRAPHY,
    shadows: SHADOWS,
  };
};




