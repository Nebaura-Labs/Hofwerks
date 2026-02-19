import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), viteReact()],
  ssr: {
    // Required so Better Auth framework helpers resolve correctly during SSR.
    noExternal: ["@better-auth/*", "better-auth", "@convex-dev/better-auth"],
  },
  server: {
    port: 3001,
  },
});
