import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.blessedautospares.app',
  appName: 'Blessed Auto Spares',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // For development: uncomment and set your local IP
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
}

export default config
