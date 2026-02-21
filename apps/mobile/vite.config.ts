import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devHost = env.TAURI_DEV_HOST;
  const authProxyTarget =
    env.VITE_AUTH_URL ??
    env.CONVEX_SITE_URL ??
    "https://basic-hound-820.convex.site";

  return {
    clearScreen: false,
    plugins: [tsconfigPaths(), react(), tailwindcss()],
    server: {
      host: devHost ?? false,
      port: 1422,
      strictPort: true,
      proxy: {
        "/api/auth": {
          target: authProxyTarget,
          changeOrigin: true,
          cookieDomainRewrite: "",
          cookiePathRewrite: "/",
          secure: true,
        },
      },
      hmr: devHost
        ? {
            protocol: "ws",
            host: devHost,
            port: 1423,
          }
        : undefined,
      watch: {
        ignored: ["**/src-tauri/**"],
      },
    },
  };
});
