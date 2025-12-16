import { ENV } from '../config/env';
import apiClient from '../services/api/client';

export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/health');
    console.log('✅ Backend connection successful:', response.data);
    return true;
  } catch (error: any) {
    console.error('❌ Backend connection failed:', error.message);
    console.log('Backend URL:', ENV.API_URL);
    return false;
  }
};


