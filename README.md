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

## Deploy to Linode

### Prerequisites

- A Linode instance (Ubuntu/Debian) with SSH access
- A domain/hostname pointed to the Linode IP
- Node.js 18+ installed on the server (or build locally and copy `dist/`)

### Option 1: Build locally, deploy static files

```bash
# Build production bundle
npm run build

# Copy dist to server
scp -r dist/* root@<LINODE_IP>:/var/www/mediademo/

# SSH into server and configure nginx
ssh root@<LINODE_IP>
```

### Option 2: Build on server

```bash
ssh root@<LINODE_IP>

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Clone and build
git clone https://github.com/thesaiki/MediaDemo.git /opt/mediademo
cd /opt/mediademo
npm install
cp .env.example .env   # Edit with your keys
npm run build
```

### Nginx configuration

```bash
apt-get install -y nginx

cat > /etc/nginx/sites-available/mediademo <<'NGINX'
server {
    listen 80;
    server_name mediademo.fde-demo.com;
    root /var/www/mediademo;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|svg|png|jpg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/mediademo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### Optional: HTTPS with Let's Encrypt

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d mediademo.fde-demo.com
```
