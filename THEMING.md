# Theme System & Design Tokens

This project uses a comprehensive theme system and design tokens to ensure consistency, accessibility, and easy customization.

## Core Components

### 1. Design Tokens (`src/utils/designSystem.ts`)
The foundation of our UI is a set of constant design tokens for spacing, typography, radius, and shadows.

- **Spacing**: `spacing.xs` (4px) to `spacing.xxxl` (48px)
- **Radius**: `radius.sm` (4px) to `radius.full` (9999px)
- **Typography**: Pre-defined text styles (`h1`, `body`, `caption`, etc.)
- **Shadows**: Standardized shadow styles (`sm`, `md`, `lg`)

### 2. Theme Store (`src/store/themeStore.ts`)
We use Zustand to manage the active theme state. This allows for:
- Dynamic theme switching (Light/Dark/System)
- Persistence of user preference
- Instant propagation of theme changes across the app

### 3. Theme Hook (`useAppTheme`)
The `useAppTheme` hook is the primary way to access theme values in your components. It returns:
- `colors`: The current active color palette
- `spacing`, `radius`, `typography`, `shadows`: Constant design tokens
- `theme`: The current theme mode ('light' | 'dark' | 'system')
- `setTheme`: Function to change the theme

## Usage Example

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../utils/theme';

export const MyComponent = () => {
  const { colors, spacing, typography, radius } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      padding: spacing.lg,
      borderRadius: radius.md,
    },
    text: {
      ...typography.body,
      color: colors.foreground,
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </View>
  );
};
```

## Extending the Theme

### Adding New Colors
1. Update `ThemeColors` interface in `src/types/theme.type.ts` (if exists) or `src/utils/theme.ts`.
2. Add the new color key to `lightTheme` and `darkTheme` objects in `src/utils/theme.ts`.

### Adding New Tokens
Modify `src/utils/designSystem.ts` to add new keys to the respective constant objects.

## Accessibility
The theme system is designed to meet WCAG AA standards.
- `colors.foreground` always contrasts with `colors.background`
- `colors.primaryForeground` always contrasts with `colors.primary`
- `colors.mutedForeground` ensures readability on `colors.card` or `colors.background`

You can verify the contrast ratios of the current theme configuration by running:
```bash
node scripts/verify-theme-contrast.js
```

## Best Practices
1. **Avoid Hardcoded Values**: Always use `spacing`, `radius`, and `colors` from the hook.
2. **Use Typography Tokens**: Prefer `...typography.body` over manual `fontSize`/`fontWeight`.
3. **Respect Dark Mode**: Always use semantic color names (e.g., `colors.card` instead of `'white'`) to ensure automatic dark mode support.
