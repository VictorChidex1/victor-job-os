# Project Overview: Victor's Job OS — Automated Developer Opportunity & Outreach Platform

## 1. AI Rules of Engagement & System Directives

- **Developer Authority:** Victor is the product owner and final decision-maker. The AI assistant must not introduce major architecture changes, new services, new features, or database changes without explicit approval.
- **Build Incrementally:** Work must proceed one approved step at a time. Do not generate large unsolicited implementation blocks or silently implement future-version features.
- **Strict TypeScript:** The entire application is TypeScript-first. JavaScript files are prohibited unless a tooling requirement makes one unavoidable.
- **React Architecture:** Use standard React with Vite. Next.js is not part of this project.
- **Serverless Architecture:** Firebase is the primary backend platform. Cloud Functions use Node.js + TypeScript for server-side workflows.
- **Database:** Cloud Firestore is the system of record.
- **UI:** Tailwind CSS + shadcn/ui provide the component and design foundation.
- **Motion:** Framer Motion is used deliberately for transitions, feedback states, dashboards, cards, and other interactions where motion improves comprehension. Avoid decorative animation that harms performance.
- **Human Control:** The system may discover, research, qualify, draft, queue, and prepare applications automatically. Sending outreach or submitting applications must use explicit approval gates unless a future version explicitly enables an approved automation rule.
- **Truthfulness:** Never invent job requirements, company facts, recruiter names, hiring contacts, portfolio results, technical experience, employment history, or application answers.
- **Source Traceability:** Every opportunity must retain its source, source URL, discovery timestamp, and source adapter.
- **Application Integrity:** The system must never fabricate answers to employer screening questions. AI may draft answers from verified profile data, but unsupported information must be flagged for Victor.
- **No Duplicate Outreach:** The system must prevent duplicate outreach to the same contact/company/opportunity according to configurable deduplication rules.
- **No Duplicate Applications:** An opportunity that has already been submitted, intentionally skipped, or is currently pending must not be presented as a fresh application without clear status context.
- **Security:** API keys, email credentials, Firebase service credentials, and AI provider secrets must never be exposed in client-side code.
- **Cost Awareness:** Every automated workflow must have bounded execution, reasonable query limits, controlled Cloud Function concurrency, and observable usage.
- **V1 Discipline:** Build the smallest useful Job OS first. V2 and V3 capabilities must not leak into V1 implementation unless the architecture explicitly requires a foundation for them.

---

## 2. Project Summary

Victor's Job OS is a private, serverless job intelligence and application operating system designed to remove the repetitive work involved in finding developer opportunities, researching companies, qualifying roles, preparing personalized outreach, and managing applications.

The system is not intended to be another generic job board.

It is a personal opportunity engine built around Victor's actual profile:

- React
- TypeScript
- Node.js
- Firebase
- Firestore
- Serverless architecture
- Full-stack web development
- Business-focused web development
- SEO and conversion-oriented implementation

The platform continuously discovers relevant developer opportunities from supported job sources, normalizes them into a common internal structure, evaluates their fit against Victor's profile, researches the company and role, generates a personalized outreach/application draft, and presents the opportunity inside a central dashboard.

The long-term goal is:

> Find the right opportunities, understand them quickly, prepare the right response, and make applying a controlled, measurable workflow rather than a daily manual grind.

### Core Operating Loop

1. Discover new opportunities.
2. Normalize source-specific job data.
3. Remove duplicates.
4. Filter by Victor's configured criteria.
5. Analyze technical and business fit.
6. Research the company and opportunity.
7. Match relevant portfolio proof.
8. Generate a personalized cold email/application draft.
9. Present the opportunity for review.
10. Send approved outreach.
11. Prepare approved applications.
12. Track status, responses, interviews, follow-ups, and outcomes.
13. Learn from historical results without changing Victor's profile or preferences without approval.

---

# 3. Product Goals

## Primary Goals

- Eliminate repetitive manual job hunting.
- Source new React/Node.js/Firebase/full-stack/serverless opportunities.
- Aggregate opportunities from multiple ATS and job sources.
- Provide one normalized opportunity model regardless of source.
- Prioritize roles according to Victor's actual criteria.
- Generate high-quality, prospect-specific outreach drafts.
- Prepare application materials without fabricating information.
- Track every opportunity from discovery to outcome.
- Support a target workflow of approximately 20–30 high-quality outreach opportunities per day.
- Reduce time spent switching between job boards, company career pages, email, spreadsheets, and notes.
- Create a measurable pipeline rather than an unstructured list of applications.

## Secondary Goals

- Build a reusable architecture for additional job sources.
- Create a foundation for browser-based application automation.
- Provide analytics around source quality, response rates, application outcomes, and workflow bottlenecks.
- Keep infrastructure inexpensive enough for a single-user system.
- Make every automated decision inspectable.

## Non-Goals for the Initial Build

- Public job marketplace.
- Multi-tenant SaaS.
- Selling access to the platform.
- Fully autonomous mass application submission.
- Sending indiscriminate bulk email.
- Fabricating application answers.
- Scraping sites in ways that violate their terms or technical restrictions.
- Building a traditional relational backend solely for the sake of learning PostgreSQL.

---

# 4. Product Philosophy

## The Job OS Is a Decision System, Not a Job Scraper

The platform should not optimize for the number of jobs collected.

