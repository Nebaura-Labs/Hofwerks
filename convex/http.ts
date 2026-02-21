import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./betterAuth/auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: [
      "http://localhost:1420",
      "http://127.0.0.1:1420",
      "http://localhost:1422",
      "http://127.0.0.1:1422",
      "http://10.0.0.238:1422",
      "tauri://localhost",
      "http://tauri.localhost",
      "https://tauri.localhost",
    ],
  },
});

export default http;
