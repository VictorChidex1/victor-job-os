# Victor's Job OS

A private, serverless opportunity intelligence and career operations platform. It discovers relevant developer opportunities, normalizes and deduplicates them, qualifies them against Victor's profile, researches the company, matches verified portfolio proof, and prepares personalized outreach and applications — all in one dashboard.

The system is built to optimize for qualified opportunities and useful actions, not raw job volume. AI can discover, research, qualify, draft, and prepare; sending outreach and submitting applications remain explicit human-approved actions.

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
npm run emulators   # auth 9099, Firestore 8080, Functions 5001, Emulator UI 4000
npm run dev         # dev server on http://localhost:5173
```

Local development runs against the Firebase emulators. Production builds target real Firebase.

## Environment Variables

Env files are split by Vite mode:

- `.env` — shared Firebase web-app client config (loaded in all modes)
- `.env.development` — emulator toggle for `npm run dev`
- `.env.production` — emulator toggle for `npm run build`

Copy `.env.example` to `.env` and fill in your Firebase project values. Firebase client config is intentionally public; privileged credentials (service accounts, AI/email/ATS secrets) stay server-side in Cloud Functions and never appear in the client.

Emulator ports default to:

| Service | Port |
|---|---|
| Auth | `9099` |
| Firestore | `8080` |
| Functions | `5001` |
| Emulator UI | `4000` |

## Scripts

### Development

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview the production build |

### Testing

| Script | Purpose |
|---|---|
| `npm run test` | Typecheck and run unit tests |
| `npm run test:typecheck` | Typecheck the test suite |
| `npm run test:integration` | Run integration tests against dedicated emulators |
| `npm run test:all` | Run unit and integration tests |

### Firebase Emulators

| Script | Purpose |
|---|---|
| `npm run emulators` | Start emulators with import/export state |
| `npm run emulators:exec` | Run a command against the emulators |
| `npm run emulators:export` | Export emulator data |
| `npm run emulators:backup` | Back up the emulator export |
| `npm run emulators:stop` | Stop the Firestore emulator |

### Backfills and Maintenance

| Script | Purpose |
|---|---|
| `npm run clean-job-text` | Dry-run job description cleanup |
| `npm run clean-job-text:apply` | Apply job description cleanup |
| `npm run backfill:search-tokens` | Backfill admin search tokens (emulator) |
| `npm run backfill:search-tokens:production` | Backfill admin search tokens (production) |
| `npm run backfill:ats-metadata` | Backfill application ATS metadata (emulator) |
| `npm run backfill:ats-metadata:production` | Backfill application ATS metadata (production) |
| `npm run backfill:job-timestamps` | Backfill job discovery timestamps (emulator) |
| `npm run backfill:job-timestamps:production` | Backfill job discovery timestamps (production) |

Backfill commands are dry runs by default. Apply them with `-- --apply --confirm` where supported.

### Admin and Deployment

| Script | Purpose |
|---|---|
| `npm run admin:grant` | Grant admin access in production |
| `npm run admin:grant:emulator` | Grant admin access in the emulator |
| `npm run admin:grant-owner` | Provision the production owner account |
| `npm run admin:grant-owner:emulator` | Provision the emulator owner account |
| `npm run admin:audit-owner` | Audit owner claims without writing |
| `npm run deploy:rules` | Deploy Firestore rules |
| `npm run deploy:indexes` | Deploy Firestore indexes |
| `npm run deploy:hosting` | Deploy the frontend build |
| `npm run deploy:functions` | Deploy Cloud Functions (requires Blaze) |
| `npm run deploy:admin` | Build and deploy rules, indexes, and hosting |
| `npm run verify:admin` | Run read-only production admin verification |

## Status

### V1 — complete

- **Phase 1 (Foundation):** Vite/React/TypeScript scaffold, Tailwind v4, shadcn/ui, Motion, React Router v7, Firebase SDK, emulators, environment split, and deny-by-default Firestore rules.
- **Phase 2 (Application Shell):** Global layout, navigation, authentication, protected routes, dashboard shell, reusable table components, states, and responsive behavior.
- **Phase 3 (Core Data Model):** Domain models, Firestore collections and services, security rules, profile management, project library, and settings.
- **Phase 4 (ATS Layer):** Greenhouse, Lever, and Ashby adapters, normalization, deduplication, source traceability, and normalized job storage.
- **Phase 5 (Job Intelligence):** Opportunity list and detail views, qualification workflow, provider-independent AI layer, job analysis, company research, and portfolio matching.
- **Phase 6 (Outreach):** Cold-email prompt architecture, pitch generation, outreach editor, approval workflow, pipeline, manual sending, reply tracking, and follow-up queue.
- **Phase 7 (V1 Hardening):** Structured logging, error monitoring, retry boundaries, AI usage tracking, duplicate protections, discovery locks, and unit/integration security tests.

### V2 — items 56–64 complete

- **56 — Application entity:** One application per opportunity, validated lifecycle states, append-only timeline, and application detail view.
- **57 — Application pipeline:** Board and list views, stage filtering, search, and combined closed-stage handling.
- **58 — Preparation workspace:** Role context, resume notes, AI-assisted cover letters and application answers, item review states, and stage actions.
- **59 — Resume variants:** URL-based resume library, owner-scoped persistence, default variant selection, and per-application resume choice.
- **60 — ATS application metadata:** Normalized ATS metadata attached to applications and rendered in review/preparation flows.
- **61 — Browser automation abstraction:** Provider interface, domain policy, page inspection, execution types, and bounded automation runs.
- **62 — Playwright provider:** Real browser provider that follows apply links, detects email-only applications, and inspects Workable forms.
- **63 — Approved-field population:** Server-generated field proposals from profile, application, and approved preparation content; per-field review and approval; Playwright population of approved text, textarea, select, and checkbox fields; per-field results. File uploads and submission remain manual.
- **64 — Browser execution logs:** A bounded per-run execution timeline covering validation, session lifecycle, inspection, population results, warnings, errors, and cancellation. Logs are stored separately from runs and loaded only when the execution-log panel is opened.

### Admin console — AC1–AC9 complete

- Admin shell, overview, and user directory.
- Per-user detail and data inspection.
- Cross-user opportunities, applications, outreach, companies, and resume variant browsers.
- System health, AI usage, and error monitoring.
- Secure user management: role changes, disable/enable, and last-admin protection.
- Admin audit log with destructive-action safeguards.
- Authorization hardening, owner provisioning, deployment tooling, and production verification.
- Read-only inspection is intentionally separated from destructive management.

### Pagination and cost controls

- Shared sliding page-number bar with a three-page window.
- Active page is highlighted and marked with `aria-current="page"`.
- Previous/next arrows; ellipses are non-clickable.
- No direct jump to the final page before it enters the visible window.
- Numbered pages load sequentially through existing cursors; no Firestore `offset()` queries.
- Total-page counts use server-side count queries for cursor-backed lists.
- Search, status, source, discovery, and refresh changes reset pagination.
- Personal applications, outreach, resume variants, and admin users paginate already-loaded data client-side, so page changes add no Firestore reads.

### Current deployment state

- Production hosting, Firestore rules, and indexes were deployed during the admin console rollout.
- Owner provisioning is complete for production and the emulator.
- Cloud Functions — including AI, automation, and admin Auth operations — remain emulator-only until the Firebase project is upgraded to Blaze.
- The latest automation-related rules/indexes, browser automation assets, and newest frontend build still need a final production deployment.

### Next

- V2 items 65–69: screenshot/error capture, manual verification pauses, application submission workflow, interview tracking, and V2 deployment.

## What’s Built

### Discovery and intelligence

- Scheduled and manual opportunity discovery.
- Greenhouse, Lever, and Ashby ATS adapters.
- Source-agnostic job normalization and deduplication.
- Source URL, discovery timestamp, and adapter traceability.
- Per-user discovery locks to prevent duplicate runs.
- AI provider abstraction with Gemini and OpenAI providers.
- Job-fit scoring, company research, and portfolio proof matching.
- Structured AI run records for usage and cost visibility.

### Opportunities

- Searchable, filterable opportunity feed.
- Cursor-based pagination with total-page counts.
- Status and source filters.
- Opportunity detail view with fit analysis, research, and matched projects.
- Batch qualification workflow.

### Outreach

- AI-assisted cold-email drafting.
- Editable outreach workspace.
- Explicit approval before sending.
- Manual sending from the owner's mailbox.
- Reply and status tracking.
- Follow-up queue.
- Duplicate-outreach protection and state-machine validation.

### Applications

- One tracked application per opportunity.
- Kanban and list pipeline views.
- Application preparation workspace.
- AI-assisted cover letters and answer drafts from verified profile data.
- Per-item review and approval states.
- Resume variant selection.
- ATS metadata inspection.
- Application timeline and status history.

### Resume variants

- URL-based resume library.
- Default variant selection.
- Per-application resume choice.
- Owner-scoped access rules.

### Browser automation

- Provider-independent browser automation contract.
- Playwright-backed provider.
- Apply-link following and email-only application detection.
- Workable form inspection.
- Server-generated field proposals from profile, application, and approved preparation content.
- Per-field review and approval before population.
- Playwright population of approved text, textarea, select, and checkbox fields.
- Per-field filled, skipped, failed, and manual-required results.
- Bounded per-run browser execution logs with lazy loading in the Automation page.
- Manual file uploads and explicit human verification boundaries; automated submission is not enabled.

### Admin console

- Separate protected `/admin` shell.
- User directory and user detail inspection.
- Cross-user opportunities, applications, outreach, companies, resumes, AI runs, errors, and audit logs.
- Role changes, account disable/enable, and last-admin protection.
- Admin audit trail for sensitive actions.
- AI usage and error monitoring.
- System health and telemetry.
- Owner provisioning and deployment verification scripts.

## Project Structure

```text
src/
  components/   Shared UI, layout, admin, application, resume, and state components
  features/     Landing and documentation search features
  hooks/        Auth, Firestore subscriptions, metrics, and paginated data hooks
  lib/          Domain helpers, cursor pagination, ATS metadata, resume, and search utilities
  pages/        Personal workspace and admin console routes
  providers/    Authentication provider and context
  router/       Route map and lazy-loaded page registration
  services/     Firestore queries, mutations, admin services, and Cloud Function clients
  types/        TypeScript domain models

