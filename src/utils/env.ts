import Constants from 'expo-constants';

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = Constants.expoConfig?.extra?.[key];
  return value || defaultValue || '';
};

export const ENV = {
  API_URL: getEnvVar('apiUrl', 'https://chat-app-qwrr.onrender.com'),
  SOCKET_URL: getEnvVar('socketUrl', 'https://chat-app-qwrr.onrender.com'),
  CLOUDINARY_CLOUD_NAME: getEnvVar('CLOUDINARY_CLOUD_NAME', 'dy8qfihsz'),
  CLOUDINARY_API_KEY: getEnvVar('CLOUDINARY_API_KEY', '842725345293151'),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
} as const;

