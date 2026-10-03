# UI/UX & PAGE ARCHITECTURE SPECIFICATION FOR VICTOR'S JOB OS

## 1. OVERALL PRODUCT EXPERIENCE

Victor's Job OS is a private developer opportunity intelligence and career operations platform.

The interface should feel like a **personal command center**, not a generic job board and not a generic SaaS dashboard.

The experience should combine:

- Opportunity intelligence
- Job discovery
- Qualification
- Company research
- Portfolio matching
- Outreach preparation
- Application management
- Follow-up management
- Pipeline visibility
- Automation visibility
- Career analytics

The UI should communicate:

> **Find the right opportunities. Understand them quickly. Prepare the right response. Move qualified opportunities forward.**

The interface should feel:

> **Focused. Intelligent. Operational. Fast. Premium. Calm.**

The product is private and single-owner-first. The UI should therefore optimise for Victor's daily workflow rather than for public browsing or generic multi-tenant SaaS conventions.

---

# 2. CORE UI/UX PHILOSOPHY

The Job OS should be **decision-first**.

Every major screen should help Victor answer one of these questions:

1. What opportunities are new?
2. Which opportunities are worth pursuing?
3. Why does this opportunity fit me?
4. What evidence do I have?
5. What should I send?
6. What application needs attention?
7. Who needs a follow-up?
8. What happened with my pipeline?
9. What should I do next?

The interface should reduce cognitive load rather than add more information.

### Core principle

```text
DISCOVER
   ↓
UNDERSTAND
   ↓
DECIDE
   ↓
ACT
   ↓
TRACK
```

The UI should support this flow naturally.

Do not force Victor to navigate through multiple pages just to understand a single opportunity.

---

# 3. PRODUCT EXPERIENCE MODEL

The product has six primary operational areas:

```text
                    VICTOR'S JOB OS
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   OPPORTUNITIES       OUTREACH          APPLICATIONS
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                COMPANIES      CONTACTS
                    │             │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │             │
                 PROJECTS       ANALYTICS
```

Supporting areas:

```text
Profile
Settings
Automation
Activity
AI usage
```

---

# 4. CORE PRODUCT AREAS

## Primary Navigation

The primary application navigation should expose:

```text
Overview
Opportunities
Outreach
Applications
Companies
Contacts
Projects
Analytics
```

Secondary navigation:

```text
Automation
Activity
Profile
Settings
```

The navigation should remain compact.

Do not expose every technical feature in the primary navigation.

---

# 5. VISUAL DIRECTION

The Job OS should feel like a premium professional operations application.

It should combine:

- Modern product design
- Editorial information hierarchy
- Strong typography
- High information density
- Restrained colour
- Clear status indicators
- Subtle motion
- Excellent spacing
- Strong data presentation

The UI should feel:

```text
Professional
      ↓
Focused
      ↓
Intelligent
      ↓
Fast
      ↓
Calm
```

It should NOT feel like:

- A generic AI dashboard
- A crypto dashboard
- A trading terminal
- An over-designed SaaS template
- A cluttered admin panel
- A job board clone
- An automation experiment
- A developer tool with excessive technical decoration

---

# 6. DESIGN PRINCIPLE: INFORMATION HIERARCHY

The most important information should always have the strongest visual hierarchy.

For an opportunity:

```text
ROLE
  ↓
COMPANY
  ↓
FIT / RELEVANCE
  ↓
WHY IT FITS
  ↓
EVIDENCE
  ↓
NEXT ACTION
```

Do not allow:

- timestamps
- IDs
- technical metadata
- AI model information
- internal statuses

to visually overpower the opportunity itself.

Technical metadata should be available when useful, but remain secondary.

---

# 7. DESIGN PRINCIPLE: ACTION ORIENTED

Every major page should have an obvious next action.

Examples:

### Opportunities

```text
Review opportunity
```

### Opportunity detail

```text
Review pitch
```

### Outreach

```text
Review draft
```

### Application

```text
Continue application
```

### Follow-up

```text
Review follow-up
```

### Dashboard

```text
Review today's opportunities
```

The user should rarely ask:

> "What am I supposed to do on this page?"

---

# 8. COLOR SYSTEM

The exact visual palette can evolve during implementation, but the system should begin with a restrained neutral foundation.

Suggested semantic palette:

```text
Background
#F8F8F6

Surface
#FFFFFF

Primary Text
#111111

Secondary Text
#666666

Muted Text
#8A8A8A

Border
#E6E6E3

Muted Surface
#F2F2EF
```

Semantic status colours:

```text
Success
Green

Warning
Amber

Danger
Red

Information
Blue

AI / Intelligence
Purple or restrained accent
```

Status colours must be used consistently.

Do not introduce arbitrary colours for individual pages.

---

# 9. TYPOGRAPHY

Typography should establish a strong difference between:

```text
Decision-making information
        ↓
Supporting information
        ↓
Technical metadata
```

Use:

### Display / Heading style

For:

- Page titles
- Large dashboard metrics
- Opportunity titles
- Important section headings

### Functional sans-serif

For:

- Navigation
- Body copy
- Metadata
- Buttons
- Forms
- Tables
- Statuses
- Filters

Avoid excessive font variations.

The interface should feel typographically confident without becoming editorial for its own sake.

---

# 10. GLOBAL APPLICATION SHELL

The authenticated application should use a consistent shell.

Desktop:

```text
┌──────────────────────────────────────────────────────────┐
│ Sidebar │ Top Bar                                        │
│         ├────────────────────────────────────────────────┤
│         │                                                │
│         │                PAGE CONTENT                    │
│         │                                                │
│         │                                                │
│         │                                                │
│         └────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────┘
```

The sidebar should remain persistent on desktop.

The top bar should contain contextual controls rather than duplicate the entire navigation.

The shadcn/ui Sidebar composition is appropriate for this shell because it supports collapsible navigation, grouped menu items, badges and responsive behaviour. citeturn0search0turn0search2

---

# 11. PRIMARY SIDEBAR

Suggested structure:

```text
VICTOR'S JOB OS

MAIN
  Overview
  Opportunities
  Outreach
  Applications

RELATIONSHIPS
  Companies
  Contacts
  Projects

INTELLIGENCE
  Analytics
  Activity
  Automation

SYSTEM
  Profile
  Settings
```

The sidebar should support:

- Active state
- Collapsed state
- Badges
- Tooltips
- Mobile sheet navigation
- Keyboard interaction

The sidebar should not become a dumping ground for every possible feature.

---

# 12. TOP BAR

The top bar should contain contextual controls.

Potential elements:

```text
[ Sidebar Toggle ]

Page title / breadcrumb

                    [ Search ]
                    [ Notifications ]
                    [ Victor avatar ]
```

Depending on the page, contextual actions may appear:

