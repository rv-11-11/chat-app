import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore, type Theme } from '../store/themeStore';
import { THEMES } from '../utils/theme';
import { useThemeColors } from '../utils/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Theme</Text>
        <FontAwesome name="tint" size={20} color={colors.foreground} />
      </View>

      <View style={styles.themeGrid}>
        {THEMES.map((themeOption) => {
          const isSelected = theme === themeOption.name;
          return (
            <TouchableOpacity
              key={themeOption.name}
              style={[
                styles.themeCard,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                },
              ]}
              onPress={() => setTheme(themeOption.name)}
            >
              <View style={styles.colorPreview}>
                {themeOption.colors.map((color, i) => (
                  <View
                    key={i}
                    style={[
                      styles.colorDot,
                      { backgroundColor: color, borderColor: colors.border },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[
                  styles.themeLabel,
                  { color: isSelected ? colors.primary : colors.foreground },
                ]}
              >
                {themeOption.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 4,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

