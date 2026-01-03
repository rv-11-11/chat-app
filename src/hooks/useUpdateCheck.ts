import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import * as Application from 'expo-application';
import { apiClient } from '../services/api/client';

export const useUpdateCheck = () => {
  useEffect(() => {
    if (__DEV__) return;

    const checkUpdate = async () => {
      try {
        const res = await apiClient.get('/version');
        const { latestVersion, downloadUrl } = res.data;
        const currentVersion = Application.nativeApplicationVersion || '1.0.0';

        // Simple semantic version check (assumes x.y.z)
        if (latestVersion && latestVersion !== currentVersion) {
           Alert.alert(
             'Update Available',
             `A new version (${latestVersion}) is available.`,
             [
               { text: 'Later', style: 'cancel' },
               { text: 'Update', onPress: () => Linking.openURL(downloadUrl) }
             ]
           );
        }
      } catch (e) {
        console.log('Update check failed', e);
      }
    };

    checkUpdate();
  }, []);
};
