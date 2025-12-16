import { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { LANGUAGES } from "@/constants";
import ThemeSelector from "@/components/theme-selector";
import NotificationsPanel from "@/components/notifications-panel";
import { Download, Bell, Languages, Palette, X } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const {
    language,
    setLanguage,
    autoDownloadPhotos,
    autoDownloadVideos,
    autoDownloadDocuments,
    setAutoDownloadPhotos,
    setAutoDownloadVideos,
    setAutoDownloadDocuments,
  } = useSettings();

  const { t } = useI18n();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute right-0 top-0 p-2 rounded-lg hover:bg-base-200 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold mb-2 text-base-content pr-12">
            {t("settings.title", "Settings")}
          </h1>
          <p className="text-base-content/70">
            {t(
              "settings.subtitle",
              "Customize your chat app experience"
            )}
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 h-fit lg:sticky lg:top-4">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {[
                {
                  id: "general",
                  labelKey: "settings.tab.general",
                  defaultLabel: "General",
                  icon: Palette,
                },
                {
                  id: "notifications",
                  labelKey: "settings.tab.notifications",
                  defaultLabel: "Notifications",
                  icon: Bell,
                },
                {
                  id: "downloads",
                  labelKey: "settings.tab.downloads",
                  defaultLabel: "Auto Downloads",
                  icon: Download,
                },
                {
                  id: "language",
                  labelKey: "settings.tab.language",
                  defaultLabel: "Language",
                  icon: Languages,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left whitespace-nowrap lg:w-full ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-content"
                        : "text-base-content/80 hover:bg-base-200"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">
                      {t(tab.labelKey, tab.defaultLabel)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl p-8 border border-base-300 bg-base-200">
              {/* General Tab - Theme */}
              {activeTab === "general" && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-base-content">
                    {t("settings.appearance.title", "Appearance")}
                  </h2>
                  <ThemeSelector />
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-base-content">
                    {t(
                      "settings.notifications.title",
                      "Notification Settings"
                    )}
                  </h2>
                  <NotificationsPanel />
                </div>
              )}

              {/* Auto Downloads Tab */}
              {activeTab === "downloads" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-6 text-base-content">
                      {t(
                        "settings.autoDownloads.title",
                        "Auto Download Settings"
                      )}
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {/* Photos Download */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-base-300 bg-base-100 hover:bg-base-200 transition-colors">
                      <div>
                        <h3 className="font-semibold">
                          {t(
                            "settings.autoDownloads.photos.title",
                            "Auto-download Photos"
                          )}
                        </h3>
                        <p className="text-sm text-base-content/70">
                          {t(
                            "settings.autoDownloads.photos.description",
                            "Automatically download incoming photos"
                          )}
                        </p>
                      </div>
                      <Switch
                        checked={autoDownloadPhotos}
                        onCheckedChange={setAutoDownloadPhotos}
                      />
                    </div>

                    {/* Videos Download */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-base-300 bg-base-100 hover:bg-base-200 transition-colors">
                      <div>
                        <h3 className="font-semibold">
                          {t(
                            "settings.autoDownloads.videos.title",
                            "Auto-download Videos"
                          )}
                        </h3>
                        <p className="text-sm text-base-content/70">
                          {t(
                            "settings.autoDownloads.videos.description",
                            "Automatically download incoming videos"
                          )}
                        </p>
                      </div>
                      <Switch
                        checked={autoDownloadVideos}
                        onCheckedChange={setAutoDownloadVideos}
                      />
                    </div>

                    {/* Documents Download */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-base-300 bg-base-100 hover:bg-base-200 transition-colors">
                      <div>
                        <h3 className="font-semibold">
                          {t(
                            "settings.autoDownloads.documents.title",
                            "Auto-download Documents"
                          )}
                        </h3>
                        <p className="text-sm text-base-content/70">
                          {t(
                            "settings.autoDownloads.documents.description",
                            "Automatically download incoming documents"
                          )}
                        </p>
                      </div>
                      <Switch
                        checked={autoDownloadDocuments}
                        onCheckedChange={setAutoDownloadDocuments}
                      />
                    </div>

                    <div className="p-4 rounded-lg bg-primary/10">
                      <p className="text-sm text-primary">
                        {t(
                          "settings.autoDownloads.tip",
                          "Tip: Auto-download settings will help save your mobile data while keeping your favorite files accessible."
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Language Tab */}
              {activeTab === "language" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-6 text-base-content">
                      {t(
                        "settings.language.title",
                        "Language Preferences"
                      )}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`p-3 rounded-lg border-2 transition text-left ${
                          language === lang
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-base-300 hover:border-base-400"
                        }`}
                      >
                        <span className="font-medium">{lang}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg bg-success/10">
                    <p className="text-sm text-success">
                      ✓ {t(
                        "settings.language.currentLabel",
                        "Current Language"
                      )}: <strong>{language}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
