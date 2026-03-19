import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.byteforge.securegateway',
  appName: 'Secure Gateway',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
