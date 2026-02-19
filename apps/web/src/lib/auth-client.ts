import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const authBaseURL =
  import.meta.env.VITE_AUTH_BASE_URL ??
  globalThis.location?.origin ??
  "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [convexClient()],
});
