import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useThemeColors } from '../utils/theme';
import { SmartImage } from './SmartImage';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ViewStyle;
  isOnline?: boolean;
  showStatus?: boolean;
  showLoading?: boolean;
  shape?: 'circle' | 'square' | 'rounded';
  onPress?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = '?',
  size = 40,
  style,
  imageStyle,
  isOnline = false,
  showStatus = false,
  shape = 'circle',
  showLoading = false,
  onPress,
}) => {
  const colors = useThemeColors();

  const getInitials = (fullName: string) => {
    return fullName
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(name);
  const fontSize = size * 0.4;
  
  const borderRadius = shape === 'circle' ? size / 2 : shape === 'rounded' ? size / 4 : 0;

  const Fallback = (
    <View
      style={[
        styles.fallbackContainer,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: colors.primary + '20', // 20% opacity
        },
        imageStyle,
      ]}
    >
      <Text
        style={[
          styles.initialsText,
          {
            fontSize,
            color: colors.primary,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, style, { width: size, height: size }]}>
      {uri ? (
        <SmartImage
          source={uri}
          containerStyle={{ width: '100%', height: '100%', borderRadius }}
          style={[{ width: '100%', height: '100%' }, imageStyle]}
          contentFit="cover"
          fallbackElement={Fallback}
          cachePolicy="memory-disk"
          showLoadingIndicator={showLoading}
        />
      ) : (
        Fallback
      )}
      {showStatus && (
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: isOnline ? '#22c55e' : '#94a3b8',
              borderColor: colors.background,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initialsText: {
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
