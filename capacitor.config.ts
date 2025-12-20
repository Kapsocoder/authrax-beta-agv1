import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.92549d4ced4144799f9c428e2b62a3aa",
  appName: "PostPilot",
  webDir: "dist",
  server: {
    url: "https://92549d4c-ed41-4479-9f9c-428e2b62a3aa.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f0f0f",
      showSpinner: false,
    },
  },
};

export default config;
