import { createClient } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import schema from "./schema";

export const authComponent = createClient<DataModel, typeof schema>(
  components.betterAuth,
  {
    local: { schema },
    verbose: false,
  },
);

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  const siteUrl =
    process.env.CONVEX_SITE_URL ??
    process.env.SITE_URL ??
    "https://basic-hound-820.convex.site";
  const isSecureCookieContext = siteUrl.startsWith("https://");

  return {
    appName: "Hofwerks",
    baseURL: siteUrl,
    secret:
      process.env.BETTER_AUTH_SECRET ??
      "development-secret-change-me-development-secret-change-me",
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: [
      "http://localhost:1420",
      "http://127.0.0.1:1420",
      "http://10.0.0.238:1420",
      "http://localhost:1422",
      "http://127.0.0.1:1422",
      "http://10.0.0.238:1422",
      "tauri://localhost",
      "http://tauri.localhost",
      "https://tauri.localhost",
      siteUrl,
    ],
    advanced: {
      defaultCookieAttributes: {
        sameSite: isSecureCookieContext ? "none" : "lax",
        secure: isSecureCookieContext,
      },
    },
    plugins: [crossDomain({ siteUrl }), convex({ authConfig })],
  } satisfies BetterAuthOptions;
};

export const options = createAuthOptions({} as GenericCtx<DataModel>);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};
