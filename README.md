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
| **Cloud Calculator** | Link to the AI & Media cost planner on `cloudcalculator.fde-demo.com` (see below) |

## Cloudinary Site

Cloudinary lives on its own subdomain (`cloudinary.fde-demo.com`) rather than
as a tab — a searchable, filterable catalog of 36 Cloudinary demos plus
capabilities, URL transformation examples, and SDK integration. Built from the
same codebase via a second Vite entry point (`cloudinary.html`).

## Cloud Calculator Site

The **Cloud Calculator** tab links to `cloudcalculator.fde-demo.com`, which
serves the Linode AI & Media Cost Planner: a self-contained page that estimates
monthly and first-year cost for AI and Media AI workloads on Akamai Cloud.

| Path | What it is |
|------|------------|
| `tools/cloud-calculator/src/` | Source of truth: `src.html` (UI), `engine.js` (cost engine), `prices.json` (price book and change log), `presets.js` (use-case library) |
| `tools/cloud-calculator/build.mjs` | Inlines prices, engine and presets into one HTML document |
| `tools/cloud-calculator/sync/sync-prices.mjs` | Refreshes `prices.json` from the public pricing API (logic in `sync/diff.mjs`, mapping in `sync/mapping.json`) |
| `tools/cloud-calculator/test/` | `engine.test.mjs` pins hand-calculated figures; `sync.test.mjs` checks the sync against saved API fixtures |
| `.github/workflows/cloud-prices.yml` | Daily price sync, commit and deploy |
| `public/cloud-calculator/index.html` | Generated (git-ignored); copied by Vite to `dist/cloud-calculator/index.html` |

`npm run build` and `npm run dev` regenerate the page automatically
(`npm run build:calculator` does it on its own). `npm test` runs the engine
and sync checks. Do not edit the generated file; change `tools/cloud-calculator/src/`
and rebuild. Set `MAIN_SITE_URL` when building to change the planner's
"Back to Media Solutions" link (default `https://mediademo.fde-demo.com/`).

### Price sync

Prices live in `tools/cloud-calculator/src/prices.json`, which the build
injects as `PRICE_BOOK` ahead of `engine.js`. It holds `asOf` (date of the
last change), `plans`, `dbPlans`, `rates` and `changes` (newest first; the
Price book tab shows the latest 20 rows). Every entry has `sync`:

- `api`: refreshed from the unauthenticated Akamai Cloud (Linode) API
  (`linode/types`, `databases/types`, `lke/types`, `nodebalancers/types`,
  `object-storage/types`, `network-transfer/prices`, `volumes/types`). Plans
  and database plans carry their `apiId`; rate mappings are in
  `sync/mapping.json`. Base prices only; regional surcharges are not modeled.
- `manual`: not in the API, kept by hand and marked "manual" on the Price
  book tab. Today: RTX PRO 6000 Blackwell (`bw-*`), `objIncludedGB`,
  `nbPremiumPerGB` and `managedPerInstance`.

The sync diffs every mapped value, applies changes, adds new plans the API
lists in covered families (GPU, VPU, G8, G7, shared, high memory; keyed by
API id), flags API ids that disappear with `missingSince` instead of deleting
them, and appends one `changes` entry only when something changed. A run with
no changes leaves the file untouched. It writes nothing and exits 1 if a
request fails or returns malformed data, if more than 20% of mapped items are
missing, or if any price moves by more than ±50% (`--allow-large` accepts a
real large move).

Run it by hand:

```bash
node tools/cloud-calculator/sync/sync-prices.mjs --dry-run   # show the delta only
node tools/cloud-calculator/sync/sync-prices.mjs             # update prices.json
npm test && npm run build:calculator
```

Other options: `--summary <file>` (Markdown delta), `--fixtures <dir>` (read
saved responses instead of the API), `--date YYYY-MM-DD`.

To change a manual item, edit its value in `prices.json` and commit it. To
take an API-synced item over by hand, set its `sync` to `"manual"` (and add a
`note`); the sync then leaves it alone. To stop a new API plan from being
added, put its id in `ignoreIds` in `sync/mapping.json`. A plan's `name`,
`spec` and `line` can be edited freely; only `hr`, `mo` and `tb` are synced.
Presets reference plan keys, so never rename a key that a preset uses.

**Schedule.** `.github/workflows/cloud-prices.yml` runs daily at 11:00
America/New_York (cron at 15:00 and 16:00 UTC; a first step keeps the one
that is 11:00 local, so it holds across daylight saving) and on manual
dispatch (Actions, "Cloud calculator prices", Run workflow, which skips the
time gate). When prices changed it runs `npm test`, builds only the
calculator page, commits `prices.json` to `main` as
`chore(akamai): sync cloud prices YYYY-MM-DD`, uploads the page with rsync
over SSH to `cloud-calculator/index.html` and opens an issue with the
summary. When a guard trips it opens an issue with the output and deploys
nothing.

Repository secrets the workflow needs:

| Secret | Value |
|--------|-------|
| `DEPLOY_SSH_KEY` | Private key for the `deploy` user. Restrict it on the server with `rrsync` rooted at `/var/www/mediademo` (for example `command="rrsync /var/www/mediademo",restrict ssh-ed25519 ...` in `authorized_keys`), which is why the remote path is relative |
| `DEPLOY_KNOWN_HOSTS` | The server's host key line(s), from `ssh-keyscan <host>` checked against the server |
| `DEPLOY_HOST` | Host name or IP of the web server |

The workflow pushes to `main` with the default `GITHUB_TOKEN`; if `main` is
protected, allow GitHub Actions to push or the commit step will fail (and
nothing is deployed).

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

### Cloudinary subdomain

The build produces two entry points into a single `dist/`:

| File | Site |
|------|------|
| `dist/index.html` | Main Akamai Media Solutions demo |
| `dist/cloudinary.html` | Cloudinary demos |

Both vhosts serve from the **same** document root — only the index file differs,
so assets are shared and there is nothing extra to copy.

```bash
cat > /etc/nginx/sites-available/cloudinary <<'NGINX'
server {
    listen 80;
    server_name cloudinary.fde-demo.com;
    root /var/www/mediademo;
    index cloudinary.html;

    location / {
        try_files $uri $uri/ /cloudinary.html;
    }

    location ~* \.(js|css|svg|png|jpg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/cloudinary /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Point a DNS `A` record for `cloudinary.fde-demo.com` at the Linode IP before
requesting a certificate.

Cross-site links are configurable via `.env`:

```bash
VITE_MAIN_SITE_URL=https://mediademo.fde-demo.com
VITE_CLOUDINARY_SITE_URL=https://cloudinary.fde-demo.com
```

### Cloud Calculator subdomain

The planner builds to `dist/cloud-calculator/index.html`, a single file with
no other assets (it loads only Google Fonts). Point a vhost at that
directory. HTML is not matched by the long-cache rule, so price refreshes show
up on the next request.

```bash
cat > /etc/nginx/sites-available/cloudcalculator <<'NGINX'
server {
    listen 80;
    server_name cloudcalculator.fde-demo.com;
    root /var/www/mediademo/cloud-calculator;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/cloudcalculator /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Point a DNS `A` record for `cloudcalculator.fde-demo.com` at the Linode IP
before requesting a certificate. If you add a Content-Security-Policy, this
vhost needs `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
`font-src https://fonts.gstatic.com`, and `script-src 'unsafe-inline'`.

### Optional: HTTPS with Let's Encrypt

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d mediademo.fde-demo.com
certbot --nginx -d cloudcalculator.fde-demo.com
```
