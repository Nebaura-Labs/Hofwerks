# Hofwerkz

Hofwerkz is a modern BMW datalogging and diagnostics suite focused on enthusiasts and tuners, starting with N55 platforms.

This repository contains:
- A native desktop app (Tauri + Rust + React) for cable-based logging and diagnostics workflows
- A native mobile app (Tauri + Rust + React) targeting iOS
- A web app (TanStack Start) for account, dashboard, and log visualization
- Shared packages for auth, API, env, and data infrastructure

## Product Focus

Hofwerkz is designed to replace fragmented tooling with a single workflow:
- Connect to vehicle via K+DCAN/serial adapter
- Record and inspect datalogs
- Read and clear DTCs
- Export/share logs and analyze data in web UI

For full product scope and roadmap, see `PRD.md`.

## Current Capabilities

Available in this repository:
- Native Tauri app shell with signed-in user flows
- Native datalogging screen with:
  - Serial port discovery
  - Hardware mode + simulator mode
  - Logging session start/stop
  - Live log polling from Rust backend
  - CSV export of recorded samples
- Native gauges and app mode navigation screens
- Web dashboard with authentication
- Web CSV log viewer with parameter selection and interactive charting
- Convex + Better Auth integration scaffolding

Planned or in progress:
- DTC read/clear backend is currently mocked in Rust
- Full BMW-specific protocol/channel coverage is still expanding
- Cloud log persistence and production analysis pipeline are not complete yet

## Monorepo Structure

```text
hofwerkz/
├── apps/
│   ├── web/                 # Web dashboard (TanStack Start + React)
│   ├── native/              # Desktop app (Tauri + React + Rust)
│   └── mobile/              # iOS app (Tauri + React + Rust)
├── packages/
│   ├── api/                 # oRPC procedures + shared API utilities
│   ├── auth/                # Better Auth + Convex proxy integration
│   ├── db/                  # Drizzle + Postgres setup
│   ├── env/                 # Typed environment validation
│   ├── config/              # Shared TS/Biome config
│   └── convex/              # Convex workspace task wrapper
├── convex/                  # Convex backend app + generated files
├── turbo.json
└── PRD.md
```

## Tech Stack

- Runtime/package manager: Bun
- Monorepo orchestration: Turborepo
- Native app: Tauri 2 + Rust + React + Vite
- Mobile app: Tauri 2 + Rust + React + Vite (iOS target)
- Web app: TanStack Start + React + Vite
- Auth: Better Auth + Convex integration
- API layer: oRPC
- DB tooling: Drizzle + PostgreSQL
- Lint/format: Ultracite (Biome)

## Prerequisites

- Bun `>=1.3`
- Node-compatible build toolchain for Vite
- Rust toolchain + Cargo (for native app)
- Tauri dependencies for your OS (macOS in your current setup)
- Convex account/project configured for backend runtime

## Setup

1. Install dependencies:

```bash
bun install
```

2. Configure environment files (minimum):
- `apps/web/.env` with at least `CONVEX_SITE_URL`
- Native/web auth env vars as required by Better Auth + Convex setup

3. Start Convex runtime (recommended during development):

```bash
bun run convex:dev
```

## Development Commands

Root scripts:

- `bun run dev`  
  Starts default lightweight dev stack (web + convex tasks via turbo).

- `bun run dev:all`  
  Starts all workspace `dev` tasks (includes native), with capped turbo concurrency.

- `bun run dev:web`  
  Starts only web dev task.

- `bun run dev:native`  
  Starts only native (Tauri) dev task.

- `bun run dev:mobile`  
  Starts only mobile (Tauri) dev task.

- `bun run build`  
  Runs monorepo builds through turbo.

- `bun run check-types`  
  Runs type checks through turbo.

- `bun run check`  
  Runs Ultracite checks.

- `bun run fix`  
  Runs Ultracite autofixes.

- `bun run clean:native`  
  Cleans native Rust build artifacts (`cargo clean`) to reclaim disk space.

- `bun run clean:mobile`  
  Cleans mobile Rust build artifacts (`cargo clean`) to reclaim disk space.

- `bun run mobile:ios:init`  
  Initializes iOS project files for `apps/mobile`.

- `bun run mobile:ios:dev`  
  Runs the mobile app on iOS in dev mode.

- `bun run mobile:ios:build`  
  Builds the mobile app for iOS.

Convex scripts:

- `bun run convex:dev`
- `bun run convex:codegen`
- `bun run convex:deploy`

## Native App Notes

- Rust build artifacts can become large in debug mode (`apps/native/src-tauri/target`).
- Use `bun run clean:native` when disk usage grows.
- Native app code:
  - Frontend: `apps/native/src`
  - Rust backend commands: `apps/native/src-tauri/src/lib.rs`

## Quality Standards

This repo uses Ultracite and strict project standards (see `AGENTS.md`).

Useful commands:

```bash
bun run check
bun run fix
```

## Roadmap Alignment

High-level roadmap and feature phases are defined in `PRD.md` (v0.1.0, last updated February 17, 2026). The current codebase is in early execution of that plan, with strongest progress in:
- Native logging workflow foundation
- Web auth/dashboard experience
- Shared monorepo platform setup