```text
[ Filters ]
[ Refresh ]
[ Export ]
[ Create ]
[ Review Queue ]
```

Do not fill the top bar with permanent buttons that are irrelevant to the current page.

---

# 13. GLOBAL SEARCH

The Job OS should eventually support a command-style search experience.

Potential trigger:

```text
⌘ K
```

Searchable entities:

```text
Jobs
Companies
Contacts
Projects
Applications
Outreach
```

Example:

```text
Search anything...

"React jobs"
"Acme"
"Michael"
"EazyPass"
"follow ups"
```

The search should return grouped results.

Example:

```text
OPPORTUNITIES
Senior React Engineer — Acme

COMPANIES
Acme Inc.

CONTACTS
Michael Smith

PROJECTS
EazyPass
```

Do not build global search before the underlying entities and indexes support it properly.

---

# 14. PRIMARY CTA SYSTEM

The Job OS should use contextual CTAs.

Examples:

```text
REVIEW OPPORTUNITY
ANALYZE JOB
GENERATE DRAFT
REVIEW DRAFT
APPROVE OUTREACH
OPEN APPLICATION
PREPARE APPLICATION
ADD COMPANY
ADD CONTACT
ADD PROJECT
```

Avoid vague CTAs such as:

```text
Click Here
Continue
Submit
Go
```

where a more specific action can be communicated.

---

# 15. CORE ROUTE ARCHITECTURE

The primary application route architecture is:

```text
/
├── /dashboard
│
├── /opportunities
│   └── /opportunities/:id
│
├── /outreach
│   ├── /outreach/review
│   └── /outreach/:id
│
├── /applications
│   └── /applications/:id
│
├── /companies
│   └── /companies/:id
│
├── /contacts
│   └── /contacts/:id
│
├── /projects
│   └── /projects/:id
│
├── /analytics
│
├── /activity
│
├── /automation
│
├── /profile
│
└── /settings
```

Authentication routes:

```text
/login
```

Utility routes:

```text
/404
```

The exact route names may evolve during implementation, but the domain structure should remain stable.

---

# 16. PAGE 01 — DASHBOARD / OVERVIEW

## Route

```text
/dashboard
```

## Purpose

The dashboard is Victor's daily command center.

It should answer:

> **What needs my attention today?**

It should not simply display vanity metrics.

---

## Dashboard Structure

```text
┌──────────────────────────────────────────────────────────┐
│ Good morning, Victor                                     │
│ Here's what needs your attention today.                  │
│                                                          │
│ [ 18 New ] [ 7 Qualified ] [ 4 Review ] [ 2 Follow-up ]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│ TODAY'S PRIORITIES                                       │
│                                                          │
│ Opportunity A                 [ REVIEW ]                 │
│ Opportunity B                 [ REVIEW ]                 │
│ Opportunity C                 [ FOLLOW UP ]              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ NEW OPPORTUNITIES              OUTREACH QUEUE            │
│                                                          │
│ Job cards / list               Drafts awaiting review    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ APPLICATION PIPELINE                                    │
│                                                          │
│ Prepared → Submitted → Interview → Offer               │
└──────────────────────────────────────────────────────────┘
```

---

## Dashboard Sections

### 1. Greeting / Context

Display:

```text
Good morning, Victor.
Here's what needs your attention today.
```

The greeting should not become overly conversational.

### 2. Pipeline Summary

Useful metrics:

```text
New opportunities
Qualified
Awaiting review
Outreach sent
Replies
Follow-ups due
Active applications
Interviews
```

### 3. Today's Priorities

This is the most important dashboard section.

Prioritise:

- High-fit opportunities
- Outreach drafts requiring review
- Follow-ups due
- Applications requiring attention
- Failed automation runs

### 4. Opportunity Feed

Show recent qualified opportunities.

### 5. Outreach Queue

Show drafts awaiting approval.

### 6. Application Pipeline

Show current application states.

### 7. Activity

Show recent system activity.

---

# 17. PAGE 02 — OPPORTUNITIES

## Route

```text
/opportunities
```

## Purpose

The opportunity workspace is the core discovery and qualification surface.

It should allow Victor to:

- Browse discovered jobs
- Filter opportunities
- Identify qualified opportunities
- Review fit
- Open opportunity details
- Move opportunities through the pipeline

---

## Page Structure

```text
OPPORTUNITIES

Discover the roles worth pursuing.

[ Search ] [ Filters ] [ Sort ]

────────────────────────────────────

QUALIFIED
────────────────────────────────────

Senior React Engineer
Acme
Remote
High technical fit
[ REVIEW ]

Frontend Engineer
Company B
Remote
Strong stack match
[ REVIEW ]
```

---

# 18. OPPORTUNITY FILTERS

Potential filters:

```text
Status
Fit
Source
Technology
Location
Remote
Seniority
Employment type
Posted date
Company
```

The interface should support filter chips.

Example:

```text
[ React × ] [ Remote × ] [ Qualified × ]
```

Avoid presenting every possible filter by default.

Use a filter sheet/popover for advanced filtering.

---

# 19. OPPORTUNITY CARD

Each opportunity card should communicate:

```text
Company
Role
Location
Remote status
Posted date
Source
Fit indicator
Matched technologies
Status
Next action
```

Example:

```text
ACME

Senior React Engineer

Remote · Full-time
Posted 2 days ago

React · TypeScript · Node.js · Firebase

Strong technical match

QUALIFIED

[ REVIEW OPPORTUNITY ]
```

The card should not display a large amount of AI metadata.

---

# 20. OPPORTUNITY DETAIL PAGE

## Route

```text
/opportunities/:id
```

## Purpose

This is one of the most important pages in the entire application.

The page should answer:

> **What is this opportunity, why does it fit Victor, what evidence supports that, and what should happen next?**

---

## Detail Page Structure

```text
┌──────────────────────────────────────────────────────────┐
│ ← Opportunities                                          │
│                                                          │
│ Senior React Engineer                                    │
│ Acme Inc.                                                │
│ Remote · Full-time                                       │
│                                                          │
│ [ QUALIFIED ]                       [ NEXT ACTION ▼ ]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ WHY THIS OPPORTUNITY FITS                                │
│                                                          │
│ Technical Fit      Strong                                │
│ Experience Fit     Strong                                │
│ Stack Match        8 / 10                                │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ JOB DESCRIPTION                                         │
│                                                          │
│ ...                                                      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ COMPANY RESEARCH                                         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ RELEVANT PROJECTS                                        │
│                                                          │
│ EazyPass     Eventflow     Trendzhauz                    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ OUTREACH                                                 │
│                                                          │
│ [ GENERATE DRAFT ]                                       │
└──────────────────────────────────────────────────────────┘
```

---

