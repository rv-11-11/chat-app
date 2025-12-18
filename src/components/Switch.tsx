import React from 'react';
import { Switch as RNSwitch, StyleSheet } from 'react-native';
import { useThemeColors } from '../utils/theme';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export default function Switch({ checked, onCheckedChange }: SwitchProps) {
  const colors = useThemeColors();

  return (
    <RNSwitch
      value={checked}
      onValueChange={onCheckedChange}
      trackColor={{ false: colors.muted, true: colors.primary + '80' }}
      thumbColor={checked ? colors.primary : colors.mutedForeground}
      ios_backgroundColor={colors.muted}
    />
  );
}



