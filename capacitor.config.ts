import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chefwise.app',
  appName: 'Chefwise',
  webDir: 'out',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
  },
  android: {
    backgroundColor: '#ffffff',
  },
  plugins: {
    Camera: {
      presentationStyle: 'popover',
    },
  },
};

export default config;