# 21. OPPORTUNITY DETAIL — HEADER

The header should show:

- Job title
- Company
- Location
- Remote status
- Employment type
- Source
- Posted date
- Current pipeline status

Primary actions:

```text
Review
Generate pitch
Open application
Archive
```

Secondary actions:

```text
Open source
Copy URL
Mark as skipped
```

---

# 22. OPPORTUNITY DETAIL — FIT ANALYSIS

The fit section should be visually prominent.

Suggested structure:

```text
FIT ANALYSIS

Technical fit
Strong

Experience fit
Strong

Stack match
High

Relevant projects
3

Concerns
1
```

Then:

```text
MATCHED SKILLS

React
TypeScript
Node.js
Firebase
Firestore
Serverless

MISSING / CONCERNS

AWS
GraphQL
```

AI reasoning should remain readable and evidence-oriented.

Avoid turning the page into an unexplained numerical scoring dashboard.

---

# 23. OPPORTUNITY DETAIL — JOB DESCRIPTION

The job description should be readable.

Use:

- Proper typography
- Section headings
- Lists
- Technology highlighting
- Collapsible sections where appropriate

Do not render the description as an enormous uninterrupted text wall.

Potential subsections:

```text
ABOUT THE ROLE
RESPONSIBILITIES
REQUIREMENTS
NICE TO HAVE
BENEFITS
```

---

# 24. OPPORTUNITY DETAIL — COMPANY RESEARCH

Company research should appear as a concise intelligence section.

Potential content:

```text
ABOUT THE COMPANY
PRODUCT / SERVICE
INDUSTRY
RELEVANT CONTEXT
WHY THIS MATTERS
SOURCE
```

AI-generated summaries must be visually distinguishable from verified source content.

Use labels such as:

```text
AI SUMMARY
SOURCE
```

---

# 25. OPPORTUNITY DETAIL — PORTFOLIO MATCH

The page should show which projects are relevant.

Example:

```text
RELEVANT PROJECTS

EazyPass
Node.js · React
Relevant because this role requires backend/API work.

Eventflow
React · Firebase
Relevant because this role requires serverless product development.

Trendzhauz Media
React · Firebase
Relevant because of the content/product workflow.
```

Each project should link to its project detail page.

---

# 26. OPPORTUNITY DETAIL — NEXT ACTION

Every opportunity should have one primary next action.

Examples:

```text
GENERATE OUTREACH
REVIEW OUTREACH
PREPARE APPLICATION
OPEN APPLICATION
FOLLOW UP
CLOSE OPPORTUNITY
```

The next action should be determined by the opportunity's current state.

---

# 27. PAGE 03 — OUTREACH

## Route

```text
/outreach
```

## Purpose

The outreach workspace manages:

- Drafts
- Review queue
- Approved messages
- Sent messages
- Replies
- Follow-ups

---

## Outreach Navigation

Use tabs:

```text
All
Needs Review
Approved
Scheduled
Sent
Replies
Follow-ups
Closed
```

Avoid separate pages for every status unless the workflow becomes large enough to justify them.

---

# 28. OUTREACH REVIEW QUEUE

## Route

```text
/outreach/review
```

This should be a high-priority operational page.

Example:

```text
OUTREACH REVIEW

4 drafts need your attention.

────────────────────────────────────

Senior React Engineer
Acme

Dear Michael,

[Draft preview...]

Fit evidence:
React · Firebase · Node.js

[ EDIT ] [ APPROVE ] [ REJECT ]

────────────────────────────────────
```

The review interface should minimise the number of clicks required to inspect and approve a draft.

---

# 29. OUTREACH DETAIL

## Route

```text
/outreach/:id
```

Show:

```text
Opportunity
Company
Contact

Email subject
Email body

Personalization evidence
Relevant projects
Draft history

Status
Created
Updated

[ EDIT ]
[ APPROVE ]
```

The user should always be able to understand why a message was generated.

---

# 30. OUTREACH EDITOR

The editor should use a split layout on desktop.

```text
┌──────────────────────────┬───────────────────────────────┐
│ CONTEXT                  │ EMAIL                         │
│                          │                               │
│ Company                  │ Dear Michael,                 │
│ Role                     │                               │
│ Fit                      │ ...                           │
│ Projects                 │ ...                           │
│                          │                               │
│ Evidence                 │                               │
│                          │                               │
│                          │ [ Save Draft ] [ Approve ]    │
└──────────────────────────┴───────────────────────────────┘
```

On mobile:

```text
CONTEXT
   ↓
EMAIL
   ↓
ACTIONS
```

---

# 31. OUTREACH STATUS SYSTEM

The UI should visually represent:

```text
DRAFT
NEEDS REVIEW
APPROVED
SCHEDULED
SENT
REPLIED
FOLLOW-UP DUE
CLOSED
```

Use consistent badges.

Do not use colour alone to communicate status.

---

# 32. PAGE 04 — APPLICATIONS

## Route

```text
/applications
```

## Purpose

Applications track opportunities that have moved from discovery into formal application workflows.

The page should show the entire application pipeline.

---

# 33. APPLICATION PIPELINE

Preferred presentation:

```text
NOT STARTED
      ↓
PREPARING
      ↓
NEEDS REVIEW
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

Terminal states:

```text
REJECTED
WITHDRAWN
CLOSED
```

A Kanban-style presentation may be useful, but it must remain usable with larger volumes.

Provide a list/table alternative if needed.

---

# 34. APPLICATION DETAIL

## Route

```text
/applications/:id
```

The page should show:

```text
ROLE
COMPANY
APPLICATION STATUS

SOURCE OPPORTUNITY

RESUME
COVER LETTER
APPLICATION ANSWERS

SUBMISSION DETAILS

FOLLOW-UP

ACTIVITY HISTORY
```

Primary action depends on state:

```text
CONTINUE PREPARING
REVIEW APPLICATION
APPROVE APPLICATION
OPEN APPLICATION
MARK SUBMITTED
UPDATE STATUS
```

---

# 35. APPLICATION PREPARATION

The preparation workspace should be divided into:

```text
APPLICATION CONTEXT
      ↓
RESUME
      ↓
COVER LETTER
      ↓
ANSWERS
      ↓
REVIEW
```

Every AI-generated item should be editable.

The interface must make it clear which content is:

```text
Verified
AI Draft
Needs Review
Approved
```

---

# 36. BROWSER AUTOMATION UI

Browser automation belongs to V2+.

When implemented, the UI should not hide automation state.

Example:

```text
APPLICATION AUTOMATION

Status
Ready

Browser session
Connected

Current step
Filling application form

Progress
██████████░░ 78%

[ PAUSE ]
[ STOP ]
```

If automation stops because of:

- CAPTCHA
- unexpected page
- authentication challenge
- security verification
- missing required information

show a clear human-action state:

```text
ACTION REQUIRED

