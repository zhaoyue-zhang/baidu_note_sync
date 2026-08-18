import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.local.baidunotes',
  appName: '网盘笔记',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
