import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useThemeColors } from '../../src/utils/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TermsScreen() {
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
            try {
              navigation.goBack();
            } catch {
              router.replace('/(tab)/chat');
            }
          }}
          style={[styles.closeButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="times" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Terms & privacy
        </Text>
      </View>

      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <FontAwesome name="info-circle" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          This page is a **template**. Replace the text below with your real legal copy
          before going to production.
        </Text>
      </View>

      <View style={styles.sectionsGrid}>
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.sectionBadge, { backgroundColor: '#f59e0b' + '20' }]}>
            <FontAwesome name="file-text" size={12} color="#f59e0b" />
            <Text style={[styles.sectionBadgeText, { color: '#f59e0b' }]}>
              Terms of use
            </Text>
          </View>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            This application is provided for messaging and community use. By using the app
            you agree to follow all applicable laws, respect other users, and avoid abusive,
            illegal, or spam behaviour.
          </Text>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.sectionBadge, { backgroundColor: '#10b981' + '20' }]}>
            <FontAwesome name="shield" size={12} color="#10b981" />
            <Text style={[styles.sectionBadgeText, { color: '#10b981' }]}>Privacy</Text>
          </View>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            Messages and account data are processed only as needed to deliver chat,
            channels, and notifications. You should customise this section with your real
            privacy policy, including how long you keep data and how users can request
            deletion.
          </Text>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.sectionBadge, { backgroundColor: '#0ea5e9' + '20' }]}>
            <FontAwesome name="balance-scale" size={12} color="#0ea5e9" />
            <Text style={[styles.sectionBadgeText, { color: '#0ea5e9' }]}>
              User agreement
            </Text>
          </View>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            By creating an account or using the service you accept these terms. Replace
            this with your official agreement text (acceptable use, liability, contact
            email, etc.) when you are ready to launch.
          </Text>
        </View>
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
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingRight: 50,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionsGrid: {
    gap: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
