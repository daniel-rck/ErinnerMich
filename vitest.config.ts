import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// Tests run through the app's own Vite config, so its plugins, aliases and
// virtual modules resolve exactly as they do in the build.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      css: true,
      // web-base's owned setup first, then the app's (empty stores, no settings).
      setupFiles: ["./src/test/setup.ts", "./src/test/appSetup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
    },
  }),
);
