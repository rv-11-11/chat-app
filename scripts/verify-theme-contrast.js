const THEME_COLORS = {
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
    primary: '#7c3aed',
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
    primaryForeground: '#291334',
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
    primaryForeground: '#1f1d1d',
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

function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function luminance(r, g, b) {
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrast(hex1, hex2) {
  if (hex1.startsWith('rgba') || hex2.startsWith('rgba')) return 'N/A (Alpha)';
  
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return 'Invalid Hex';
  
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

console.log('Verifying Theme Contrast Ratios (WCAG AA requires 4.5:1 for normal text)\n');

let passCount = 0;
let failCount = 0;

Object.entries(THEME_COLORS).forEach(([themeName, colors]) => {
  console.log(`--- Theme: ${themeName.toUpperCase()} ---`);
  
  const pairs = [
    ['Foreground on Background', colors.foreground, colors.background],
    ['Card Foreground on Card', colors.cardForeground, colors.card],
    ['Primary Foreground on Primary', colors.primaryForeground, colors.primary],
    ['Secondary Foreground on Secondary', colors.secondaryForeground, colors.secondary],
    ['Muted Foreground on Background', colors.mutedForeground, colors.background],
  ];

  pairs.forEach(([label, fg, bg]) => {
    const ratio = contrast(fg, bg);
    if (typeof ratio === 'number') {
      const status = ratio >= 4.5 ? 'PASS' : (ratio >= 3 ? 'WARN (Large Text Only)' : 'FAIL');
      if (ratio < 4.5) failCount++; else passCount++;
      console.log(`${label}: ${ratio.toFixed(2)}:1 [${status}]`);
    } else {
      console.log(`${label}: ${ratio}`);
    }
  });
  console.log('');
});

if (failCount > 0) {
  console.log(`\nVerification completed with ${failCount} failures/warnings.`);
} else {
  console.log('\nVerification completed successfully. All core pairs meet AA standards.');
}