It should optimize for the number of useful opportunities surfaced.

A dashboard showing 2,000 scraped jobs is not useful if Victor still has to manually determine which 20 matter.

The system therefore prioritizes:

- relevance
- freshness
- fit
- evidence
- personalization
- actionability
- traceability

## Every Opportunity Should Answer Five Questions

When Victor opens a job, the system should make it easy to understand:

1. What is the company hiring for?
2. Why does this role fit Victor?
3. What evidence from Victor's work is relevant?
4. What should Victor say to the company?
5. What is the next action?

---

# 5. Technology Stack

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- React Router
- React Hook Form where forms become complex
- Zod for client/server validation

## Backend

- Firebase
- Cloud Firestore
- Firebase Authentication
- Firebase Storage where document/file storage is required
- Firebase Cloud Functions
- Node.js
- TypeScript

## Scheduling

- Firebase scheduled Cloud Functions / Cloud Scheduler-backed schedules
- Event-driven Cloud Functions where appropriate

## AI Layer

The AI layer must be provider-independent.

```text
AIService
├── GeminiProvider
└── OpenAIProvider
```

The application should interact with a common internal interface rather than directly coupling business logic to one model provider.

Primary AI responsibilities:

- job classification
- job-fit analysis
- company research synthesis
- portfolio matching
- email drafting
- application-answer drafting
- opportunity summarization
- follow-up drafting

AI must return structured outputs wherever possible.

## Job Sources

Initial ATS adapters:

- Greenhouse
- Lever
- Ashby

Future adapters:

- Workday
- SmartRecruiters
- iCIMS
- custom company career pages
- other supported job feeds/APIs

## Browser Automation

- Playwright

Browser automation is a V2/V3 capability and must not become the foundation of V1.

It is intended for application systems that cannot be handled through clean public APIs or predictable ATS endpoints.

## Email

### Professional mailbox

`victor@victorchidera.com`

Used as Victor's professional identity for approved outreach and communication.

### Resend

`send.victorchidera.com`

Used for appropriate transactional/system notifications, not as the default engine for unsolicited cold outreach.

Examples:

- daily opportunity digest
- application status notifications
- system alerts
- internal workflow notifications

The final outreach-sending provider must comply with its own policies and applicable email rules.

---

# 6. High-Level System Architecture

```text
                           VICTOR'S JOB OS
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
              React Client                 Scheduled Jobs
                   │                             │
                   ▼                             ▼
             Firebase Auth                Cloud Functions
                   │                             │
                   └──────────────┬──────────────┘
                                  │
                           Firestore Database
                                  │
        ┌─────────────┬───────────┼───────────┬─────────────┐
        │             │           │           │             │
        ▼             ▼           ▼           ▼             ▼
     Sources       Jobs       Companies    Outreach     Applications
        │             │           │           │             │
        └─────────────┴───────────┴───────────┴─────────────┘
                                  │
                           AI Service Layer
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                 Gemini                     OpenAI
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                         External Job Sources
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
         Greenhouse             Lever              Ashby
```

---

# 7. ATS Adapter Architecture

The platform must not build business logic directly around one ATS.

Each job source implements a common adapter interface.

```text
src/
└── adapters/
    └── ats/
        ├── greenhouse/
        ├── lever/
        ├── ashby/
        └── index.ts
```

Conceptually:

```text
ATS Adapter
    │
    ├── discover()
    ├── fetchJob()
    ├── normalizeJob()
    └── getApplicationMetadata()
```

Every adapter converts source-specific data into the same internal `NormalizedJob` model.

Example:

```text
Greenhouse Job ──┐
Lever Job ───────┼──> NormalizedJob
Ashby Job ───────┘
```

This allows the rest of the application to operate without knowing whether an opportunity came from Greenhouse, Lever, Ashby, or a future source.

---

# 8. V1 — Opportunity Intelligence & Outreach OS

## V1 Objective

V1 is the first usable version of the Job OS.

Its purpose is to automatically find relevant developer opportunities, organize them, analyze their fit, draft personalized outreach, and give Victor one place to review and act.

V1 is successful when Victor can open the dashboard and quickly move from:

```text
New opportunity
      ↓
Qualified
      ↓
Research complete
      ↓
Pitch drafted
      ↓
Approved
      ↓
Sent
```

without manually hunting across multiple websites.

## V1 Features

### 8.1 Opportunity Discovery

Automatically discover new opportunities from:

- Greenhouse
- Lever
- Ashby

The discovery process should support configurable search criteria such as:

- React
- TypeScript
- Node.js
- Firebase
- Firestore
- serverless
- full-stack
- frontend
- software engineer
- web developer
- product engineer

Additional criteria:

- remote
- location
- employment type
- seniority
- salary where available
- company size where available
- source
- posted date

### 8.2 Job Normalization

Every source-specific job becomes:

```text
NormalizedJob
├── source
├── sourceJobId
├── companyId
├── title
├── description
├── location
├── remote
├── employmentType
├── seniority
├── applicationUrl
├── postedAt
├── discoveredAt
├── skills
├── sourceMetadata
└── status
```

### 8.3 Deduplication

The system must detect duplicate opportunities using combinations of:

- source
- source job ID
- canonical application URL
- company
- title
- normalized description fingerprints

Duplicate jobs should never create multiple pipeline records.

### 8.4 Job Qualification

