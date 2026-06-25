# Akamai Media Solutions Demo

Single-page demo application showcasing Akamai's media delivery stack — from encoding and packaging through CDN delivery to end-user playback and analytics.

## Tabs

| Tab | Description |
|-----|-------------|
| **Media 101** | Core media fundamentals — containers, codecs, streaming protocols, ABR, and DRM |
| **VOD Architecture** | VOD reference architecture with basic and JITP pipeline variants |
| **Live Architecture** | Live streaming reference architecture with MSL5 details and multi-format players |
| **Encoding** | Video encoding pipeline with Bitmovin on Akamai Cloud — interactive VOD/Live demo |
| **Video Player** | Akamai Media Player v2 (AMP v2) powered by Bitmovin |
| **Virtual Channels** | Virtual channel creation with Unified Streaming — architecture and EPG views |
| **MCAP** | Multi-CDN Anti-Piracy — token auth, abuse detection, and revocation |
| **Analytics** | MediaMelon SDK integration with embeddable dashboard |
| **Cloudinary** | Cloudinary Video Manager — transformations, player, and DAM |

## Getting Started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in your keys to activate player, dashboards, and demo portals.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Bitmovin Player SDK (AMP v2)
- MediaMelon SmartStreaming SDK

## Build

```bash
npm run build
```