The application requires manual verification.

[ OPEN APPLICATION ]
```

Never present an automation failure as a successful submission.

---

# 37. PAGE 05 — COMPANIES

## Route

```text
/companies
```

## Purpose

The company workspace provides relationship and research context around hiring organisations.

---

## Company List

Show:

```text
Company
Industry
Relevant roles
Opportunities
Contacts
Last activity
Status
```

Example:

```text
ACME
Technology

3 opportunities
1 contact
Last activity: Today

[ VIEW COMPANY ]
```

---

# 38. COMPANY DETAIL

## Route

```text
/companies/:id
```

Suggested structure:

```text
COMPANY HEADER

About
Website
Industry
Location

OPEN OPPORTUNITIES

CONTACTS

COMPANY RESEARCH

OUTREACH HISTORY

APPLICATION HISTORY

ACTIVITY
```

The company page should become the central context layer for repeated interactions with the same organisation.

---

# 39. PAGE 06 — CONTACTS

## Route

```text
/contacts
```

Contacts represent people connected to companies and opportunities.

Potential fields:

```text
Name
Role
Company
Email
LinkedIn
Relationship
Last contact
Next follow-up
```

---

# 40. CONTACT DETAIL

## Route

```text
/contacts/:id
```

Show:

```text
CONTACT

Name
Role
Company

CONTACT INFORMATION

LINKED OPPORTUNITIES

OUTREACH HISTORY

FOLLOW-UPS

ACTIVITY
```

The interface should make repeated outreach to the same person obvious.

---

# 41. PAGE 07 — PROJECTS / PORTFOLIO

## Route

```text
/projects
```

## Purpose

Projects are the evidence layer behind outreach and applications.

The page should allow Victor to quickly understand:

- What he built
- Technologies used
- Outcomes
- Relevance
- Where the project can be used as proof

---

# 42. PROJECT DETAIL

## Route

```text
/projects/:id
```

Suggested layout:

```text
PROJECT

EazyPass

What was built
Problem
Solution
Victor's contribution
Technologies
Verified outcomes
URL

USED IN OPPORTUNITIES

USED IN OUTREACH

RELEVANCE TAGS
```

The project page should distinguish verified metrics from general descriptions.

---

# 43. PAGE 08 — ANALYTICS

## Route

```text
/analytics
```

## Purpose

Analytics should help Victor understand whether the job-search system is working.

Useful metrics:

```text
Opportunities discovered
Qualified opportunities
Qualification rate
Outreach drafts
Outreach sent
Replies
Reply rate
Applications submitted
Interviews
Offers
```

Additional breakdowns:

```text
By source
By role
By technology
By company
By outreach type
By date
```

Do not turn analytics into a vanity dashboard.

---

# 44. ANALYTICS DESIGN

Analytics should focus on trends.

Example:

```text
OUTREACH ACTIVITY

     ╭──────────────╮
     │              ╰────
─────╯
```

Then:

```text
THIS WEEK

Opportunities       126
Qualified            38
Outreach             24
Replies               5
Applications          7
Interviews            2
```

Charts should answer specific questions.

Example:

> Which opportunity sources are producing useful conversations?

Not simply:

> How many records exist?

---

# 45. PAGE 09 — ACTIVITY

## Route

```text
/activity
```

## Purpose

Activity provides an operational history of the system.

Example:

```text
TODAY

10:32 AM
24 new opportunities discovered.

10:28 AM
Acme Senior React Engineer qualified.

10:25 AM
Pitch generated for Acme.

10:12 AM
Application status updated.

9:54 AM
Follow-up became due.
```

Filters:

```text
All
Discovery
AI
Outreach
Applications
Automation
System
```

---

# 46. PAGE 10 — AUTOMATION

## Route

```text
/automation
```

## Purpose

Automation should provide visibility into scheduled workflows.

Potential jobs:

```text
Job discovery
Opportunity analysis
Company research
Pitch generation
Follow-up processing
Email processing
```

Example:

```text
AUTOMATION

Job Discovery
Last run: 8:00 AM
Next run: Tomorrow 8:00 AM
Status: Healthy

Pitch Generation
Last run: 8:15 AM
Status: Healthy

Follow-up Processor
Last run: 9:00 AM
Status: Healthy
```

---

# 47. AUTOMATION DETAIL

Clicking an automation should show:

```text
AUTOMATION

Job Discovery

Status
Healthy

Schedule
Daily

Last execution
Today, 8:00 AM

Duration
24s

Jobs fetched
142

New
38

Duplicates
81

Rejected
23

Recent executions
...
```

Failed executions should clearly show:

```text
FAILED

Reason
Source request timed out.

[ VIEW LOG ]
[ RETRY ]
```

---

# 48. PAGE 11 — PROFILE

## Route

```text
/profile
```

## Purpose

The profile is the canonical professional identity used by the AI and application system.

Sections:

```text
Identity
Professional Summary
Skills
Technologies
Experience
Education
Preferred Roles
Location Preferences
Remote Preferences
Portfolio
Verified Achievements
Contact Information
```

The UI should clearly communicate:

> This information is used to qualify opportunities and generate applications.

---

# 49. PROFILE — VERIFIED INFORMATION

Important profile fields should support a verification state.

Example:

```text
React
VERIFIED

Firebase
VERIFIED

Node.js
VERIFIED

AWS
NEEDS VERIFICATION
```

The AI should only use approved profile information as factual evidence.

---

# 50. PAGE 12 — SETTINGS

## Route

```text
/settings
```

Settings should be grouped.

```text
Account
Notifications
Opportunity Preferences
Outreach Preferences
Application Preferences
AI
Email
Automation
Security
```

Do not expose technical Firebase configuration as normal user settings.

---

# 51. SETTINGS — OPPORTUNITY PREFERENCES

Potential settings:

```text
Preferred roles
Preferred technologies
Preferred locations
Remote preference
Minimum relevance threshold
Employment types
Excluded roles
Excluded companies
```

These settings should influence discovery and qualification.

---

# 52. SETTINGS — OUTREACH PREFERENCES

Potential controls:

```text
Daily outreach target
Require approval before sending
Maximum follow-ups
Follow-up interval
Preferred CTA style
Default sender identity
```

External sending must remain approval-controlled unless a separately approved policy exists.

---

# 53. SETTINGS — AI

Potential settings:

```text
AI provider
Default model
Qualification model
Drafting model
Research model
AI usage limits
```

Provider credentials must never be displayed or stored client-side.

---

# 54. SETTINGS — EMAIL

Display operational email information:

```text
Sender
victor@victorchidera.com

Sending status
Connected

Domain
victorchidera.com

