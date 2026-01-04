import Constants from 'expo-constants';

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = Constants.expoConfig?.extra?.[key];
  return value || defaultValue || '';
};

export const ENV = {
  API_URL: getEnvVar('apiUrl', 'http://localhost:8000'),
  SOCKET_URL: getEnvVar('socketUrl', 'http://localhost:8000'),
  CLOUDINARY_CLOUD_NAME: getEnvVar('CLOUDINARY_CLOUD_NAME', 'dy8qfihsz'),
  CLOUDINARY_API_KEY: getEnvVar('CLOUDINARY_API_KEY', '842725345293151'),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  GOOGLE_WEB_CLIENT_ID: getEnvVar('googleWebClientId', '170631155124-jt38kvf290u2pa6dht834bmblv527tsq.apps.googleusercontent.com'),
  GOOGLE_IOS_CLIENT_ID: getEnvVar('googleIosClientId', ''),
  GOOGLE_ANDROID_CLIENT_ID: getEnvVar('googleAndroidClientId', '70631155124-38er02pg8ve6ar9ts6h2u0udhk3hgek3.apps.googleusercontent.com'),
} as const;
