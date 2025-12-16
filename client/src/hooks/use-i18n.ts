import { useSettings } from "@/hooks/use-settings";

type LanguageCode = "en" | "hi" | "es" | "ar";

const LANGUAGE_NAME_TO_CODE: Record<string, LanguageCode> = {
  english: "en",
  hindi: "hi",
  spanish: "es",
  arabic: "ar",
};

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.chat": "Chat",
    "nav.groups": "Groups",
    "nav.channel": "Channel",
    "nav.community": "Community",

    "settings.title": "Settings",
    "settings.subtitle": "Customize your chat app experience",
    "settings.tab.general": "General",
    "settings.tab.notifications": "Notifications",
    "settings.tab.downloads": "Auto Downloads",
    "settings.tab.language": "Language",

    "settings.appearance.title": "Appearance",
    "settings.notifications.title": "Notification Settings",
    "settings.autoDownloads.title": "Auto Download Settings",
    "settings.autoDownloads.photos.title": "Auto-download Photos",
    "settings.autoDownloads.photos.description": "Automatically download incoming photos",
    "settings.autoDownloads.videos.title": "Auto-download Videos",
    "settings.autoDownloads.videos.description": "Automatically download incoming videos",
    "settings.autoDownloads.documents.title": "Auto-download Documents",
    "settings.autoDownloads.documents.description": "Automatically download incoming documents",
    "settings.autoDownloads.tip":
      "Tip: Auto-download settings will help save your mobile data while keeping your favorite files accessible.",

    "settings.language.title": "Language Preferences",
    "settings.language.currentLabel": "Current Language",

    "home.title": "Home",
    "home.section.chats": "Chats",
    "home.section.channels": "Channels",
    "home.badge.public": "Public",
    "home.chats.noMessages": "No messages yet",
    "home.channels.subscribersSuffix": "subscribers",
  },
  hi: {
    "nav.home": "होम",
    "nav.chat": "चैट",
    "nav.groups": "समूह",
    "nav.channel": "चैनल",
    "nav.community": "कम्युनिटी",

    "settings.title": "सेटिंग्स",
    "settings.subtitle": "अपने चैट एप का अनुभव अपनी भाषा में सेट करें",
    "settings.tab.general": "जनरल",
    "settings.tab.notifications": "नोटिफिकेशन",
    "settings.tab.downloads": "ऑटो डाउनलोड",
    "settings.tab.language": "भाषा",

    "settings.appearance.title": "दिखावट",
    "settings.notifications.title": "नोटिफिकेशन सेटिंग्स",
    "settings.autoDownloads.title": "ऑटो डाउनलोड सेटिंग्स",
    "settings.autoDownloads.photos.title": "फोटो ऑटो-डाउनलोड",
    "settings.autoDownloads.photos.description":
      "आने वाली फोटो अपने आप डाउनलोड हों",
    "settings.autoDownloads.videos.title": "वीडियो ऑटो-डाउनलोड",
    "settings.autoDownloads.videos.description":
      "आने वाले वीडियो अपने आप डाउनलोड हों",
    "settings.autoDownloads.documents.title": "डॉक्युमेंट ऑटो-डाउनलोड",
    "settings.autoDownloads.documents.description":
      "आने वाले डॉक्युमेंट अपने आप डाउनलोड हों",
    "settings.autoDownloads.tip":
      "टिप: ऑटो-डाउनलोड सेटिंग्स आपके मोबाइल डेटा को बचाने में मदद करती हैं और जरूरी फाइलें उपलब्ध रखती हैं।",

    "settings.language.title": "भाषा पसंद",
    "settings.language.currentLabel": "चुनी हुई भाषा",

    "home.title": "होम",
    "home.section.chats": "चैट",
    "home.section.channels": "चैनल",
    "home.badge.public": "पब्लिक",
    "home.chats.noMessages": "अभी तक कोई संदेश नहीं",
    "home.channels.subscribersSuffix": "सब्सक्राइबर",
  },
  es: {
    "nav.home": "Inicio",
    "nav.chat": "Chat",
    "nav.groups": "Grupos",
    "nav.channel": "Canal",
    "nav.community": "Comunidad",

    "settings.title": "Configuración",
    "settings.subtitle": "Personaliza tu experiencia en la aplicación de chat",
    "settings.tab.general": "General",
    "settings.tab.notifications": "Notificaciones",
    "settings.tab.downloads": "Descargas automáticas",
    "settings.tab.language": "Idioma",

    "settings.appearance.title": "Apariencia",
    "settings.notifications.title": "Configuración de notificaciones",
    "settings.autoDownloads.title": "Configuración de descargas automáticas",
    "settings.autoDownloads.photos.title": "Descarga automática de fotos",
    "settings.autoDownloads.photos.description": "Descargar automáticamente las fotos recibidas",
    "settings.autoDownloads.videos.title": "Descarga automática de videos",
    "settings.autoDownloads.videos.description": "Descargar automáticamente los videos recibidos",
    "settings.autoDownloads.documents.title": "Descarga automática de documentos",
    "settings.autoDownloads.documents.description": "Descargar automáticamente los documentos recibidos",
    "settings.autoDownloads.tip":
      "Consejo: Las descargas automáticas ayudan a ahorrar datos móviles y mantener tus archivos favoritos accesibles.",

    "settings.language.title": "Preferencias de idioma",
    "settings.language.currentLabel": "Idioma actual",

    "home.title": "Inicio",
    "home.section.chats": "Chats",
    "home.section.channels": "Canales",
    "home.badge.public": "Público",
    "home.chats.noMessages": "Aún no hay mensajes",
    "home.channels.subscribersSuffix": "suscriptores",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.chat": "الدردشة",
    "nav.groups": "المجموعات",
    "nav.channel": "القناة",
    "nav.community": "المجتمع",

    "settings.title": "الإعدادات",
    "settings.subtitle": "خصّص تجربتك في تطبيق الدردشة",
    "settings.tab.general": "عام",
    "settings.tab.notifications": "الإشعارات",
    "settings.tab.downloads": "التنزيل التلقائي",
    "settings.tab.language": "اللغة",

    "settings.appearance.title": "المظهر",
    "settings.notifications.title": "إعدادات الإشعارات",
    "settings.autoDownloads.title": "إعدادات التنزيل التلقائي",
    "settings.autoDownloads.photos.title": "التنزيل التلقائي للصور",
    "settings.autoDownloads.photos.description":
      "تنزيل الصور الواردة بشكل تلقائي",
    "settings.autoDownloads.videos.title": "التنزيل التلقائي للفيديوهات",
    "settings.autoDownloads.videos.description":
      "تنزيل الفيديوهات الواردة بشكل تلقائي",
    "settings.autoDownloads.documents.title": "التنزيل التلقائي للمستندات",
    "settings.autoDownloads.documents.description":
      "تنزيل المستندات الواردة بشكل تلقائي",
    "settings.autoDownloads.tip":
      "نصيحة: إعدادات التنزيل التلقائي تساعدك على توفير بيانات الجوال والاحتفاظ بملفاتك المفضّلة متاحة.",

    "settings.language.title": "تفضيلات اللغة",
    "settings.language.currentLabel": "اللغة الحالية",

    "home.title": "الرئيسية",
    "home.section.chats": "الدردشات",
    "home.section.channels": "القنوات",
    "home.badge.public": "عام",
    "home.chats.noMessages": "لا يوجد رسائل حتى الآن",
    "home.channels.subscribersSuffix": "مشتركين",
  },
};

function normalizeLanguageName(name?: string | null): string {
  return (name || "English").toLowerCase();
}

function getLanguageCode(language?: string | null): LanguageCode {
  const normalized = normalizeLanguageName(language);
  return LANGUAGE_NAME_TO_CODE[normalized] ?? "en";
}

export function useI18n() {
  const { language } = useSettings();
  const code = getLanguageCode(language);

  const t = (key: string, fallback: string): string => {
    const table = translations[code];
    return table?.[key] ?? fallback;
  };

  return { t, languageCode: code, language };
}