functions/
  src/          Cloud Functions for discovery, AI, outreach, applications, automation, and admin

scripts/        Backfills, deployment, provisioning, and verification scripts

tests/
  unit/         Pure domain, validation, pagination, and prompt tests
  integration/  Firestore rules, discovery, applications, preparation, and resume tests
```

## Testing

Run the full suite:

```bash
npm run test:all
```

Individual suites:

```bash
npm run test                 # typecheck + unit tests
npm run test:integration     # Firestore/Auth emulator integration tests
```

Current coverage includes 106 unit tests and 54 integration tests across normalization, deduplication, cursor pagination, sliding-window pagination, application lifecycle, preparation prompts, resume variants, ATS metadata, automation policy, field proposals, approved-field validation, execution-log merging, Firestore write serialization, search tokens, discovery locks, and Firestore rules.

## Deployment

### Emulator validation

```bash
npm run emulators
npm run test:all
```

### Production assets

```bash
npm run deploy:rules
npm run deploy:indexes
npm run deploy:hosting
```

### Admin console rollout

```bash
npm run deploy:admin
npm run verify:admin
```

### Cloud Functions

```bash
npm run deploy:functions
```

Cloud Functions deployment requires the Firebase project to be on the Blaze plan. Until then, AI, automation, and admin Auth operations remain emulator-only.

All production deployment should be preceded by:

```bash
npm run build
npm run test:all
```
