# WITI Viral Vision — AI Product Video Generator for Wix

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Replicate](https://img.shields.io/badge/Replicate-AI%20Video-purple.svg)](https://replicate.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://mongodb.com)
[![Wix Apps](https://img.shields.io/badge/Wix-App%20Market-black.svg)](https://dev.wix.com)
[![WITI Ecosystem](https://img.shields.io/badge/WITI-Ecosystem-orange.svg)](https://sanadidari.com/witi)

> **WITI Viral Vision** generates product videos automatically for Wix stores using Replicate AI. Merchants select a product, choose a video style, and the app produces a ready-to-publish video — no editing skills required. Built with a credit-based system for sustainable usage.

---

## Features

- **AI video generation** — Replicate-powered product video creation from store catalog
- **Wix Stores integration** — Reads live product data via Wix SDK OAuthStrategy
- **Credit system** — Per-store usage tracking with MongoDB persistence
- **OAuth installation** — Secure Wix app installation flow with signed instance verification
- **Store management** — Multi-store support with per-instance data isolation

---

## Architecture

```
witi-viral-vision/
└── server/
    ├── index.js      # Express API — OAuth, video generation, store management
    ├── models.js     # Mongoose schemas (Store, Video)
    └── dist/         # Frontend build (Wix iframe UI)
```

**API Routes:**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Service status + DB + Replicate check |
| GET | `/api/wix/callback` | OAuth installation callback |
| GET | `/api/wix/instance` | Decode Wix signed instance |
| POST | `/api/generate-video` | Trigger AI video generation |
| GET | `/api/stores` | List connected stores |
| GET | `/api/products` | Fetch live Wix store products |
| GET | `/api/videos` | List generated videos per store |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| AI Model | Replicate (video generation) |
| Database | MongoDB + Mongoose |
| Platform | Wix App Market SDK |
| Store API | @wix/stores + OAuthStrategy |
| Auth | Wix Signed Instance (HMAC SHA256) |

---

## Setup

```bash
cd server
npm install
cp .env.example .env
# Fill in: REPLICATE_API_TOKEN, MONGODB_URI, WIX_APP_ID, WIX_APP_SECRET
node index.js
```

---

## Part of the WITI Ecosystem

| Product | Description |
|---------|-------------|
| [QRPruf](https://github.com/sanadidari/qrpruf) | Zero-trust proof-of-presence protocol |
| [Governance Platform](https://github.com/sanadidari/governance-platform) | Judicial management for Morocco |
| [NOUR Mobile](https://github.com/sanadidari/nour-mobile) | Field agent app for judicial officers |

---

*Built by [Samir Chatwiti](https://sanadidari.com) · Sanadidari SARL*
