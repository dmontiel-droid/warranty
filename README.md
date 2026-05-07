# Warranty Claims Dashboard

Daily monitoring dashboard for Kanguro's warranty claims (label ID 29, claim type 1).

## Stack
- **Next.js 14** (App Router)
- **Vercel KV** (Redis) — stores latest snapshot + 30-day history
- **Vercel** — hosting

---

## Setup

### 1. Deploy to Vercel

```bash
npm i -g vercel
cd warranty-dash
vercel
```

### 2. Add Vercel KV

In your Vercel project dashboard:
- Go to **Storage** → **Create Database** → **KV**
- Link it to your project → Vercel auto-injects `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`

### 3. Set environment variables

In Vercel dashboard → Settings → Environment Variables:

```
INGEST_SECRET = <pick any strong random string>
```

---

## Shortcut Integration

Your daily shortcut should POST to:

```
POST https://<your-vercel-domain>/api/ingest
Authorization: Bearer <INGEST_SECRET>
Content-Type: application/json

{
  "claims": [ ...array of raw CI claim objects... ]
}
```

The shortcut already fetches from:
```
/ci/admin/api/v1/claim_types/1/claims/?labels.id=29
```

Collect ALL pages (all statusId 0–4), merge into one array, POST once.

### Expected claim object shape (from CI API)
```json
{
  "prefixedId": "PET-12345",
  "claimant": { "firstName": "John", "lastName": "Doe" },
  "incidentType": { "name": "Respiratory System" },
  "claimHandling": { "statusId": 1, "handler": { "name": "malvarez" } },
  "submittedAt": "2024-10-26T02:05:54.000Z"
}
```

---

## Alert logic

Claims with `daysOpen >= 7` AND status Open/Not Handled/New Info are highlighted in red with ⚠.

To change the threshold, edit `THRESHOLD_DAYS` in `components/DashboardClient.tsx`.

---

## Local dev

```bash
cp .env.example .env.local
# Fill in KV credentials from Vercel dashboard
npm install
npm run dev
```