Delivery status
Verified
```

Do not display private SMTP passwords or API keys.

---

# 55. EMPTY STATES

Every dynamic collection must have an intentional empty state.

Examples:

### Opportunities

```text
NO NEW OPPORTUNITIES

Your discovery pipeline has not found
new opportunities yet.

[ RUN DISCOVERY ]
```

### Outreach

```text
NO DRAFTS TO REVIEW

You're all caught up.
```

### Applications

```text
NO ACTIVE APPLICATIONS

Applications you start will appear here.
```

### Contacts

```text
NO CONTACTS YET

Contacts associated with opportunities
will appear here.
```

Empty states should guide the next action rather than simply say "No data."

---

# 56. LOADING STATES

Every asynchronous page or section requires an appropriate loading state.

Use skeletons where the final layout is predictable.

Examples:

```text
Dashboard skeleton
Opportunity list skeleton
Opportunity detail skeleton
Company detail skeleton
Application skeleton
Analytics skeleton
```

Skeleton dimensions should resemble the final content so the interface does not jump when data arrives.

The shadcn ecosystem provides a Skeleton primitive appropriate for predictable loading layouts. citeturn0search3

Avoid using a spinner everywhere.

---

# 57. ERROR STATES

Errors must be human-readable.

Example:

```text
WE COULDN'T LOAD THIS OPPORTUNITY

Something went wrong while retrieving
this opportunity.

[ TRY AGAIN ]
```

Do not expose:

- Firestore errors
- Stack traces
- Internal IDs
- API keys
- Firebase configuration
- Function internals
- Provider credentials

---

# 58. FORM STATES

Every form should support:

```text
DEFAULT
LOADING
SUCCESS
ERROR
DISABLED
```

Example:

```text
SAVE CHANGES
```

Loading:

```text
SAVING...
```

Success:

```text
SAVED
```

Error:

```text
UNABLE TO SAVE

Please try again.
```

Buttons should communicate the operation being performed.

---

# 59. CONFIRMATION & DESTRUCTIVE ACTIONS

Destructive actions require confirmation.

Examples:

```text
Archive opportunity
Delete contact
Delete project
Reject outreach
Withdraw application
Disable automation
```

Use shadcn Dialog/Alert Dialog patterns.

Example:

```text
ARCHIVE OPPORTUNITY?

This opportunity will be removed from
your active pipeline.

[ CANCEL ] [ ARCHIVE ]
```

Do not use confirmation dialogs for ordinary non-destructive actions.

---

# 60. TABLES & LISTS

Tables should be used where comparison is useful.

Example:

```text
OPPORTUNITIES

ROLE                 COMPANY      FIT       STATUS
──────────────────────────────────────────────────
React Engineer       Acme         High      Qualified
Frontend Engineer    Nova         Medium    Review
Full Stack Engineer  Beta         High      Applied
```

Columns should be limited to decision-useful information.

On mobile, tables should transform into stacked cards or horizontally scroll only when necessary.

---

# 61. KANBAN INTERFACES

Kanban is appropriate for workflows such as:

```text
Applications
```

and potentially:

```text
Outreach
```

Columns should represent actual lifecycle states.

Do not create arbitrary columns merely for visual appeal.

Each card should contain:

```text
Role
Company
Current state
Important date
Next action
```

---

# 62. MODALS, SHEETS & DRAWERS

Use dialogs for focused confirmation or editing.

Use sheets for:

- Filters
- Mobile navigation
- Quick details
- Secondary context

Use full pages for:

- Opportunity detail
- Application detail
- Company detail
- Project detail
- Complex editors

Do not put an entire complex workflow inside a modal.

---

# 63. MOTION SYSTEM

Framer Motion is the primary motion system.

Motion should be:

> **Subtle → Intentional → Fast → Consistent**

Use motion for:

- Page transitions
- Sidebar transitions
- Mobile navigation
- Cards entering the viewport
- Status changes
- Modal/sheet transitions
- Expand/collapse
- Toast/feedback
- Pipeline movement
- Loading transitions
- Dashboard state changes

Avoid:

- Constant animation
- Excessive parallax
- Long transitions
- Screen shaking
- Glitch effects
- Unnecessary 3D
- Animation that slows workflows

Respect reduced-motion preferences.

---

# 64. PAGE TRANSITIONS

Page transitions should be subtle.

Preferred behaviour:

```text
Current page
     ↓
Short fade / directional transition
     ↓
New page
```

Do not make every navigation feel like a presentation.

The application should feel fast.

---

# 65. CARD INTERACTIONS

Opportunity cards, company cards and project cards should have restrained interaction.

Example:

```text
DEFAULT
────────────────
Company
Role
Fit
Status
────────────────

HOVER
────────────────
Slight elevation
Subtle border change
Action becomes clearer
────────────────
```

Avoid dramatic scaling.

---

# 66. OPPORTUNITY PRIORITY VISUALS

Priority should be communicated through hierarchy rather than oversized badges.

Example:

```text
HIGH FIT

Senior React Engineer
Acme

React · Firebase · Node.js

Strong technical match
```

Avoid:

```text
🔥🔥🔥🔥🔥 BEST JOB!!!
```

The UI should remain professional.

---

# 67. AI CONTENT VISUAL LANGUAGE

AI-generated content should be identifiable but not visually distracting.

Use subtle labels:

```text
AI ANALYSIS
AI SUMMARY
AI DRAFT
```

AI content should not be visually presented as unquestionable truth.

Where relevant, show:

```text
Based on:
Job description
Victor's profile
Portfolio projects
Company research
```

---

# 68. SOURCE TRACEABILITY UI

Every opportunity should allow Victor to access its origin.

Example:

```text
SOURCE

Greenhouse
Job ID: 12345

[ OPEN SOURCE ]
```

For other sources:

```text
Lever
Ashby
Direct company careers page
```

Source information should be secondary but accessible.

---

# 69. DATA-DRIVEN UI ARCHITECTURE

The UI should follow:

```text
Firestore
     ↓
Firebase Service
     ↓
React Hook
     ↓
Page
     ↓
Domain Component
     ↓
UI Primitive
```

Example:

```text
OpportunitiesPage
      ↓
useOpportunities()
      ↓
opportunitiesService
      ↓
Firestore
      ↓
OpportunityList
      ↓
OpportunityCard
      ↓
