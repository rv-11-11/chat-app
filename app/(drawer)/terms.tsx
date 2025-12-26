import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useThemeColors } from '../../src/utils/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as WebBrowser from 'expo-web-browser';
import { ENV } from '../../src/config/env';

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

      <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <FontAwesome name="info-circle" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Below are our Terms of Use and Privacy Policy. For a full Privacy Policy with the latest updates, open the external policy.
        </Text>
      </View>

      <View style={styles.sectionsGrid}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionBadge, { backgroundColor: '#f59e0b' + '20' }]}>
            <FontAwesome name="file-text" size={12} color="#f59e0b" />
            <Text style={[styles.sectionBadgeText, { color: '#f59e0b' }]}>Terms of Use</Text>
          </View>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            By using this app, you agree to the following:
          </Text>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            • Use the service lawfully and respectfully.{"\n"}
            • Do not harass, abuse, or spam other users.{"\n"}
            • Do not share illegal content, incite harm, or violate intellectual property rights.{"\n"}
            • You are responsible for your account and content you post.{"\n"}
            • We may moderate, suspend, or remove content or accounts that violate these terms.{"\n"}
            • The service is provided “as is” without warranties; liability is limited to the maximum extent permitted.
          </Text>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            We may update these terms as the app evolves. Continued use after changes constitutes acceptance of the updated terms.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionBadge, { backgroundColor: '#10b981' + '20' }]}>
            <FontAwesome name="shield" size={12} color="#10b981" />
            <Text style={[styles.sectionBadgeText, { color: '#10b981' }]}>Privacy Policy</Text>
          </View>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            We collect only the data required to provide messaging, channels, and community features.
          </Text>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            Data we process includes account data (name, email, username), content you create (messages, media), and limited diagnostics for reliability.
          </Text>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            We use your data to deliver core features, maintain security, prevent abuse, and comply with legal obligations. We do not sell your data.
          </Text>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            Cookies and local storage may be used for session management, preferences, and authentication. Notifications are optional and can be controlled in settings.
          </Text>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            You can request data access or deletion, control notifications, and manage your account. For privacy requests, contact support.
          </Text>
          <TouchableOpacity
            onPress={() => WebBrowser.openBrowserAsync(`${ENV.API_URL}/legal/privacy`)}
            style={[styles.sectionLinkButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.sectionLinkButtonText, { color: colors.primaryForeground }]}>
              Open full Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionBadge, { backgroundColor: '#0ea5e9' + '20' }]}>
            <FontAwesome name="balance-scale" size={12} color="#0ea5e9" />
            <Text style={[styles.sectionBadgeText, { color: '#0ea5e9' }]}>User Agreement</Text>
          </View>
          <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
            By creating an account or using the service you accept these terms and our privacy practices. If you do not agree, please discontinue use and contact support for account closure.
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
  sectionLinkButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sectionLinkButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
