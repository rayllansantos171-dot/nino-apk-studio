import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.ninoai",
  appName: "Nino AI",
  webDir: "public",
  server: {
    url: "https://nino-apk-studio.lovable.app",
    cleartext: false,
  },
};

export default config;
