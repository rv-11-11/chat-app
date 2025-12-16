import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  get: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting ${key} from secure storage:`, error);
      return null;
    }
  },

  set: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error setting ${key} to secure storage:`, error);
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing ${key} from secure storage:`, error);
    }
  },
};


