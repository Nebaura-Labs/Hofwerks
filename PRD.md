# Hofwerks — Product Requirements Document

> **Version:** 0.1.0  
> **Author:** Jonah Hoffman  
> **Last Updated:** February 17, 2026  
> **Status:** Planning

---

## Overview

**Hofwerks** is a modern BMW datalogging and diagnostics suite built for enthusiasts and tuners. Starting with N55 support, it provides real-time data visualization, log recording, DTC management, and cloud-based log sharing with AI-powered analysis.

The name "Hofwerks" combines the German word "Hof" (court/workshop) with "werks" (works) — a nod to both the founder's name (Hoffman) and German automotive heritage.

---

## Problem Statement

Current BMW datalogging tools are:
- **Outdated** — Most Windows-only software looks like it's from 2005
- **Fragmented** — Logging, code reading, and tune flashing require separate apps
- **No macOS support** — Tuners on Mac have limited options
- **Poor sharing** — Logs are shared as raw CSV files or forum attachments
- **No AI analysis** — Users must manually interpret knock events, AFR deviations, etc.

**Hofwerks solves this** by providing a modern, cross-platform suite with cloud sync and AI-powered log analysis.

---

## Target Users

### Primary: BMW N55 Enthusiasts
- 335i/435i/535i owners (F30, F32, F10)
- M235i, X3/X4 35i, 135i (E82) owners
- Running Stage 1-3 tunes (MHD, bootmod3, etc.)
- Want to monitor knock, AFR, boost during pulls
- Share logs with tuners for remote support

### Secondary: Professional Tuners
- Need to view customer logs remotely
- Want white-label options
- Require bulk log management

---

## Supported Vehicles (v1.0)

| Engine | DME | Vehicles |
|--------|-----|----------|
| N55 | MEVD17.2 | 335i (F30), 435i (F32), 535i (F10), M235i (F22) |
| N55 | MEVD17.2.G | X3 35i (F25), X4 35i (F26) |
| N55 | MSD80/81 | 135i (E82), 335i (E90/E92) — stretch goal |

**Future expansion:** B58, S55, N54, S58

---

## Core Features

### v1.0 — Desktop App (Q2 2026)

#### Datalogging
- [ ] Serial port connection (K+DCAN cable)
- [ ] Real-time gauge display (boost, AFR, timing, IAT, oil temp, coolant)
- [ ] Configurable PID selection
- [ ] Recording to local log files (.hfwlog format + CSV export)
- [ ] Live graphing with zoom/pan

#### Diagnostics
- [ ] Read DTCs (fault codes)
- [ ] Clear DTCs
- [ ] View freeze frame data
- [ ] Live sensor data stream

#### Cloud Sync
- [ ] User accounts (Better Auth)
- [ ] Upload logs to cloud
- [ ] Generate shareable links (like datazap)
- [ ] Log history and management

#### UI/UX
- [ ] Dark mode (default)
- [ ] Customizable gauge layouts
- [ ] Drag-and-drop gauge positioning
- [ ] Full-screen data mode

### v2.0 — Web Dashboard + Mobile (Q3 2026)

#### Web
- [ ] View logs in browser
- [ ] Share public log links
- [ ] User profiles (public garage)
- [ ] Embeddable widgets for forums

#### AI Analysis
- [ ] Automatic knock detection alerts
- [ ] AFR deviation warnings
- [ ] Timing pull analysis
- [ ] "What's wrong with my car?" natural language queries
- [ ] Comparison tool (before/after tune)

#### Mobile (Companion)
- [ ] View synced logs
- [ ] Push notifications (log uploaded, AI alert)
- [ ] Quick share to social

### v3.0 — Mobile Logging (Q4 2026)

- [ ] Bluetooth OBD adapter support
- [ ] Live logging on phone
- [ ] Standard OBD-II PIDs first
- [ ] BMW-specific enhanced PIDs

### v4.0 — Advanced Features (2027)

- [ ] Tune flashing (if protocol cracked)
- [ ] Map switching
- [ ] Tuner collaboration tools
- [ ] White-label for shops

---

## Technical Architecture

### Monorepo Structure

```
hofwerks/
├── apps/
│   ├── web/              # TanStack Start (dashboard)
│   ├── desktop/          # Tauri 2.0 (logging app)
│   └── mobile/           # Tauri mobile (companion)
├── packages/
│   ├── db/               # Drizzle + Postgres
│   ├── auth/             # Better Auth
│   ├── api/              # oRPC
│   ├── ui/               # shadcn components
│   ├── protocols/        # BMW K-line/CAN protocols
│   └── analysis/         # AI log analysis
└── turbo.json
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Desktop** | Tauri 2.0 + React + Rust |
| **Web** | TanStack Start |
| **Mobile** | Tauri 2.0 (iOS/Android) |
| **Backend** | Self-hosted (oRPC) |
| **Database** | PostgreSQL + Drizzle |
| **Auth** | Better Auth |
| **Payments** | Polar |
| **Storage** | Cloudflare R2 |
| **AI** | Claude API |
| **Serial** | `serialport` Rust crate |

### Data Flow

```
┌─────────────┐     K+DCAN      ┌─────────────┐
│   BMW DME   │ ◄─────────────► │   Desktop   │
└─────────────┘                 │    App      │
                                └──────┬──────┘
                                       │ Upload
                                       ▼
                                ┌─────────────┐
                                │   Cloud     │
                                │   Backend   │
                                └──────┬──────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
             ┌──────────┐       ┌──────────┐       ┌──────────┐
             │   Web    │       │  Mobile  │       │  Tuner   │
             │Dashboard │       │   App    │       │  Portal  │
             └──────────┘       └──────────┘       └──────────┘
