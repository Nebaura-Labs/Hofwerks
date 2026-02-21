import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const isHttpUrl = (value: string): boolean => {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
};

const trimTrailingSlash = (value: string): string => {
  return value.replace(/\/+$/, "");
};

const resolveAuthBaseURL = (): string => {
  const runtimeOrigin = globalThis.location?.origin;
  const envBaseUrl = import.meta.env.VITE_AUTH_BASE_URL ?? import.meta.env.VITE_AUTH_URL;

  // In dev, prefer same-origin auth calls so Vite proxy handles /api/auth
  // and we avoid iOS CORS/preflight edge cases.
  if (import.meta.env.DEV && typeof runtimeOrigin === "string" && isHttpUrl(runtimeOrigin)) {
    return trimTrailingSlash(runtimeOrigin);
  }

  if (typeof envBaseUrl === "string" && isHttpUrl(envBaseUrl)) {
    return trimTrailingSlash(envBaseUrl);
  }

  if (typeof runtimeOrigin === "string" && isHttpUrl(runtimeOrigin)) {
    return trimTrailingSlash(runtimeOrigin);
  }

  return "http://localhost:1422";
};

export const authBaseURL = resolveAuthBaseURL();

export const authRuntimeOrigin =
  typeof globalThis.location?.origin === "string"
    ? globalThis.location.origin
    : "unknown";

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [crossDomainClient(), convexClient()],
});
