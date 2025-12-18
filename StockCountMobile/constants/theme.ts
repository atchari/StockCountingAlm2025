/**
 * ALUMET Stock Counting System - Theme Colors
 * Matching with StockCountFront (React Web) theme
 */

import { Platform } from 'react-native';

// ALUMET Brand Colors - matching web frontend
const primaryOrange = '#ff6600';
const primaryOrangeDark = '#e55a00';
const primaryOrangeLight = '#ff8533';
const successGreen = '#00a86b';
const successGreenDark = '#008557';

const tintColorLight = primaryOrange;
const tintColorDark = primaryOrangeLight;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // ALUMET specific colors
    primary: primaryOrange,
    primaryDark: primaryOrangeDark,
    primaryLight: primaryOrangeLight,
    success: successGreen,
    successDark: successGreenDark,
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // ALUMET specific colors
    primary: primaryOrangeLight,
    primaryDark: primaryOrange,
    primaryLight: '#ffaa66',
    success: successGreen,
    successDark: successGreenDark,
    error: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
    gray: {
      50: '#111827',
      100: '#1f2937',
      200: '#374151',
      300: '#4b5563',
      400: '#6b7280',
      500: '#9ca3af',
      600: '#d1d5db',
      700: '#e5e7eb',
      800: '#f3f4f6',
      900: '#f9fafb',
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
