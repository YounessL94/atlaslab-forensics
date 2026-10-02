# Atlas Forensics

Free AI-content forensics (AI image detector, AI text detector, C2PA Content Credentials checker), EN + FR.
Production: https://forensics.atlaslab.io

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

Hive issues one API key per project: create an "AI-Generated Image and Video Detection" project and an "AI-Generated Text Detection" project and set `HIVE_IMAGE_API_KEY` / `HIVE_TEXT_API_KEY`.

## Local

```bash
npm install
HIVE_MOCK=1 npm run dev   # labelled fake results, dev only; Turnstile/Redis bypassed when unset
npm run typecheck && npm run build
```

Waitlist export: `SMEMBERS waitlist:pro` in the Upstash console.
