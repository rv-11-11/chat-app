import axios from 'axios';
import { ENV } from '../config/env';

export const testBackendConnection = async (): Promise<boolean> => {
  try {
    // Use axios directly to hit /health endpoint (not /api/health)
    const response = await axios.get(`${ENV.API_URL}/health`, {
      timeout: 5000,
    });
    console.log('✅ Backend connection successful:', response.data);
    return true;
  } catch (error: any) {
    console.error('❌ Backend connection failed:', error.message);
    console.log('Backend URL:', ENV.API_URL);
    return false;
  }
};


