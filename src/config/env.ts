import Constants from 'expo-constants';

// Render backend URL - this is the production backend
const RENDER_BACKEND_URL = 'https://chat-app-qwrr.onrender.com';

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = Constants.expoConfig?.extra?.[key];
  
  // Debug logging
  if (key === 'apiUrl' || key === 'socketUrl') {
    console.log(`[ENV Debug] ${key}:`, {
      'Constants.expoConfig?.extra?.[key]': value,
      'defaultValue': defaultValue,
      'Constants.expoConfig exists': !!Constants.expoConfig,
      'Constants.expoConfig.extra exists': !!Constants.expoConfig?.extra,
    });
  }
  
  let result = value || defaultValue || '';
  
  // FORCE Render URL for apiUrl and socketUrl - always use Render backend
  if (key === 'apiUrl' || key === 'socketUrl') {
    // If result contains localhost or doesn't contain render.com, force Render URL
    if (result && (result.includes('localhost') || result.includes('127.0.0.1') || result.includes('10.0.2.2') || !result.includes('render.com'))) {
      console.warn(`[ENV] ${key} is not Render URL (${result}), forcing Render backend URL: ${RENDER_BACKEND_URL}`);
      return RENDER_BACKEND_URL;
    }
    // If no value is set, use Render URL as default
    if (!result) {
      return RENDER_BACKEND_URL;
    }
  }
  
  return result;
};

export const ENV = {
  API_URL: getEnvVar('apiUrl', RENDER_BACKEND_URL),
  SOCKET_URL: getEnvVar('socketUrl', RENDER_BACKEND_URL),
  CLOUDINARY_CLOUD_NAME: getEnvVar('CLOUDINARY_CLOUD_NAME', 'dy8qfihsz'),
  CLOUDINARY_API_KEY: getEnvVar('CLOUDINARY_API_KEY', '842725345293151'),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  GOOGLE_WEB_CLIENT_ID: getEnvVar('googleWebClientId', '170631155124-jt38kvf290u2pa6dht834bmblv527tsq.apps.googleusercontent.com'),
  GOOGLE_IOS_CLIENT_ID: getEnvVar('googleIosClientId', ''),
  GOOGLE_ANDROID_CLIENT_ID: getEnvVar('googleAndroidClientId', '70631155124-38er02pg8ve6ar9ts6h2u0udhk3hgek3.apps.googleusercontent.com'),
} as const;

// Log the backend URL being used
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  console.log('[ENV Config] API_URL:', ENV.API_URL);
  console.log('[ENV Config] SOCKET_URL:', ENV.SOCKET_URL);
  console.log('[ENV Config] Using Render backend:', ENV.API_URL.includes('render.com'));
}
