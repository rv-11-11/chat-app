type LanguageCode = 'en' | 'hi' | 'es' | 'ar';

const LANGUAGE_NAME_TO_CODE: Record<string, LanguageCode> = {
  english: 'en',
  hindi: 'hi',
  spanish: 'es',
  arabic: 'ar',
};

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.chat': 'Chat',
    'nav.groups': 'Groups',
    'nav.channel': 'Channel',
    'nav.community': 'Community',
    'settings.title': 'Settings',
    'settings.subtitle': 'Customize your chat app experience',
    'settings.tab.general': 'General',
    'settings.tab.notifications': 'Notifications',
    'settings.tab.downloads': 'Auto Downloads',
    'settings.tab.language': 'Language',
    'settings.appearance.title': 'Appearance',
    'settings.notifications.title': 'Notification Settings',
    'settings.autoDownloads.title': 'Auto Download Settings',
    'settings.autoDownloads.photos.title': 'Auto-download Photos',
    'settings.autoDownloads.photos.description': 'Automatically download incoming photos',
    'settings.autoDownloads.videos.title': 'Auto-download Videos',
    'settings.autoDownloads.videos.description': 'Automatically download incoming videos',
    'settings.autoDownloads.documents.title': 'Auto-download Documents',
    'settings.autoDownloads.documents.description': 'Automatically download incoming documents',
    'settings.autoDownloads.tip': 'Tip: Auto-download settings will help save your mobile data while keeping your favorite files accessible.',
    'settings.language.title': 'Language Preferences',
    'settings.language.currentLabel': 'Current Language',
  },
  hi: {
    'nav.home': 'होम',
    'nav.chat': 'चैट',
    'nav.groups': 'समूह',
    'nav.channel': 'चैनल',
    'nav.community': 'समुदाय',
    'settings.title': 'सेटिंग्स',
    'settings.subtitle': 'अपने चैट ऐप अनुभव को अनुकूलित करें',
    'settings.tab.general': 'सामान्य',
    'settings.tab.notifications': 'सूचनाएं',
    'settings.tab.downloads': 'ऑटो डाउनलोड',
    'settings.tab.language': 'भाषा',
    'settings.appearance.title': 'दिखावट',
    'settings.notifications.title': 'सूचना सेटिंग्स',
    'settings.autoDownloads.title': 'ऑटो डाउनलोड सेटिंग्स',
    'settings.autoDownloads.photos.title': 'ऑटो-डाउनलोड फ़ोटो',
    'settings.autoDownloads.photos.description': 'आने वाली फ़ोटो स्वचालित रूप से डाउनलोड करें',
    'settings.autoDownloads.videos.title': 'ऑटो-डाउनलोड वीडियो',
    'settings.autoDownloads.videos.description': 'आने वाले वीडियो स्वचालित रूप से डाउनलोड करें',
    'settings.autoDownloads.documents.title': 'ऑटो-डाउनलोड दस्तावेज़',
    'settings.autoDownloads.documents.description': 'आने वाले दस्तावेज़ स्वचालित रूप से डाउनलोड करें',
    'settings.autoDownloads.tip': 'टिप: ऑटो-डाउनलोड सेटिंग्स आपके मोबाइल डेटा को बचाने में मदद करेंगी जबकि आपकी पसंदीदा फ़ाइलें सुलभ रहेंगी।',
    'settings.language.title': 'भाषा वरीयताएं',
    'settings.language.currentLabel': 'वर्तमान भाषा',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.chat': 'Chat',
    'nav.groups': 'Grupos',
    'nav.channel': 'Canal',
    'nav.community': 'Comunidad',
    'settings.title': 'Configuración',
    'settings.subtitle': 'Personaliza tu experiencia de chat',
    'settings.tab.general': 'General',
    'settings.tab.notifications': 'Notificaciones',
    'settings.tab.downloads': 'Descargas Automáticas',
    'settings.tab.language': 'Idioma',
    'settings.appearance.title': 'Apariencia',
    'settings.notifications.title': 'Configuración de Notificaciones',
    'settings.autoDownloads.title': 'Configuración de Descargas Automáticas',
    'settings.autoDownloads.photos.title': 'Descargar Fotos Automáticamente',
    'settings.autoDownloads.photos.description': 'Descargar automáticamente las fotos entrantes',
    'settings.autoDownloads.videos.title': 'Descargar Videos Automáticamente',
    'settings.autoDownloads.videos.description': 'Descargar automáticamente los videos entrantes',
    'settings.autoDownloads.documents.title': 'Descargar Documentos Automáticamente',
    'settings.autoDownloads.documents.description': 'Descargar automáticamente los documentos entrantes',
    'settings.autoDownloads.tip': 'Consejo: Las configuraciones de descarga automática ayudarán a ahorrar datos móviles mientras mantienen tus archivos favoritos accesibles.',
    'settings.language.title': 'Preferencias de Idioma',
    'settings.language.currentLabel': 'Idioma Actual',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.chat': 'الدردشة',
    'nav.groups': 'المجموعات',
    'nav.channel': 'القناة',
    'nav.community': 'المجتمع',
    'settings.title': 'الإعدادات',
    'settings.subtitle': 'خصص تجربة تطبيق الدردشة الخاص بك',
    'settings.tab.general': 'عام',
    'settings.tab.notifications': 'الإشعارات',
    'settings.tab.downloads': 'التنزيل التلقائي',
    'settings.tab.language': 'اللغة',
    'settings.appearance.title': 'المظهر',
    'settings.notifications.title': 'إعدادات الإشعارات',
    'settings.autoDownloads.title': 'إعدادات التنزيل التلقائي',
    'settings.autoDownloads.photos.title': 'تنزيل الصور تلقائياً',
    'settings.autoDownloads.photos.description': 'تنزيل الصور الواردة تلقائياً',
    'settings.autoDownloads.videos.title': 'تنزيل الفيديوهات تلقائياً',
    'settings.autoDownloads.videos.description': 'تنزيل الفيديوهات الواردة تلقائياً',
    'settings.autoDownloads.documents.title': 'تنزيل المستندات تلقائياً',
    'settings.autoDownloads.documents.description': 'تنزيل المستندات الواردة تلقائياً',
    'settings.autoDownloads.tip': 'نصيحة: ستساعد إعدادات التنزيل التلقائي في توفير بيانات الهاتف المحمول مع الحفاظ على ملفاتك المفضلة قابلة للوصول.',
    'settings.language.title': 'تفضيلات اللغة',
    'settings.language.currentLabel': 'اللغة الحالية',
  },
};

function getLanguageCode(language?: string | null): LanguageCode {
  if (!language) return 'en';
  const normalized = language.toLowerCase();
  return LANGUAGE_NAME_TO_CODE[normalized] ?? 'en';
}

// Helper function to use with settings store
// Import useSettingsStore directly to avoid circular dependency issues
let useSettingsStoreHook: any = null;

export function useI18nWithSettings() {
  // Lazy load the hook to avoid circular dependency
  if (!useSettingsStoreHook) {
    useSettingsStoreHook = require('../store/settingsStore').useSettingsStore;
  }
  
  const language = useSettingsStoreHook((state: any) => state.language);
  const code = getLanguageCode(language);

  const t = (key: string, fallback: string): string => {
    const table = translations[code];
    return table?.[key] ?? fallback;
  };

  return { t, languageCode: code, language };
}

export const LANGUAGES = ['English', 'Hindi', 'Spanish', 'Arabic'];

