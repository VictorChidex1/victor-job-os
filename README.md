# Victor's Job OS

A private, serverless opportunity intelligence and career operations platform. It discovers relevant developer opportunities, normalizes and deduplicates them, qualifies them against Victor's profile, researches the company, matches verified portfolio proof, and prepares personalized outreach — all in one dashboard.

## Tech Stack

- **React 19 + Vite 8 + TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first config, `@tailwindcss/vite`)
- **shadcn/ui** (Base UI primitives, Nova preset, lucide icons)
- **Motion** (Framer Motion's current form)
- **React Router v7**
- **Firebase** — Authentication, Cloud Firestore, Cloud Functions, Hosting

## Getting Started

```bash
npm install
npm run emulators   # start local Firebase emulators (auth 9099, firestore 8080, UI 4000)
npm run dev         # dev server on http://localhost:5173
```

Local development runs against the Firebase emulators. Production builds target real Firebase.

## Environment Variables

Env files are split by Vite mode:

- `.env` — shared Firebase web-app client config (loaded in all modes)
- `.env.development` — emulator toggle for `npm run dev`
- `.env.production` — emulator toggle for `npm run build`

Copy `.env.example` to `.env` and fill in your Firebase project values. Firebase client config is intentionally public; privileged credentials (service accounts, AI/email/ATS secrets) stay server-side in Cloud Functions and never appear in the client.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | oxlint |
| `npm run preview` | Preview the production build |
| `npm run emulators` | Start Firebase emulators |
| `npm run emulators:exec` | Run a command against running emulators |

## Status

- **Phase 1 (Foundation): done** — Vite/React/TS scaffold, Tailwind v4, shadcn/ui (Base UI), Motion, React Router v7 with V1 route map, Firebase SDK + emulators, production env split, deny-by-default Firestore rules deployed.
- **Phase 2 (Application Shell): next** — global layout, navigation, authentication, dashboard shell.

## Architecture

The platform follows a source-agnostic architecture: ATS adapters (Greenhouse, Lever, Ashby) normalize jobs into a common model, an AI layer (provider-independent) handles qualification/research/drafting, and Firestore is the system of record. See `project-explanations/` for the full project overview, UI/UX spec, and engineering context.