import { Image, ImageStyle } from 'expo-image';
import React, { useState } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeColors } from '../utils/theme';

interface SmartImageProps {
  source: string | { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: string | number; // Blurhash or local image
  fallbackElement?: React.ReactNode; // Component to show on error
  showLoadingIndicator?: boolean;
  transition?: number;
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
}

export const SmartImage: React.FC<SmartImageProps> = ({
  source,
  style,
  containerStyle,
  contentFit = 'cover',
  placeholder,
  fallbackElement,
  showLoadingIndicator = false,
  transition = 200,
  cachePolicy = 'memory-disk',
}) => {
  const colors = useThemeColors();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Normalize source
  const imageSource = typeof source === 'string' ? { uri: source } : source;

  if (hasError && fallbackElement) {
    return <View style={[styles.container, containerStyle, style]}>{fallbackElement}</View>;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        style={[styles.image, style]}
        source={imageSource}
        placeholder={placeholder}
        contentFit={contentFit}
        transition={transition}
        cachePolicy={cachePolicy}
        onLoadStart={() => {
          setIsLoading(true);
          setHasError(false);
        }}
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          console.log('SmartImage error:', e.error);
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {isLoading && showLoadingIndicator && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
