import Constants from 'expo-constants';

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = Constants.expoConfig?.extra?.[key];
  return value || defaultValue || '';
};

export const ENV = {
  API_URL: getEnvVar('apiUrl', 'http://localhost:9000'),
  SOCKET_URL: getEnvVar('socketUrl', 'http://localhost:9000'),
  CLOUDINARY_CLOUD_NAME: getEnvVar('CLOUDINARY_CLOUD_NAME', ''),
  CLOUDINARY_API_KEY: getEnvVar('CLOUDINARY_API_KEY', ''),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
} as const;