shadcn/ui primitives
```

Do not scatter raw Firestore queries throughout visual components.

---

# 70. FRONTEND COMPONENT ARCHITECTURE

Suggested structure:

```text
src/
├── assets/
│
├── components/
│   ├── ui/
│   │
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── PageContainer.tsx
│   │   └── MobileNavigation.tsx
│   │
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx
│   │   ├── PipelineSummary.tsx
│   │   ├── PriorityQueue.tsx
│   │   ├── OpportunityPreview.tsx
│   │   ├── OutreachQueue.tsx
│   │   └── ApplicationPipeline.tsx
│   │
│   ├── opportunities/
│   │   ├── OpportunityCard.tsx
│   │   ├── OpportunityList.tsx
│   │   ├── OpportunityFilters.tsx
│   │   ├── OpportunityHeader.tsx
│   │   ├── FitAnalysis.tsx
│   │   ├── JobDescription.tsx
│   │   ├── CompanyResearch.tsx
│   │   ├── PortfolioMatch.tsx
│   │   └── OpportunityNextAction.tsx
│   │
│   ├── outreach/
│   │   ├── OutreachCard.tsx
│   │   ├── OutreachQueue.tsx
│   │   ├── OutreachEditor.tsx
│   │   ├── OutreachPreview.tsx
│   │   └── OutreachStatus.tsx
│   │
│   ├── applications/
│   │   ├── ApplicationCard.tsx
│   │   ├── ApplicationBoard.tsx
│   │   ├── ApplicationDetail.tsx
│   │   ├── ApplicationReview.tsx
│   │   └── AutomationStatus.tsx
│   │
│   ├── companies/
│   │   ├── CompanyCard.tsx
│   │   ├── CompanyList.tsx
│   │   ├── CompanyHeader.tsx
│   │   └── CompanyResearch.tsx
│   │
│   ├── contacts/
│   │   ├── ContactCard.tsx
│   │   ├── ContactList.tsx
│   │   └── ContactTimeline.tsx
│   │
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectList.tsx
│   │   └── ProjectEvidence.tsx
│   │
│   ├── analytics/
│   │   ├── MetricCard.tsx
│   │   ├── PipelineChart.tsx
│   │   ├── SourcePerformance.tsx
│   │   └── OutreachPerformance.tsx
│   │
│   └── automation/
│       ├── AutomationCard.tsx
│       ├── AutomationStatus.tsx
│       └── ExecutionLog.tsx
│
├── hooks/
├── pages/
├── services/
├── types/
├── utils/
└── App.tsx
```

The exact structure may evolve, but domain boundaries should remain clear.

---

# 71. PAGE COMPONENT ARCHITECTURE

Pages should orchestrate domain components rather than contain every UI element directly.

Example:

```text
OpportunityDetailsPage
        │
        ├── OpportunityHeader
        ├── FitAnalysis
        ├── JobDescription
        ├── CompanyResearch
        ├── PortfolioMatch
        ├── OutreachPreview
        └── NextActionPanel
```

This makes each area independently maintainable.

---

# 72. SHADCN/UI DESIGN SYSTEM

shadcn/ui is the reusable interface foundation.

Expected primitives include:

```text
Button
Badge
Card
Dialog
Alert Dialog
Sheet
Dropdown Menu
Tabs
Input
Textarea
Select
Checkbox
Switch
Form
Table
Tooltip
Popover
Command
Skeleton
Separator
Scroll Area
Avatar
Progress
Toast / Sonner
```

Only use components where they solve a real interaction problem.

Custom domain components should be composed from these primitives.

---

# 73. RESPONSIVE DESIGN

Responsive design is mandatory.

## Desktop

Prioritise:

- Persistent sidebar
- Multi-column layouts
- Dense information
- Split-screen editors
- Data tables
- Kanban workflows

## Tablet

Prioritise:

- Collapsible sidebar
- Reduced columns
- Responsive cards
- Stacked secondary panels

## Mobile

Prioritise:

- Mobile navigation
- Single-column layouts
- Large touch targets
- Readable typography
- Bottom or contextual action areas
- Stacked information

Do not simply shrink the desktop interface.

---

# 74. MOBILE NAVIGATION

On mobile, use a shadcn Sheet or equivalent navigation pattern.

Example:

```text
VICTOR'S JOB OS

01  Overview
02  Opportunities
03  Outreach
04  Applications
05  Companies
06  Contacts
07  Projects
08  Analytics

──────────────

Automation
Activity
Profile
Settings
```

The menu should close after navigation.

Touch targets should be comfortable.

---

# 75. MOBILE OPPORTUNITY DETAIL

The opportunity detail page should become:

```text
ROLE
COMPANY
STATUS
      ↓
FIT
      ↓
JOB
      ↓
RESEARCH
      ↓
PROJECTS
      ↓
OUTREACH
      ↓
NEXT ACTION
```

The primary action should remain accessible without requiring excessive scrolling.

Where appropriate, use a sticky bottom action bar:

```text
[ REVIEW DRAFT ]
```

---

# 76. SEARCH & FILTERING

Search should be introduced where volume justifies it.

Primary search areas:

```text
Opportunities
Companies
Contacts
Projects
Applications
```

Opportunity filters:

```text
Role
Technology
Source
Location
Remote
Fit
Status
Date
```

Search and filters should persist within the current workflow when practical.

---

# 77. SORTING

Useful opportunity sorting:

```text
Most relevant
Newest
Recently discovered
Highest fit
Company
Status
```

Default sorting should favour useful action rather than arbitrary database ordering.

---

# 78. PAGINATION / INFINITE SCROLL

Large datasets should not be rendered all at once.

Use appropriate pagination or incremental loading.

Avoid unbounded Firestore reads.

The UI should communicate:

```text
Showing 25 of 142 opportunities
```

where useful.

---

# 79. NOTIFICATION SYSTEM

Notifications should be operational.

Examples:

```text
7 new qualified opportunities
4 outreach drafts need review
2 follow-ups are due
1 application requires attention
1 automation failed
```

Notifications should link directly to the relevant workflow.

Avoid notification noise.

---

# 80. DAILY WORKFLOW UX

The ideal daily workflow is:

```text
Open Job OS
     ↓
Dashboard
     ↓
Review priorities
     ↓
Open qualified opportunities
     ↓
Review fit
     ↓
Review relevant projects
     ↓
Review generated outreach
     ↓
Approve selected outreach
     ↓
Check applications
     ↓
Handle follow-ups
     ↓
Done
```

The product should make this workflow fast.

---

# 81. OPPORTUNITY-TO-OUTREACH FLOW

The UI should provide a continuous transition:

```text
Opportunity
     ↓
Qualification
     ↓
Research
     ↓
Portfolio Match
     ↓
Generate Draft
     ↓
Review Draft
     ↓
Approve
     ↓
Send
```

Victor should not have to manually copy information between pages.

The application should carry context forward automatically.

---

# 82. OPPORTUNITY-TO-APPLICATION FLOW

Similarly:

```text
Opportunity
     ↓
Prepare Application
     ↓
Resume
     ↓
Cover Letter
     ↓
Answers
     ↓
Review
     ↓
Approve
     ↓
