import axios from 'axios';
import { ENV } from '../config/env';

export const testBackendConnection = async (): Promise<boolean> => {
  try {
    console.log('[Backend Test] Testing connection to:', ENV.API_URL);
    console.log('[Backend Test] Full health check URL:', `${ENV.API_URL}/health`);
    
    // Use axios directly to hit /health endpoint (not /api/health)
    const response = await axios.get(`${ENV.API_URL}/health`, {
      timeout: 10000, // Increased timeout for Render
    });
    
    console.log('✅ Backend connection successful:', response.data);
    console.log('[Backend Test] Response status:', response.status);
    console.log('[Backend Test] Using Render backend:', ENV.API_URL.includes('render.com'));
    return true;
  } catch (error: any) {
    console.error('❌ Backend connection failed:', error.message);
    console.error('[Backend Test] Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.status,
      responseData: error.response?.data,
    });
    console.log('[Backend Test] Attempted URL:', ENV.API_URL);
    console.log('[Backend Test] Full attempted URL:', `${ENV.API_URL}/health`);
    return false;
  }
};

export const logBackendConfig = (): void => {
  console.log('=== Backend Configuration ===');
  console.log('API_URL:', ENV.API_URL);
  console.log('SOCKET_URL:', ENV.SOCKET_URL);
  console.log('Is Render backend:', ENV.API_URL.includes('render.com'));
  console.log('Is localhost:', ENV.API_URL.includes('localhost') || ENV.API_URL.includes('127.0.0.1'));
  console.log('=============================');
};


