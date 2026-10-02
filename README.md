# Atlas Forensics

Free AI-content forensics (AI image detector, AI text detector, C2PA Content Credentials checker), EN + FR.
Production: https://atlaslab-forensics.vercel.app

Stack: Next.js 16 (App Router, static pages) · Hive AI-generated content detection (v2 sync API) · Cloudflare Turnstile · Upstash Redis (REST) · `@contentauth/c2pa-web` (client-side) · Vercel.

## Structure

- `app/(en)`, `app/(fr)/fr` — two root layouts (correct `<html lang>`), all pages statically generated from `lib/content.ts`
- `app/api/analyze` — validation → Turnstile → rate limits (per-IP minute/day, global day) → Hive
- `app/api/lead` — waitlists (`waitlist:{pro|api|video|deepfake}` Redis sets)
- `lib/analysis.ts` — Hive calls, response parsing, verdict normalization (AI_LIKELY / INDETERMINATE / NO_SUFFICIENT_AI_SIGNAL)
- `lib/c2pa-client.ts` — browser-side C2PA reading (Wasm from jsDelivr, version pinned to package.json)

## Environment

See `.env.example`. In production the API **fails closed** (HTTP 503) if Hive key, Turnstile secret, Upstash or `RATE_LIMIT_SALT` are missing — no fabricated results.
`NEXT_PUBLIC_*` values are inlined at build time: redeploy after changing them.

Hive: `HIVE_API_KEY` is a self-serve V3 key (thehive.ai → Service API Keys) and powers the image detector (default quota ~100 req/day → `DAILY_GLOBAL_LIMIT=90`). AI **text** detection is only offered as a V2 Enterprise project → `HIVE_TEXT_API_KEY`; Without it, `WINSTON_API_KEY` (Winston AI, self-serve, EN/FR, 1 credit per word, prepaid) powers the text detector; with neither, the text detector shows an honest "not available yet" notice. Text has its own daily cap (`DAILY_TEXT_GLOBAL_LIMIT`, default 150).

## Local

```bash
npm install
HIVE_MOCK=1 npm run dev   # labelled fake results, dev only; Turnstile/Redis bypassed when unset
npm run typecheck && npm run build
```

Waitlist export: `SMEMBERS waitlist:pro` in the Upstash console. Usage metrics: `metrics:YYYY-MM-DD:*` keys (image_scans, text_scans, err_*, lead_*).