Submit
```

The originating opportunity remains attached throughout the lifecycle.

---

# 83. STATE-DRIVEN UI

The interface must respond to actual entity state.

Example:

```text
Opportunity = NEW
→ ANALYZE

Opportunity = QUALIFIED
→ REVIEW

Opportunity = OUTREACH_DRAFTED
→ REVIEW DRAFT

Outreach = APPROVED
→ SEND / SCHEDULE

Application = PREPARING
→ CONTINUE

Application = NEEDS_REVIEW
→ REVIEW APPLICATION

Application = SUBMITTED
→ TRACK
```

Do not show actions that are invalid for the current state.

---

# 84. ACCESSIBILITY

The UI must support:

- Keyboard navigation
- Visible focus
- Semantic HTML
- Accessible labels
- Screen-reader-friendly states
- Sufficient colour contrast
- Reduced motion
- Proper dialog focus management
- Keyboard-accessible menus
- Clear form errors

Do not rely on colour alone for status.

---

# 85. PERFORMANCE

The UI should remain fast despite data-heavy workflows.

Use:

- Lazy-loaded pages where appropriate
- Efficient Firestore queries
- Pagination
- Image optimisation
- Memoization where justified
- Skeleton loading
- Controlled animations
- Minimal unnecessary re-renders

Do not optimise prematurely.

Measure before introducing complex optimisation.

---

# 86. FIRESTORE ↔ UI BOUNDARY

The UI must not treat Firestore as a raw frontend data store.

Preferred:

```text
Page
 ↓
Hook
 ↓
Service
 ↓
Firestore
```

For trusted operations:

```text
Page
 ↓
Hook
 ↓
Service
 ↓
Callable / HTTP Cloud Function
 ↓
External API / protected operation
```

Sensitive operations must remain server-side.

---

# 87. AI ↔ UI BOUNDARY

AI operations should have explicit states.

Example:

```text
READY
   ↓
GENERATING
   ↓
GENERATED
   ↓
NEEDS REVIEW
   ↓
APPROVED
```

During generation:

```text
ANALYZING OPPORTUNITY...
```

or:

```text
DRAFTING OUTREACH...
```

Do not make the user stare at a blank screen.

---

# 88. AI GENERATION FAILURE

If AI generation fails:

```text
WE COULDN'T GENERATE THIS DRAFT

The AI service was unable to complete
the request.

[ TRY AGAIN ]
```

Do not automatically retry indefinitely.

If a retry is available, communicate it clearly.

---

# 89. EXTERNAL ACTION STATES

Email and application submission require especially clear states.

Email:

```text
DRAFT
APPROVED
SENDING
SENT
FAILED
```

Application:

```text
PREPARING
REVIEW
APPROVED
SUBMITTING
SUBMITTED
FAILED
```

Never display `SENT` or `SUBMITTED` before the external operation has actually succeeded.

---

# 90. CONFIRMATION OF SUCCESS

Successful external actions should produce explicit confirmation.

Example:

```text
OUTREACH SENT

Your message to Michael at Acme was
successfully sent.

[ VIEW OUTREACH ]
```

Application:

```text
APPLICATION SUBMITTED

Your application for Senior React Engineer
at Acme has been recorded.

[ VIEW APPLICATION ]
```

---

# 91. AUDIT / ACTIVITY VISIBILITY

Every consequential action should be traceable.

The UI should make it possible to see:

```text
Who
What
When
Result
```

For Victor's single-user system:

```text
Action
Timestamp
Entity
Result
```

Example:

```text
10:42 AM
Outreach approved
Acme — Senior React Engineer

10:44 AM
Email sent
Acme — Michael Smith
```

---

# 92. EMPTY DASHBOARD STATE

For a brand-new installation:

```text
WELCOME TO YOUR JOB OS

Your opportunity pipeline is ready.

Start by connecting your profile and
running your first discovery workflow.

[ COMPLETE PROFILE ]
[ RUN FIRST DISCOVERY ]
```

The empty dashboard should teach the system rather than look broken.

---

# 93. ONBOARDING

Initial onboarding should be lightweight.

Suggested sequence:

```text
1. Profile
2. Skills
3. Preferred roles
4. Location preferences
5. Portfolio projects
6. Email configuration
7. Discovery preferences
```

Do not create a long multi-page onboarding flow if the same information can be completed progressively.

---

# 94. FIRST-RUN EXPERIENCE

After setup:

```text
PROFILE READY ✓
PROJECTS READY ✓
EMAIL READY ✓

READY TO DISCOVER

[ RUN FIRST DISCOVERY ]
```

After discovery:

```text
38 NEW OPPORTUNITIES

[ REVIEW QUALIFIED ]
```

---

# 95. CONTENT DENSITY

The Job OS should be information-rich without being cluttered.

Use:

- Clear sections
- Strong spacing
- Dense metadata where useful
- Collapsible secondary information
- Progressive disclosure

Do not show everything at once.

---

# 96. PROGRESSIVE DISCLOSURE

Primary content:

```text
Role
Company
Fit
Next action
```

Secondary content:

```text
Description
Research
Projects
Metadata
Source
```

Technical information:

```text
Raw source
AI metadata
Execution IDs
Automation details
```

Technical information should only appear when useful.

---

# 97. NO GENERIC DASHBOARD CARDS

Do not build every section as:

```text
┌───────────────┐
│ ICON          │
│ 123           │
│ Some metric   │
└───────────────┘
```

Cards should exist because they improve grouping or interaction.

Not every metric needs a card.

---

# 98. DESIGN SYSTEM CONSISTENCY

The same semantic component should look and behave consistently everywhere.

For example:

```text
Status Badge
```

should not look different on:

- Opportunities
- Outreach
- Applications
- Companies

Likewise:

```text
Primary Button
Secondary Button
Danger Button
```

must maintain consistent visual meaning.

---

# 99. SEO

The Job OS is primarily private.

SEO is therefore not a primary product requirement.

Authenticated application pages should generally not be treated as public SEO pages.

Do not expose private opportunity or contact data for search indexing.

Public SEO requirements only apply if a future public-facing component is explicitly added.

---

# 100. SECURITY IN THE UI

The UI should never reveal:

- API keys
- SMTP passwords
- Firebase service account credentials
- Private tokens
- Browser session credentials
- Internal infrastructure secrets

Internal IDs may be hidden where they provide no user value.

Security enforcement remains server-side.

The frontend should never be the only authorization layer.

---

# 101. ERROR BOUNDARIES

Major application areas should fail gracefully.

A failure in:

```text
Analytics
```

should not make:

```text
Opportunities
```

unusable.

A failure in:

```text
AI generation
```

should not break:

```text
Job discovery
```

The UI should isolate failure where practical.

---

# 102. V1 UI SCOPE

V1 focuses on:

```text
Dashboard
Opportunities
Opportunity Detail
Outreach
Outreach Review
Companies
Projects
Activity
Automation
Profile
Settings
```

The main V1 loop is:

```text
DISCOVER
 ↓
