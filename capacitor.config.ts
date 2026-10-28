import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.ninoai",
  appName: "Nino AI",
  webDir: "public",
  server: {
    url: "https://nino-apk-studio.lovable.app",
    cleartext: false,
    // Sem internet: abre o Nino offline embutido no app.
    errorPath: "offline.html",
  },
};

export default config;