```

---

## N55 Protocol Details

### Connection
- **Interface:** K+DCAN cable (FTDI-based USB adapter)
- **Protocol:** ISO 14230-4 (KWP2000) over K-line + UDS over CAN
- **Baud:** 10400 (K-line) / 500kbps (CAN)

### Key PIDs (MEVD17.2)

| PID | Description | Unit |
|-----|-------------|------|
| `0x0394` | Boost Pressure Actual | mbar |
| `0x0395` | Boost Pressure Target | mbar |
| `0x4801` | Ignition Timing Cyl 1-6 | ° |
| `0x4804` | Knock Retard Cyl 1-6 | ° |
| `0x1001` | AFR Bank 1 | λ |
| `0x1002` | AFR Bank 2 | λ |
| `0x0600` | IAT | °C |
| `0x0398` | Oil Temperature | °C |
| `0x0397` | Coolant Temperature | °C |
| `0x0005` | Engine RPM | rpm |
| `0x000C` | Vehicle Speed | km/h |
| `0x0011` | Throttle Position | % |

*Note: PIDs may vary by DME variant. Testing required.*

---

## Competitive Analysis

| Feature | Hofwerks | MHD | bootmod3 | JB4 Mobile |
|---------|----------|-----|----------|------------|
| macOS Support | ✅ | ❌ | ❌ | ❌ |
| Modern UI | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Cloud Sync | ✅ | ❌ | ✅ | ❌ |
| Log Sharing | ✅ | ❌ | ⚠️ | ❌ |
| AI Analysis | ✅ | ❌ | ❌ | ❌ |
| Free Tier | ✅ | ❌ | ❌ | ✅ |
| Tune Flashing | 🔜 | ✅ | ✅ | N/A |

---

## Monetization

### Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Desktop app, local logging, 5 cloud logs |
| **Pro** | $9/mo | Unlimited cloud, AI analysis, public profile |
| **Tuner** | $29/mo | White-label, client management, API access |

### Revenue Projections

| Milestone | Users | MRR |
|-----------|-------|-----|
| Launch | 100 | $500 |
| 6 months | 500 | $2,500 |
| 12 months | 2,000 | $10,000 |

---

## Timeline

### Phase 1: Foundation (Feb-Mar 2026)
- [x] Define PRD
- [ ] Register hofwerks.com
- [ ] Set up monorepo (Better-T stack)
- [ ] Basic Tauri desktop shell
- [ ] Serial port connection in Rust

### Phase 2: Core Logging (Apr-May 2026)
- [ ] K+DCAN protocol implementation
- [ ] N55 PID definitions
- [ ] Real-time gauge UI
- [ ] Log recording
- [ ] Local file storage

### Phase 3: Cloud & Sharing (Jun 2026)
- [ ] User auth
- [ ] Log upload
- [ ] Shareable links
- [ ] Web dashboard

### Phase 4: AI & Polish (Jul 2026)
- [ ] AI log analysis
- [ ] Public launch
- [ ] Payment integration

---

## Success Metrics

| Metric | Target (6 months) |
|--------|-------------------|
| Downloads | 1,000 |
| Active Users | 500 |
| Logs Uploaded | 5,000 |
| Paid Subscribers | 50 |
| NPS Score | 40+ |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Protocol reverse-engineering complexity | High | Start with standard OBD PIDs, add enhanced later |
| MHD/bm3 already dominate market | Medium | Differentiate with macOS, AI, modern UX |
| Low adoption | Medium | Free tier, open-source core logger |
| BMW legal concerns | Low | Don't touch flashing initially, logging is safe |

---

## Open Questions

1. Should the log format be open/documented for interoperability?
2. Partner with existing tuners (Wedge, BMP, etc.) for protocol help?
3. Support standalone K-line vs. require ENET for newer cars?
4. White-label branding for tuner shops?

---

## Appendix

### Glossary

- **K+DCAN:** BMW diagnostic cable using K-line and CAN protocols
- **DME:** Digital Motor Electronics (BMW's ECU)
- **MEVD17.2:** Bosch ECU used in N55 engines
- **PID:** Parameter ID for OBD data
- **KWP2000:** Keyword Protocol 2000 (ISO 14230)
- **UDS:** Unified Diagnostic Services (ISO 14229)

### References

- [N55 Technical Guide](https://www.n54tech.com/forums/)
- [BMW E-sys Documentation](https://www.bimmerpost.com/)
- [Tauri 2.0 Docs](https://tauri.app/)
- [serialport-rs](https://github.com/serialport/serialport-rs)

---

*Hofwerks — Master your BMW.* 🔧