QUALIFY
 ↓
RESEARCH
 ↓
MATCH
 ↓
DRAFT
 ↓
REVIEW
 ↓
OUTREACH
```

V1 should not be overloaded with advanced application automation.

---

# 103. V2 UI SCOPE

V2 adds:

```text
Applications
Application Detail
Application Preparation
Resume Variants
Application Answers
Browser Automation
Submission Monitoring
Interview Tracking
```

The primary V2 loop becomes:

```text
DISCOVER
 ↓
QUALIFY
 ↓
PREPARE
 ↓
REVIEW
 ↓
APPROVE
 ↓
SUBMIT
 ↓
TRACK
```

---

# 104. V3 UI SCOPE

V3 adds:

```text
Career Analytics
Source Intelligence
Outreach Analytics
Application Analytics
Contact Intelligence
Career CRM
Long-term opportunity history
Career insights
```

The product evolves into:

> **Victor's full personal career operating system.**

Do not implement V2/V3 screens while building V1 unless explicitly approved.

---

# 105. PAGE IMPLEMENTATION RULE

When implementing a page:

1. Follow the approved route.
2. Follow the page purpose.
3. Reuse existing components.
4. Follow the design system.
5. Use real Firestore data where available.
6. Use approved placeholders where data is unavailable.
7. Implement loading state.
8. Implement empty state.
9. Implement error state.
10. Implement responsive behaviour.
11. Implement accessibility.
12. Add appropriate motion.
13. Validate the implementation.
14. Stop.

Do not redesign unrelated pages while implementing one page.

---

# 106. COMPONENT IMPLEMENTATION RULE

Before creating a new component, check whether an existing component can be reused.

Prefer:

```text
Existing primitive
      ↓
Existing domain component
      ↓
New component only when necessary
```

Do not create duplicate:

```text
Button
Badge
Card
Modal
Status
Table
```

components when the design system already provides them.

---

# 107. DATA STATE QUALITY BAR

A page is not complete simply because data renders.

Every data-driven page should consider:

```text
Loading
Empty
Success
Error
Retry
```

For interactive workflows:

```text
Idle
Loading
Success
Failure
```

For consequential actions:

```text
Review
Approval
Execution
Confirmation
Failure
```

---

# 108. FINAL UI/UX QUALITY BAR

A completed Job OS page should satisfy:

```text
✓ Clear purpose
✓ Clear hierarchy
✓ Strong typography
✓ Consistent spacing
✓ Correct status representation
✓ Useful primary action
✓ Responsive layout
✓ Mobile usability
✓ Accessible interaction
✓ Loading state
✓ Empty state
✓ Error state
✓ Appropriate motion
✓ Reusable components
✓ Correct Firestore integration
✓ No leaked secrets
✓ No invalid actions
✓ Performance awareness
```

A page is not finished simply because:

> "It looks good."

It must also make the workflow easier.

---

# 109. GOLDEN UI/UX PRINCIPLE

The most important design principle for Victor's Job OS is:

> **The interface should make the right opportunity, the evidence behind it, and the next action immediately clear. The UI should reduce the work required to move a qualified opportunity forward.**

The experience should feel:

```text
CLEAR
  ↓
INTELLIGENT
  ↓
FOCUSED
  ↓
FAST
  ↓
ACTIONABLE
```

Not:

```text
CLUTTERED
  ↓
DECORATIVE
  ↓
OVER-ANIMATED
  ↓
GENERIC
  ↓
CONFUSING
```

---

# 110. FINAL EXPERIENCE MODEL

The complete Job OS experience should follow:

```text
                         VICTOR
                           │
                           ▼
                      DASHBOARD
                           │
             ┌─────────────┼─────────────┐
             │             │             │
        OPPORTUNITIES   OUTREACH    APPLICATIONS
             │             │             │
             ▼             ▼             ▼
          QUALIFY        REVIEW        PREPARE
             │             │             │
             ▼             ▼             ▼
          RESEARCH       APPROVE       APPROVE
             │             │             │
             ▼             ▼             ▼
        PORTFOLIO MATCH   SEND          SUBMIT
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                        TRACK
                           │
                           ▼
                       ANALYTICS
```

Supporting intelligence:

```text
COMPANIES
CONTACTS
PROJECTS
ACTIVITY
AUTOMATION
PROFILE
SETTINGS
```

The user should always understand:

```text
Where am I?
What am I looking at?
Why does it matter?
What evidence supports it?
What can I do next?
What happened after I acted?
```

---

# 111. UI ↔ APPLICATION ARCHITECTURE

The relationship between the interface and backend should remain explicit:

```text
                    VICTOR
                      │
                      ▼
               REACT APPLICATION
                      │
             ┌────────┴────────┐
             │                 │
          ROUTING          UI / UX
             │                 │
             └────────┬────────┘
                      │
                 REACT HOOKS
                      │
                      ▼
              FIREBASE SERVICES
                      │
          ┌───────────┴───────────┐
          │                       │
      FIRESTORE             CLOUD FUNCTIONS
          │                       │
          │              ┌────────┼────────┐
          │              │        │        │
          │             ATS      AI      EMAIL
          │
          └──────────────┬───────────────
                         │
                     APPLICATION UI
```

The UI should remain unaware of unnecessary infrastructure details.

---

# 112. FINAL ARCHITECTURE PRINCIPLE

The UI architecture must reinforce the product architecture:

```text
React
  ↓
Hooks
  ↓
Services
  ↓
Firebase
  ↓
Firestore / Cloud Functions
  ↓
External systems
```

The user should experience a single coherent product.

The underlying complexity should remain behind the interface.

---

# 113. FINAL IMPLEMENTATION RULE

This UI/UX specification does not override:

- `ProjectOverview.md`
- `context.md`
- Firebase Security Rules
- Approved Firestore architecture
- Approved Cloud Function architecture
- Lead Developer instructions

When conflicts occur:

1. Preserve security.
2. Preserve approved architecture.
3. Surface the conflict.
4. Do not silently redesign the system.

---

# 114. FINAL PRODUCT STANDARD

The final product should not feel like:

> "A React dashboard that happens to collect jobs."

It should feel like:

> **Victor's personal command center for finding, understanding, pursuing and tracking the developer opportunities that actually matter.**

The interface should make the system's intelligence useful without making the AI itself the centre of attention.

The product's visual hierarchy should always favour:

```text
OPPORTUNITY
     ↓
EVIDENCE
     ↓
DECISION
     ↓
ACTION
     ↓
OUTCOME
```

That is the core UI/UX model for Victor's Job OS.