The AI analyzes each opportunity against Victor's profile.

The result should contain structured fields such as:

```text
fitScore
technicalFit
experienceFit
stackMatch
roleType
remoteFit
concerns
matchedSkills
missingSkills
reasoningSummary
recommendation
```

The system must not present the score as an absolute truth.

The dashboard should show the evidence behind the assessment.

### 8.5 Company Research

For qualified opportunities, gather and store:

- company name
- company website
- industry
- company description
- product/service
- relevant company context
- role-specific context
- hiring/company signals where available
- source URLs
- research timestamp

The AI should summarize the information but preserve source links where practical.

### 8.6 Portfolio Matching

The system maintains Victor's verified portfolio/project library.

Example projects:

- EazyPass
- Eventflow
- Trendzhauz Media
- Corner Hub
- AG1 Health & Nutrition Website
- CV Digitals projects
- other verified work

Each project contains:

```text
project
├── title
├── summary
├── technologies
├── problem
├── solution
├── outcomes
├── verifiedMetrics
├── url
└── relevanceTags
```

The AI selects only projects that are genuinely relevant to the opportunity.

### 8.7 Cold Email Drafting

The drafting engine follows Victor's established cold-email methodology.

Required principles:

- Begin with `Dear [Name],`
- Lead with the prospect/business reality.
- Identify the meaningful business or hiring tension.
- Explain why the issue matters.
- Transition naturally with `This is where I come in.`
- Explain Victor's relevant expertise.
- Use only relevant proof.
- Focus on business outcomes and execution.
- Avoid generic AI-generated praise.
- Avoid fake personalization.
- Avoid claims unsupported by Victor's verified profile.
- Close with a low-friction contextual CTA.

The draft is stored separately from the sent message so edits remain possible.

### 8.8 Outreach Queue

Victor should see:

```text
Drafted
Needs Review
Approved
Scheduled
Sent
Replied
Follow-up Due
Closed
```

The system should support:

- approve
- edit
- reject
- archive
- schedule
- mark as sent
- record manual response

### 8.9 Daily Opportunity Target

V1 should support a configurable daily target, initially:

```text
20–30 qualified outreach opportunities/day
```

This is a target for qualified opportunities and approved outreach, not permission to send indiscriminate bulk email.

### 8.10 Dashboard

Core dashboard widgets:

- New opportunities
- Qualified opportunities
- Drafts awaiting review
- Approved outreach
- Sent today
- Replies
- Follow-ups due
- Applications in progress
- Interviews
- Pipeline conversion
- Top opportunity sources

---

# 9. V1 Route Map

## Public/Internal Application Shell

This is a private application.

### `/login`

Authentication entry.

### `/`

Main dashboard.

### `/opportunities`

All discovered opportunities.

### `/opportunities/:id`

Full opportunity workspace.

### `/companies`

Company directory.

### `/companies/:id`

Company profile and related opportunities.

### `/outreach`

Outreach pipeline.

### `/outreach/:id`

Email review/editor.

### `/profile`

Victor's professional profile.

### `/projects`

Verified portfolio/project library.

### `/settings`

Automation, source, AI, email, and application settings.

---

# 10. V1 Opportunity Workspace

The opportunity detail page is the most important screen in the application.

It should provide:

```text
Company
Role
Source
Posted date
Location
Remote status
Application URL

Why this opportunity matches

Technical fit
Experience fit
Stack match

Company research

Relevant portfolio proof

AI-generated outreach

Application status

Next action
```

The page should make it possible for Victor to make a decision without opening ten browser tabs.

---

# 11. V1 Firestore Collections

```text
users/
profiles/
jobSources/
jobs/
companies/
jobAnalyses/
projects/
outreach/
contacts/
followUps/
applications/
applicationDrafts/
settings/
activityLogs/
aiRuns/
```

## `profiles`

Stores Victor's canonical professional profile.

```typescript
interface ProfessionalProfile {
  id: string;
  fullName: string;
  headline: string;
  summary: string;
  skills: string[];
  preferredRoles: string[];
  preferredLocations: string[];
  remotePreference: boolean;
  experienceLevel: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  email: string;
  updatedAt: Timestamp;
}
```

## `jobs`

```typescript
interface Job {
  id: string;
  source: "greenhouse" | "lever" | "ashby" | "workday" | "custom";
  sourceJobId: string;
  companyId: string;
  title: string;
  description: string;
  location?: string;
  remote: boolean;
  employmentType?: string;
  seniority?: string;
  applicationUrl: string;
  postedAt?: Timestamp;
  discoveredAt: Timestamp;
  skills: string[];
  searchTerms: string[];
  status: "new" | "qualified" | "rejected" | "archived";
  fingerprint: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## `companies`

```typescript
interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  description?: string;
  researchSummary?: string;
  sourceUrls: string[];
  lastResearchedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## `jobAnalyses`

```typescript
interface JobAnalysis {
  id: string;
  jobId: string;
  fitScore?: number;
  technicalFit: string;
  experienceFit: string;
  stackMatch: string[];
  matchedSkills: string[];
  missingSkills: string[];
  concerns: string[];
  summary: string;
  analyzedAt: Timestamp;
  aiProvider: string;
  model: string;
}
```

## `projects`

