module.exports = {
  expo: {
    name: 'BaşarıYolu',
    slug: 'basariyolu',
    version: '1.0.2',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    // Disable New Architecture for stability
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.basariyolu',
    },
    android: {
      package: 'com.basariyolu',
      versionCode: 3,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      // Read from environment variables (injected by EAS Secrets)
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      appUrl: process.env.EXPO_PUBLIC_APP_URL,
    },
  },
};
