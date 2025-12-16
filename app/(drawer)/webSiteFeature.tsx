import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useThemeColors } from '../../src/utils/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const featureCards = [
  {
    title: 'Real-time chat',
    description: 'Fast direct messages and group chats that update in real time.',
    icon: 'comment',
    accent: '#3b82f6',
  },
  {
    title: 'Groups & channels',
    description: 'Broadcast updates to large audiences or run tight-knit groups.',
    icon: 'bullhorn',
    accent: '#a855f7',
  },
  {
    title: 'Communities',
    description: 'Organise conversations by topic and build your own community.',
    icon: 'users',
    accent: '#10b981',
  },
  {
    title: 'Notifications',
    description: 'Smart in-app notifications with unread counts and a bell in the header.',
    icon: 'bell',
    accent: '#f59e0b',
  },
  {
    title: 'Auto downloads',
    description:
      'Control auto-download for photos, videos, and documents to save your data.',
    icon: 'download',
    accent: '#06b6d4',
  },
  {
    title: 'Languages',
    description: 'Use the app in English, Hindi, Spanish, or Arabic.',
    icon: 'language',
    accent: '#f43f5e',
  },
  {
    title: 'Invite friends',
    description: 'Share a personal invite link so friends can join you quickly.',
    icon: 'share-alt',
    accent: '#84cc16',
  },
];

export default function WebsiteFeaturesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            // Navigate back to main screen
            try {
              navigation.goBack();
            } catch (error) {
              // Fallback: navigate to drawer index which redirects to tabs
              router.replace('/(drawer)/index');
            }
          }}
          style={[styles.closeButton, { backgroundColor: colors.muted }]}
        >
          <FontAwesome name="times" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Website features
        </Text>
      </View>

      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        This app is designed to feel like a modern messaging experience with powerful
        tools for chats, channels, and communities.
      </Text>

      <View style={styles.featuresGrid}>
        {featureCards.map((feature, index) => (
          <View
            key={index}
            style={[
              styles.featureCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: feature.accent + '20' },
              ]}
            >
              <FontAwesome name={feature.icon as any} size={20} color={feature.accent} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>
                {feature.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.tipBox,
          {
            borderColor: colors.primary + '60',
            backgroundColor: colors.primary + '10',
          },
        ]}
      >
        <Text style={[styles.tipText, { color: colors.primary }]}>
          You can extend this page any time with screenshots, demo videos, pricing, or a
          public roadmap to showcase what's new and what is coming next.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingRight: 50,
  },
  description: {
    fontSize: 14,
    marginBottom: 32,
    lineHeight: 20,
  },
  featuresGrid: {
    gap: 16,
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  tipBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  tipText: {
    fontSize: 12,
  },
});