```typescript
interface PortfolioProject {
  id: string;
  title: string;
  summary: string;
  technologies: string[];
  problem: string;
  solution: string;
  outcomes: string[];
  verifiedMetrics: string[];
  url?: string;
  relevanceTags: string[];
  isActive: boolean;
  updatedAt: Timestamp;
}
```

## `outreach`

```typescript
interface Outreach {
  id: string;
  jobId: string;
  companyId: string;
  contactId?: string;
  subject: string;
  body: string;
  status:
    | "draft"
    | "needs-review"
    | "approved"
    | "scheduled"
    | "sent"
    | "replied"
    | "follow-up-due"
    | "closed";
  sentAt?: Timestamp;
  approvedAt?: Timestamp;
  scheduledAt?: Timestamp;
  replyAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## `contacts`

```typescript
interface Contact {
  id: string;
  companyId: string;
  name?: string;
  email?: string;
  role?: string;
  sourceUrl?: string;
  confidence?: "high" | "medium" | "low";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## `followUps`

```typescript
interface FollowUp {
  id: string;
  outreachId: string;
  scheduledFor: Timestamp;
  sequence: number;
  status: "pending" | "sent" | "cancelled";
  draft?: string;
  createdAt: Timestamp;
}
```

---

# 12. V1 Cloud Functions

Cloud Functions should remain small, bounded, and single-purpose.

Initial functions:

```text
discoverJobs
analyzeJob
researchOpportunity
generatePitch
sendApprovedOutreach
processFollowUps
```

Additional functions should only be introduced when a real workflow requires them.

## `discoverJobs`

Runs on schedule.

Responsibilities:

- execute configured source adapters
- retrieve new opportunities
- normalize data
- deduplicate
- write jobs to Firestore
- record source statistics

## `analyzeJob`

Triggered for newly discovered jobs that pass initial filtering.

Responsibilities:

- send structured job data to AI
- compare against Victor's profile
- store analysis

## `researchOpportunity`

Triggered for qualified jobs.

Responsibilities:

- collect allowed research data
- summarize company context
- store source references
- avoid duplicate research

## `generatePitch`

Triggered after research and qualification.

Responsibilities:

- select relevant verified projects
- construct structured prompt
- generate draft
- validate output
- store draft

## `sendApprovedOutreach`

Only handles approved messages.

Responsibilities:

- verify approval
- verify recipient
- verify deduplication
- send through the configured compliant email mechanism
- record message status

## `processFollowUps`

Runs on schedule.

Responsibilities:

- identify due follow-ups
- ensure the opportunity has not received a reply
- prepare or queue follow-up
- never send an unapproved follow-up unless an explicit future automation policy allows it

---

# 13. V2 — Application Operations & Browser Automation

## V2 Objective

V2 extends Job OS from an opportunity/outreach engine into an application operations platform.

V2 should be started only after V1 is stable and the opportunity pipeline is producing reliable results.

## V2 Features

### 13.1 Application Workspace

Each opportunity can become an application.

```text
Opportunity
     ↓
Application
     ↓
Preparation
     ↓
Review
     ↓
Submission
     ↓
Tracking
```

Application statuses:

```text
not-started
preparing
needs-review
approved
submitted
assessment
interview
offer
rejected
withdrawn
closed
```

### 13.2 Application Drafts

The system can prepare:

- cover letter
- short application message
- answers to standard questions
- project explanations
- experience summaries

All AI-generated answers must be based on verified profile information.

### 13.3 ATS Application Metadata

Each adapter may expose application metadata where the source makes it available.

Examples:

- application URL
- fields
- resume requirement
- cover letter requirement
- location fields
- screening questions
- custom questions

### 13.4 Browser Automation

Playwright becomes available for supported workflows.

```text
Application
    ↓
Browser Automation
    ↓
Load application page
    ↓
Identify fields
    ↓
Populate approved information
    ↓
Pause for review where required
    ↓
Submit only after approval
```

Browser automation must include:

- bounded execution
- timeouts
- screenshots/logs for failures
- retry limits
- authentication isolation
- session management
- explicit domain allowlists
- safe handling of CAPTCHA or anti-bot systems
- no attempt to bypass access controls

If a site requires CAPTCHA or another anti-automation mechanism, the workflow should stop and request manual completion rather than attempt to defeat it.

### 13.5 Application History

Track:

- submission date
- source
- application URL
- resume version
- cover letter
- answers
- recruiter/contact
- stage
- follow-ups
- interview dates
- outcome

### 13.6 Resume Variants

V2 may introduce controlled resume variants.

```text
Resume
├── Full Stack
├── React Frontend
├── Node.js Backend
└── Serverless/Firebase
```

Each variant must contain only truthful information from Victor's verified profile.

---

# 14. V2 Route Map

### `/applications`

Application pipeline.

### `/applications/:id`

Application workspace.

### `/applications/:id/prepare`

Application preparation.

### `/applications/:id/review`

Final review before submission.

### `/applications/:id/activity`

Application timeline.

### `/resumes`

Resume variant manager.

### `/automation`

Automation activity and browser sessions.

---

# 15. V2 Additional Firestore Collections

```text
applications/
applicationAnswers/
resumeVariants/
automationRuns/
automationSessions/
applicationEvents/
interviews/
```

---

# 16. V3 — Full Personal Career Operating System

## V3 Objective

V3 turns Job OS into a long-term career pipeline and intelligence system.

V3 is not about simply automating more clicks.

It is about understanding the entire opportunity lifecycle.

## V3 Features

### 16.1 Opportunity Intelligence

Analyze historical performance by:

- source
- company type
- role type
- technology
- outreach style
- application method
- location
- seniority
- response rate
- interview rate
- outcome

### 16.2 Pipeline Analytics

Dashboard examples:

```text
Opportunities discovered
Qualified
Outreach sent
Replies
Positive replies
Applications
Interviews
Offers
Closed
```

Conversion metrics:

```text
Discovery → Qualification
Qualification → Outreach
Outreach → Reply
Reply → Interview
Application → Interview
Interview → Offer
```

### 16.3 Source Performance

Determine which sources consistently produce relevant opportunities.

Example:

```text
Greenhouse
Lever
Ashby
Direct company careers
Other
```

The system should report historical measurements rather than blindly assuming one source is better.

### 16.4 Personal Career CRM

Companies and contacts become long-term records.

A company can have:

```text
Company
├── Opportunities
├── Contacts
├── Outreach
├── Applications
├── Interviews
├── Follow-ups
└── Notes
```

### 16.5 Relationship Tracking

Track:

- recruiter contacts
- hiring managers
- founders
- engineering leaders
- previous conversations
- previous applications
- previous responses

This prevents repeatedly approaching the same person without context.

### 16.6 Intelligent Follow-Up System

V3 can support configurable follow-up rules based on:

- last contact
- response state
- application state
- interview stage
- manual pause
- company status

### 16.7 Personal Opportunity Memory

The system remembers:

- which roles Victor likes
- which roles he rejects
- common reasons for rejection
- companies already contacted
- projects used successfully
- outreach variants
- historical results

The system may suggest changes, but Victor remains the decision-maker.

### 16.8 Career Command Center

The final dashboard becomes:

```text
TODAY

23 new qualified opportunities

12 outreach drafts ready
7 awaiting review
5 approved
3 follow-ups due

4 active applications
2 interviews scheduled

Pipeline
──────────────
New        23
Outreach   12
Replies     4
Interviews  2
Offers      0
```

---

# 17. V3 Intelligence Layer

The intelligence layer should answer questions such as:

- Which opportunity types produce the most replies?
- Which portfolio projects are most relevant to particular roles?
- Which sources produce the most qualified opportunities?
- Which companies have already been contacted?
- Which follow-ups are overdue?
- Which applications are stalled?
- Which job requirements repeatedly appear in qualified roles?
- Where are Victor's strongest opportunity clusters?

The system should provide evidence and historical data rather than unsupported predictions.

---

# 18. Firestore Security Model

The application is private and should use Firebase Authentication.

Initial access model:

```text
Authenticated Victor
        ↓
Application access
```

Future roles may include:

```text
owner
admin
viewer
```

## Security principles

- No public write access.
- No anonymous access to private opportunity data.
- AI/API secrets remain server-side.
- Client writes must be validated.
- Sensitive application data is restricted.
- Server-side functions validate important state transitions.
- Firestore rules deny unknown operations by default.

---

# 19. AI Security & Data Rules

The AI layer must never receive secrets such as:

- Firebase service account credentials
- email passwords
- API keys
- private authentication tokens

Only the minimum necessary business data should be passed into AI prompts.

Sensitive data should be redacted when unnecessary.

Every AI operation should record:

```text
provider
model
operation
input reference
output status
createdAt
```

Do not store raw prompts containing secrets.

---

# 20. Email Architecture

## Outreach

```text
Approved Outreach
       ↓
Email Service
       ↓
Victor's professional identity
       ↓
Recipient
```

The sending provider must permit the intended outreach workflow.

## System Notifications

```text
Cloud Function
       ↓
Resend
       ↓
Victor
```

Resend domain:

```text
send.victorchidera.com
```

System emails include:

- new opportunity digest
- daily pipeline summary
- application status
- automation errors
- follow-up reminders

---

# 21. Automation Safety

Automation must be controlled by state machines.

Example outreach state machine:

```text
DRAFT
  ↓
NEEDS_REVIEW
  ↓
APPROVED
  ↓
SCHEDULED
  ↓
SENT
  ↓
REPLIED / FOLLOW_UP_DUE / CLOSED
```

An invalid state transition must be rejected.

For example:

```text
DRAFT → SENT
```

must not happen unless the product's explicit automation policy permits it.

---

# 22. Application State Machine

```text
NOT_STARTED
      ↓
PREPARING
      ↓
NEEDS_REVIEW
      ↓
APPROVED
      ↓
SUBMITTED
      ↓
ASSESSMENT
      ↓
INTERVIEW
      ↓
OFFER
```

Alternative terminal states:

```text
REJECTED
WITHDRAWN
CLOSED
```

---

# 23. Search & Filtering

V1 should not require a paid search engine.

Firestore should handle structured filtering such as:

- source
- status
- company
- remote
- date
- role
- technology
- fit category

For more complex text search, the architecture should allow a future search provider without coupling the core domain model to it.

---

# 24. Cost-Control Architecture

Because this is a personal system, infrastructure must remain economical.

## Cloud Functions

Every function should have:

- explicit timeout
- controlled memory
- bounded retries
- appropriate max instances
- limited batch size

## AI

Avoid sending unnecessarily large job descriptions repeatedly.

Use:

- normalized job summaries
- cached analyses
- cached company research
- structured prompts
- model selection based on task complexity

## Firestore

Avoid:

- unbounded listeners
- repeated full-collection reads
- unnecessary polling
- duplicate documents
- storing large files inside documents

## Browser Automation

Only launch browsers when required.

Do not run permanent browser instances.

---

# 25. Observability

Every important automated workflow should produce an activity record.

Examples:

```text
Job discovery started
Job discovery completed
127 jobs fetched
31 new jobs
18 duplicates
12 rejected

AI analysis started
AI analysis completed

Pitch generated
Outreach approved
Email sent

Application automation failed
```

The admin UI should expose errors clearly.

---

# 26. Activity Log

```typescript
interface ActivityLog {
  id: string;
  type:
    | "job-discovery"
    | "job-analysis"
    | "research"
    | "pitch-generation"
    | "email"
    | "application"
    | "automation"
    | "system-error";
  entityId?: string;
  status: "started" | "completed" | "failed";
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}
```

---

# 27. Error Handling

Every asynchronous workflow must have:

- loading state
- empty state
- success state
- recoverable error state
- fatal error state
- retry mechanism where appropriate

Examples:

```text
No new jobs found today.
```

```text
Unable to fetch Greenhouse opportunities.
Retry
```

```text
AI analysis failed.
Retry analysis
```

```text
Application automation stopped because manual verification is required.
Open application
```

Errors must be actionable rather than generic.

---

# 28. UI/UX Guidelines

The interface should feel like a serious personal operations dashboard rather than a generic admin template.

## Design Principles

- clean
- dense but readable
- information-first
- fast
- responsive
- keyboard-friendly
- clear status hierarchy
- minimal unnecessary decoration

## shadcn/ui

Use shadcn for:

- buttons
- dialogs
- dropdowns
- tabs
- forms
- tables
- badges
- cards
- command menus
- tooltips
- sheets
- alerts

## Framer Motion

Use motion for:

- page transitions
- opportunity card entrance
- status changes
- drawer/dialog transitions
- pipeline updates
- success feedback
- expandable details

Avoid excessive animation.

---

# 29. Main Application Navigation

```text
Dashboard
Opportunities
Companies
Outreach
Applications
Projects
Contacts
Automation
Analytics
Settings
```

V1 may hide sections that are not yet implemented.

---

# 30. Dashboard Information Architecture

## Header

```text
Good morning, Victor.

Today's pipeline
```

## Primary metrics

```text
New Opportunities
Qualified
Outreach Ready
Applications
Replies
Interviews
```

## Opportunity feed

Latest high-relevance opportunities.

## Outreach queue

Messages requiring review.

## Follow-ups

Upcoming follow-up actions.

## Application pipeline

Current active applications.

---

# 31. Profile Management

Victor's professional profile must be a first-class data source.

It should contain:

- headline
- summary
- skills
- technologies
- experience
- project history
- verified achievements
- preferred roles
- preferred locations
- remote preference
- compensation preference if Victor chooses to store it
- resume variants
- portfolio URL
- contact information

The AI uses this profile when analyzing opportunities and generating drafts.

---

# 32. Project Library

The project library is critical to personalization.

Each project should describe:

```text
What was built?
Why was it built?
What technologies were used?
What problem did it solve?
What did Victor personally do?
What outcome was achieved?
Which claims are verified?
Which roles is it relevant to?
```

The AI must never invent project metrics.

---

# 33. Source Configuration

The settings interface should allow Victor to control:

```text
Enabled sources
Search keywords
Preferred roles
Remote preference
Location preference
Seniority
Employment type
Daily target
Minimum fit threshold
AI provider
AI model
Outreach settings
Follow-up settings
```

---

# 34. Scheduled Job Discovery

The discovery workflow should run automatically on a configured schedule.

Example:

```text
Scheduled trigger
      ↓
Greenhouse adapter
      ↓
Lever adapter
      ↓
Ashby adapter
      ↓
Normalize
      ↓
Deduplicate
      ↓
Store
      ↓
Queue analysis
```

The schedule must be configurable rather than hard-coded.

---

# 35. Daily Workflow

A normal day should look like:

```text
07:00
Job discovery

↓
New jobs normalized

↓
Initial filtering

↓
AI qualification

↓
Company research

↓
Portfolio matching

↓
Pitch generation

↓
Victor opens dashboard

↓
Reviews qualified opportunities

↓
Approves selected outreach

↓
Approved messages are sent through the configured compliant email service

↓
Replies enter the communication pipeline

↓
Follow-ups become due according to configured rules
```

---

# 36. V1/V2/V3 Scope Matrix

| Capability | V1 | V2 | V3 |
|---|---|---|---|
| React dashboard | ✓ | ✓ | ✓ |
| Firebase Auth | ✓ | ✓ | ✓ |
| Firestore | ✓ | ✓ | ✓ |
| Greenhouse | ✓ | ✓ | ✓ |
| Lever | ✓ | ✓ | ✓ |
| Ashby | ✓ | ✓ | ✓ |
| Job normalization | ✓ | ✓ | ✓ |
| Deduplication | ✓ | ✓ | ✓ |
| AI job analysis | ✓ | ✓ | ✓ |
| Company research | ✓ | ✓ | ✓ |
| Portfolio matching | ✓ | ✓ | ✓ |
| Cold email drafting | ✓ | ✓ | ✓ |
| Outreach queue | ✓ | ✓ | ✓ |
| Email tracking | ✓ | ✓ | ✓ |
| Application preparation | — | ✓ | ✓ |
| Browser automation | — | ✓ | ✓ |
| Playwright | — | ✓ | ✓ |
| Resume variants | — | ✓ | ✓ |
| Application tracking | — | ✓ | ✓ |
| Interview tracking | — | ✓ | ✓ |
| Advanced analytics | — | — | ✓ |
| Career CRM | — | — | ✓ |
| Opportunity intelligence | — | — | ✓ |
| Historical performance analysis | — | — | ✓ |

---

# 37. Recommended Source Directory Structure

```text
src/
├── assets/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── opportunities/
│   ├── companies/
│   ├── outreach/
│   ├── applications/
│   ├── projects/
│   ├── contacts/
│   ├── automation/
│   └── analytics/
│
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Opportunities.tsx
│   ├── OpportunityView.tsx
│   ├── Companies.tsx
│   ├── CompanyView.tsx
│   ├── Outreach.tsx
│   ├── OutreachView.tsx
│   ├── Applications.tsx
│   ├── ApplicationView.tsx
│   ├── Projects.tsx
│   ├── Contacts.tsx
│   ├── Automation.tsx
│   ├── Analytics.tsx
│   └── Settings.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useJobs.ts
│   ├── useOpportunities.ts
│   ├── useOutreach.ts
│   ├── useApplications.ts
│   └── useSettings.ts
│
├── services/
│   ├── firebase.ts
│   ├── firestore.ts
│   ├── auth.ts
│   └── ai/
│
├── adapters/
│   └── ats/
│       ├── greenhouse/
│       ├── lever/
│       ├── ashby/
│       └── index.ts
│
├── types/
│   ├── jobs.ts
│   ├── companies.ts
│   ├── outreach.ts
│   ├── applications.ts
│   ├── projects.ts
│   └── profile.ts
│
├── utils/
│   ├── normalizeJob.ts
│   ├── deduplicateJob.ts
│   ├── scoring.ts
│   ├── dates.ts
│   └── validation.ts
│
├── lib/
│   ├── ai/
│   ├── email/
│   └── automation/
│
├── App.tsx
├── main.tsx
└── index.css
```

---

# 38. Cloud Functions Structure

```text
functions/
├── src/
│   ├── jobs/
│   │   ├── discoverJobs.ts
│   │   ├── analyzeJob.ts
│   │   └── normalizeJob.ts
│   │
│   ├── research/
│   │   └── researchOpportunity.ts
│   │
│   ├── outreach/
│   │   ├── generatePitch.ts
│   │   ├── sendApprovedOutreach.ts
│   │   └── processFollowUps.ts
│   │
│   ├── applications/
│   │   ├── prepareApplication.ts
│   │   └── processApplication.ts
│   │
│   ├── ai/
│   │   ├── aiService.ts
│   │   ├── geminiProvider.ts
│   │   └── openaiProvider.ts
│   │
│   ├── adapters/
│   │   └── ats/
│   │       ├── greenhouse.ts
│   │       ├── lever.ts
│   │       └── ashby.ts
│   │
│   └── index.ts
│
├── package.json
└── tsconfig.json
```

---

# 39. Execution Roadmap

The AI assistant must await Victor's approval before moving from one major step to the next.

## Phase 1 — Foundation

1. Create Vite React TypeScript application.
2. Configure Tailwind.
3. Install and configure shadcn/ui.
4. Install Framer Motion.
5. Configure React Router.
6. Initialize Firebase.
7. Configure Firebase Authentication.
8. Configure Firestore.
9. Configure local emulators where appropriate.
10. Establish environment variables.

## Phase 2 — Application Shell

11. Build global layout.
12. Build navigation.
13. Build authentication.
14. Build dashboard shell.
15. Build reusable data-table components.
16. Build loading/error/empty states.
17. Build responsive behavior.

## Phase 3 — Core Data Model

18. Create TypeScript domain models.
19. Create Firestore collections.
20. Write Firestore security rules.
21. Build profile management.
22. Build project library.
23. Build settings.

## Phase 4 — ATS Layer

24. Define ATS adapter interface.
25. Implement Greenhouse adapter.
26. Implement Lever adapter.
27. Implement Ashby adapter.
28. Build normalization service.
29. Build deduplication service.
30. Store normalized jobs.

## Phase 5 — Job Intelligence

31. Build opportunity list.
32. Build opportunity detail view.
33. Implement qualification workflow.
34. Implement AI provider abstraction.
35. Implement job analysis.
36. Implement company research.
37. Implement portfolio matching.

## Phase 6 — Outreach

38. Implement cold-email prompt architecture.
39. Implement pitch generation.
40. Build outreach editor.
41. Build approval workflow.
42. Build outreach pipeline.
43. Integrate compliant sending mechanism.
44. Implement reply/status tracking.
45. Implement follow-up queue.

## Phase 7 — V1 Hardening

46. Add logging.
47. Add error monitoring.
48. Add retry boundaries.
49. Add cost controls.
50. Add duplicate protections.
51. Test daily discovery.
52. Test AI failure scenarios.
53. Test email failure scenarios.
54. Test security rules.
55. Deploy V1.

---

# 40. V2 Execution Roadmap

56. Build application entity.
57. Build application pipeline.
58. Build application preparation workspace.
59. Build resume variant system.
60. Add ATS application metadata.
61. Build browser automation abstraction.
62. Add Playwright.
63. Build approved-field population.
64. Add browser execution logs.
65. Add screenshot/error capture.
66. Add manual verification pauses.
67. Add application submission workflow.
68. Add interview tracking.
69. Deploy V2.

---

# 41. V3 Execution Roadmap

70. Build analytics data model.
71. Build source performance analytics.
72. Build outreach analytics.
73. Build application analytics.
74. Build interview analytics.
75. Build career CRM.
76. Build contact relationship history.
77. Build opportunity intelligence.
78. Build historical portfolio matching insights.
79. Build career command center.
80. Deploy V3.

---

# 42. Testing Strategy

## Unit Tests

Test:

- normalization
- deduplication
- scoring
- validation
- state transitions
- prompt construction
- source parsing

## Integration Tests

Test:

- Firestore writes
- Cloud Functions
- ATS adapters
- AI provider responses
- email service
- application workflows

## End-to-End Tests

Test:

```text
Login
 ↓
Discover
 ↓
Qualify
 ↓
Research
 ↓
Generate pitch
 ↓
Review
 ↓
Approve
 ↓
Send
 ↓
Track
```

V2 additionally:

```text
Application
 ↓
Prepare
 ↓
Review
 ↓
Browser automation
 ↓
Submit
 ↓
Track
```

---

# 43. Deployment Architecture

## Production

```text
React/Vite
     ↓
Firebase Hosting

Cloud Functions
     ↓
Firebase / Google Cloud

Firestore
     ↓
Production database
```

## Preview

Vercel may be used for staging/preview environments where useful.

Production remains Firebase.

---

# 44. Environment Separation

```text
Development
Staging
Production
```

Each environment should have separate:

- Firebase configuration
- Firestore data
- AI credentials
- email credentials
- scheduled jobs

Never point local development directly at production data.

---

# 45. Backup & Recovery

The system should maintain a recoverable record of:

- opportunities
- applications
- outreach
- profile
- project library
- activity logs

Important data should not depend solely on ephemeral browser state.

---

# 46. Future Extension Points

The architecture should allow future additions without rewriting the core system.

Potential extensions:

- additional ATS adapters
- additional AI providers
- additional email providers
- LinkedIn opportunity research where permitted
- job board adapters
- richer contact enrichment
- calendar integration
- interview preparation workspace
- offer tracking
- salary research
- career document generation
- personal CRM
- multi-profile support

These are not V1 requirements.

---

# 47. Core Engineering Principles

1. **Source-agnostic job model.**
2. **Provider-independent AI layer.**
3. **Firestore as the source of truth.**
4. **Server-side secrets only.**
5. **Every automation must be observable.**
6. **Every important state transition must be explicit.**
7. **Every AI claim must be traceable to verified data.**
8. **Never fabricate application information.**
9. **Never duplicate opportunities or outreach.**
10. **Keep V1 small and useful.**
11. **Design V1 so V2/V3 can be added without rebuilding the foundation.**
12. **Prefer deterministic code for business rules and AI for language/reasoning tasks.**
13. **Use AI to assist decisions, not silently replace Victor's judgment.**
14. **Bound all automated infrastructure to control cost.**
15. **Respect the policies and technical constraints of external job and email platforms.**
16. **Treat browser automation as a controlled tool, not an unrestricted bot.**
17. **Optimize for qualified opportunities rather than raw job volume.**
18. **Measure outcomes, not activity alone.**

---

# 48. Definition of Done

The Job OS is considered operational when Victor can:

1. Open the dashboard.
2. See newly discovered developer opportunities.
3. Filter opportunities by relevant criteria.
4. Open an opportunity and understand the role quickly.
5. See why the role matches his profile.
6. See relevant verified portfolio proof.
7. Read company research.
8. Review an AI-generated personalized outreach draft.
9. Edit the draft.
10. Approve or reject it.
11. Send approved outreach through the configured compliant email workflow.
12. Track the outreach status.
13. See replies and follow-ups.
14. Convert an opportunity into an application.
15. Track applications through their lifecycle.
16. View historical pipeline metrics.
17. Control sources, preferences, automation, and AI settings.
18. Understand what the system did and why.

---

# 49. Final Product Definition

Victor's Job OS is a private, serverless career operations platform.

It combines:

```text
Job Discovery
      +
ATS Adapters
      +
Opportunity Intelligence
      +
Company Research
      +
Portfolio Matching
      +
AI-Personalized Outreach
      +
Application Operations
      +
Browser Automation
      +
Pipeline Tracking
      +
Career Analytics
```

The product evolves deliberately:

```text
V1
DISCOVER → QUALIFY → RESEARCH → DRAFT → REVIEW → OUTREACH

V2
DISCOVER → QUALIFY → RESEARCH → DRAFT → APPLY → SUBMIT → TRACK

V3
DISCOVER → LEARN → OPTIMIZE → MANAGE RELATIONSHIPS → GROW CAREER
```

The core principle remains:

> **Automate the repetitive work. Keep Victor in control of the important decisions. Build the system so every opportunity can move from discovery to outcome without losing context.**
