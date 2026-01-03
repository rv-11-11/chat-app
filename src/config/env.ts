import Constants from 'expo-constants';

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = Constants.expoConfig?.extra?.[key];
  return value || defaultValue || '';
};

export const ENV = {
  API_URL: getEnvVar('apiUrl', 'https://chat-app-qwrr.onrender.com'),
  SOCKET_URL: getEnvVar('socketUrl', 'https://chat-app-qwrr.onrender.com'),
  CLOUDINARY_CLOUD_NAME: getEnvVar('CLOUDINARY_CLOUD_NAME', ''),
  CLOUDINARY_API_KEY: getEnvVar('CLOUDINARY_API_KEY', ''),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  GOOGLE_WEB_CLIENT_ID: getEnvVar('googleWebClientId', ''),
  GOOGLE_IOS_CLIENT_ID: getEnvVar('googleIosClientId', ''),
  GOOGLE_ANDROID_CLIENT_ID: getEnvVar('googleAndroidClientId', ''),
} as const;
