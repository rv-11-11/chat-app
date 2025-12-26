import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useThemeColors } from '../../src/utils/theme';
import { useI18nWithSettings,LANGUAGES } from '../../src/utils/i18n';
import ThemeSelector from '../../src/components/ThemeSelector';
import NotificationsPanel from '../../src/components/NotificationsPanel';
import Switch from '../../src/components/Switch';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type TabId = 'general' | 'notifications' | 'downloads' | 'language';

const tabs = [
  {
    id: 'general' as TabId,
    labelKey: 'settings.tab.general',
    defaultLabel: 'General',
    icon: 'tint',
  },
  {
    id: 'notifications' as TabId,
    labelKey: 'settings.tab.notifications',
    defaultLabel: 'Notifications',
    icon: 'bell',
  },
  {
    id: 'downloads' as TabId,
    labelKey: 'settings.tab.downloads',
    defaultLabel: 'Auto Downloads',
    icon: 'download',
  },
  {
    id: 'language' as TabId,
    labelKey: 'settings.tab.language',
    defaultLabel: 'Language',
    icon: 'language',
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { t } = useI18nWithSettings();
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const {
    language,
    setLanguage,
    autoDownloadPhotos,
    autoDownloadVideos,
    autoDownloadDocuments,
    setAutoDownloadPhotos,
    setAutoDownloadVideos,
    setAutoDownloadDocuments,
  } = useSettingsStore();

  useEffect(() => {
    // Load settings on mount
    useSettingsStore.getState().loadSettings();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
          {t('settings.title', 'Settings')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t('settings.subtitle', 'Customize your chat app experience')}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContainer}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: colors.primary },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <FontAwesome
                  name={tab.icon as any}
                  size={20}
                  color={isActive ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? colors.primaryForeground : colors.foreground,
                    },
                  ]}
                >
                  {t(tab.labelKey, tab.defaultLabel)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Content Area */}
        <ScrollView
          style={styles.contentArea}
          contentContainerStyle={styles.contentScroll}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.contentCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* General Tab - Theme */}
            {activeTab === 'general' && (
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {t('settings.appearance.title', 'Appearance')}
                </Text>
                <ThemeSelector />
              </View>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {t('settings.notifications.title', 'Notification Settings')}
                </Text>
                <NotificationsPanel />
              </View>
            )}

            {/* Auto Downloads Tab */}
            {activeTab === 'downloads' && (
              <View style={styles.downloadsSection}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {t('settings.autoDownloads.title', 'Auto Download Settings')}
                </Text>

                <View style={styles.downloadsList}>
                  {/* Photos Download */}
                  <View
                    style={[
                      styles.downloadItem,
                      {
                        backgroundColor: colors.muted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.downloadItemContent}>
                      <Text style={[styles.downloadItemTitle, { color: colors.foreground }]}>
                        {t(
                          'settings.autoDownloads.photos.title',
                          'Auto-download Photos'
                        )}
                      </Text>
                      <Text
                        style={[styles.downloadItemDescription, { color: colors.mutedForeground }]}
                      >
                        {t(
                          'settings.autoDownloads.photos.description',
                          'Automatically download incoming photos'
                        )}
                      </Text>
                    </View>
                    <Switch
                      checked={autoDownloadPhotos}
                      onCheckedChange={setAutoDownloadPhotos}
                    />
                  </View>

                  {/* Videos Download */}
                  <View
                    style={[
                      styles.downloadItem,
                      {
                        backgroundColor: colors.muted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.downloadItemContent}>
                      <Text style={[styles.downloadItemTitle, { color: colors.foreground }]}>
                        {t(
                          'settings.autoDownloads.videos.title',
                          'Auto-download Videos'
                        )}
                      </Text>
                      <Text
                        style={[styles.downloadItemDescription, { color: colors.mutedForeground }]}
                      >
                        {t(
                          'settings.autoDownloads.videos.description',
                          'Automatically download incoming videos'
                        )}
                      </Text>
                    </View>
                    <Switch
                      checked={autoDownloadVideos}
                      onCheckedChange={setAutoDownloadVideos}
                    />
                  </View>

                  {/* Documents Download */}
                  <View
                    style={[
                      styles.downloadItem,
                      {
                        backgroundColor: colors.muted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.downloadItemContent}>
                      <Text style={[styles.downloadItemTitle, { color: colors.foreground }]}>
                        {t(
                          'settings.autoDownloads.documents.title',
                          'Auto-download Documents'
                        )}
                      </Text>
                      <Text
                        style={[styles.downloadItemDescription, { color: colors.mutedForeground }]}
                      >
                        {t(
                          'settings.autoDownloads.documents.description',
                          'Automatically download incoming documents'
                        )}
                      </Text>
                    </View>
                    <Switch
                      checked={autoDownloadDocuments}
                      onCheckedChange={setAutoDownloadDocuments}
                    />
                  </View>

                  <View
                    style={[
                      styles.tipBox,
                      { backgroundColor: colors.primary + '20' },
                    ]}
                  >
                    <Text style={[styles.tipText, { color: colors.primary }]}>
                      {t(
                        'settings.autoDownloads.tip',
                        'Tip: Auto-download settings will help save your mobile data while keeping your favorite files accessible.'
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <View style={styles.languageSection}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {t('settings.language.title', 'Language Preferences')}
                </Text>

                <View style={styles.languageGrid}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.languageButton,
                        {
                          borderColor:
                            language === lang ? colors.primary : colors.border,
                          backgroundColor:
                            language === lang ? colors.primary + '20' : 'transparent',
                        },
                      ]}
                      onPress={() => setLanguage(lang)}
                    >
                      <Text
                        style={[
                          styles.languageButtonText,
                          {
                            color: language === lang ? colors.primary : colors.foreground,
                            fontWeight: language === lang ? '600' : '500',
                          },
                        ]}
                      >
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View
                  style={[
                    styles.currentLanguageBox,
                    { backgroundColor: '#10b981' + '20' },
                  ]}
                >
                  <Text style={[styles.currentLanguageText, { color: '#10b981' }]}>
                    ✓ {t('settings.language.currentLabel', 'Current Language')}:{' '}
                    <Text style={{ fontWeight: 'bold' }}>{language}</Text>
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 24,
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingRight: 50,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  tabScroll: {
    maxHeight: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
  },
  contentScroll: {
    padding: 16,
  },
  contentCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  downloadsSection: {
    gap: 24,
  },
  downloadsList: {
    gap: 16,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  downloadItemContent: {
    flex: 1,
    marginRight: 16,
  },
  downloadItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  downloadItemDescription: {
    fontSize: 14,
  },
  tipBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  tipText: {
    fontSize: 14,
  },
  languageSection: {
    gap: 24,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    maxHeight: 400,
  },
  languageButton: {
    width: '47%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  languageButtonText: {
    fontSize: 14,
  },
  currentLanguageBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  currentLanguageText: {
    fontSize: 14,
  },
});
