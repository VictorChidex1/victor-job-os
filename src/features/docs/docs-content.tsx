import type { ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Archive,
  BadgeCheck,
  Bot,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Compass,
  FolderKanban,
  Info,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Mail,
  MessageSquare,
  Milestone,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  UserRound,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Availability,
  Callout,
  Faq,
  FeatureCard,
  FeatureGrid,
  Glossary,
  RoadmapItem,
  Steps,
} from '@/features/docs/docs-ui'
import { InteractivePipelineStepper } from '@/features/docs/InteractivePipeline'
import { QualificationDemo } from '@/features/docs/QualificationDemo'
import { CodePromptTabs } from '@/features/docs/CodePromptTabs'

export interface DocsSection {
  id: string
  label: string
  title: string
  description: string
  content: ReactNode
}

export const DOCS_UPDATED = 'November 2026'

export const DOC_SECTIONS: DocsSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'One workspace for the whole job search',
    description:
      'Victor Job OS brings discovery, qualification, company research, outreach, and applications into one private operating loop.',
    content: (
      <>
        <p className="text-base text-foreground leading-relaxed">
          The job search is rarely just about finding a role. It is the research, the tailored
          message, the follow-up, the application status, and the next action that make the
          difference. Victor Job OS keeps those pieces connected so you can spend less time
          reconstructing context and more time making decisions.
        </p>

        <InteractivePipelineStepper />

        <FeatureGrid>
          <FeatureCard icon={Compass} title="Discover">
            Collect relevant opportunities from supported job sources, normalize the data, and
            remove duplicates before they reach your review queue.
          </FeatureCard>
          <FeatureCard icon={Target} title="Qualify">
            Compare an opportunity with your profile, preferences, skills, and projects so you can
            decide whether it is worth pursuing.
          </FeatureCard>
          <FeatureCard icon={Sparkles} title="Prepare">
            Use research, project evidence, and AI-assisted drafts to prepare better outreach and
            application materials.
          </FeatureCard>
          <FeatureCard icon={ClipboardList} title="Track">
            Keep applications, outreach, follow-ups, notes, and timelines in one place instead of
            spread across tabs, documents, and inboxes.
          </FeatureCard>
        </FeatureGrid>

        <Callout icon={ShieldCheck} title="You stay in control" tone="success">
          AI can analyze, summarize, match, and draft. Consequential actions — approving outreach,
          approving application materials, and submitting — remain human decisions.
        </Callout>

        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Availability status="available" />
            <h3 className="text-sm font-semibold text-foreground">In the current build</h3>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              'Opportunity discovery and qualification',
              'Company research and contacts',
              'Outreach drafting and approval',
              'Follow-up tracking',
              'Application pipeline and timeline',
              'Application preparation workspace',
              'Profile and project evidence',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </>
    ),
  },
  {
    id: 'quick-start',
    label: 'Quick start',
    title: 'From sign-in to your first tracked application',
    description:
      'A practical path through the workspace. You do not need to use every feature on day one.',
    content: (
      <>
        <Steps
          steps={[
            {
              title: 'Sign in to your private workspace',
              description:
                'Open Victor Job OS and sign in. Every opportunity, application, company, and message is scoped to your account.',
            },
            {
              title: 'Review your profile and projects',
              description:
                'Your profile and project evidence are the foundation for qualification, project matching, and personalized drafts. Keep them current.',
            },
            {
              title: 'Discover opportunities',
              description:
                'Run discovery from the dashboard. New roles are collected, normalized, deduplicated, and placed in your review queue.',
            },
            {
              title: 'Qualify and analyze',
              description:
                'Review the opportunity against your profile. Use the fit analysis, matched skills, missing skills, and concerns to decide whether to continue.',
            },
            {
              title: 'Research the company and prepare an action',
              description:
                'Collect company context, find relevant projects, and choose whether to draft outreach, start an application, or archive the opportunity.',
            },
            {
              title: 'Move the work forward',
              description:
                'Review outreach before sending it. Track applications through the pipeline. Record the next action so the work does not disappear after the first message.',
            },
          ]}
        />

        <div className="flex flex-wrap gap-2">
          <Button size="sm" render={<Link to="/app/opportunities" />}>
            Find opportunities
            <ArrowRight />
          </Button>
          <Button
            size="sm"
            variant="outline"
            render={<a href="#workflow" />}
          >
            See the full workflow
          </Button>
        </div>

        <Callout icon={Info} title="Already signed in?" tone="muted">
          Use the sidebar to move between Opportunities, Applications, Companies, Outreach, and the
          rest of the workspace. Documentation stays available under System.
        </Callout>
      </>
    ),
  },
  {
    id: 'workflow',
    label: 'Workflow',
    title: 'Discover → Qualify → Research → Prepare → Review → Apply → Track',
    description:
      'The workflow is a guide, not a rigid checklist. Skip what does not help you make a better decision.',
    content: (
      <>
        <Steps
          steps={[
            {
              title: 'Discover',
              description:
                'Aggregate opportunities from supported sources and normalize inconsistent job data into a consistent record.',
            },
            {
              title: 'Qualify',
              description:
                'Use your preferred roles, technologies, locations, seniority, and fit threshold to decide what deserves attention.',
            },
            {
              title: 'Research',
              description:
                'Collect useful context about the company, the role, and the people connected to the opportunity.',
            },
            {
              title: 'Match',
              description:
                'Identify the projects, skills, and evidence from your profile that are most relevant to the role.',
            },
            {
              title: 'Prepare',
              description:
                'Draft personalized outreach and, as the application workflow expands, application materials grounded in your experience.',
            },
            {
              title: 'Review',
              description:
                'Read, edit, and approve generated content. Nothing consequential should move forward without your review.',
            },
            {
              title: 'Apply or reach out',
              description:
                'Open the employer application, send the approved message from your email client, and record that the action happened.',
            },
            {
              title: 'Track',
              description:
                'Keep the status, next action, and timeline current so the next step is obvious when you return.',
            },
          ]}
        />

        <Callout icon={Sparkles} title="Quality over volume" tone="info">
          A smaller pipeline of well-researched, well-matched opportunities is usually more useful
          than a large list of roles you never intend to pursue.
        </Callout>
      </>
    ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    title: 'Your daily starting point',
    description:
      'The dashboard turns the workspace into a short list of signals: what is new, what needs review, and what is moving.',
    content: (
      <>
        <FeatureGrid>
          <FeatureCard icon={Briefcase} title="Opportunity metrics">
            See new opportunities, qualified opportunities, and items awaiting review. Each metric
            links to the matching filtered view.
          </FeatureCard>
          <FeatureCard icon={Send} title="Outreach metrics">
            See drafts awaiting review, approved messages, messages sent today, and replies.
          </FeatureCard>
          <FeatureCard icon={ClipboardList} title="Application metrics">
            See active applications, submitted applications, interviews, and offers at a glance.
          </FeatureCard>
          <FeatureCard icon={LayoutDashboard} title="Actions and recents">
            Run discovery, qualify new opportunities, and jump back into recent opportunities
            without rebuilding context.
          </FeatureCard>
        </FeatureGrid>

        <Callout icon={Info} title="Start with the next action" tone="muted">
          Metrics are useful, but the queue is the point. Use the dashboard to find the next
          meaningful action, then move into the opportunity or application that needs it.
        </Callout>
      </>
    ),
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    title: 'Review opportunities without losing your place',
    description:
      'The Opportunities workspace is designed for focused review: keep the list, open the detail, decide, and return to where you were.',
    content: (
      <>
        <FeatureGrid>
          <FeatureCard icon={Search} title="Search and filter">
            Find roles by title or company, filter by status, and page through the list. The list
            stays mounted while you review an opportunity.
          </FeatureCard>
          <FeatureCard icon={Sparkles} title="Fit analysis">
            Analyze an opportunity against your profile. See the fit score, technical and
            experience fit, matched and missing skills, concerns, and a recommendation.
          </FeatureCard>
          <FeatureCard icon={Building2} title="Company context">
            Open the company to review research, contacts, related opportunities, and outreach
            history.
          </FeatureCard>
          <FeatureCard icon={FolderKanban} title="Project matching">
            Identify the projects and evidence that best support your case for the role.
          </FeatureCard>
          <FeatureCard icon={ClipboardList} title="Start an application">
            Create a separate application record while keeping the opportunity in the discovery
            pipeline. One job has one application.
          </FeatureCard>
          <FeatureCard icon={Send} title="Draft outreach">
            Generate a personalized message from the opportunity, company, contact, and your
            relevant experience, then review it before sending.
          </FeatureCard>
        </FeatureGrid>

        <QualificationDemo />

        <Callout icon={Target} title="A good decision is the deliverable" tone="info">
          Qualification is not a promise to apply. It is a structured way to decide whether an
          opportunity deserves your time. Archiving a weak match is a valid outcome.
        </Callout>

        <Callout icon={Info} title="The list is not reloaded" tone="muted">
          Reviewing an opportunity detail keeps the list and your scroll position in place. Closing
          the detail returns you to the same place instead of resetting the workspace.
        </Callout>
      </>
    ),
  },
  {
    id: 'applications',
    label: 'Applications',
    title: 'Track every application from preparation to outcome',
    description:
      'Applications are first-class records. They keep the job snapshot, status, timeline, and next action even if the original opportunity changes.',
    content: (
      <>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Availability status="available" />
            <h3 className="text-sm font-semibold text-foreground">Pipeline stages</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              'Not started',
              'Preparing',
              'Needs review',
              'Approved',
              'Submitted',
              'Assessment',
              'Interview',
              'Offer',
            ].map((status) => (
              <Badge key={status} variant="outline" className="font-normal">
                {status}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Terminal outcomes are <span className="font-medium text-foreground">Rejected</span>,{' '}
            <span className="font-medium text-foreground">Withdrawn</span>, and{' '}
            <span className="font-medium text-foreground">Closed</span>. The Closed column groups
            them so the active pipeline stays readable.
          </p>
        </div>

        <FeatureGrid>
          <FeatureCard icon={LayoutDashboard} title="Board view">
            See applications grouped by stage in a Kanban-style board, with a separate Closed
            column for completed or abandoned applications.
          </FeatureCard>
          <FeatureCard icon={ListChecks} title="List view">
            Switch to a compact table when you want to scan status, next action, update date, and
            source together.
          </FeatureCard>
          <FeatureCard icon={CalendarClock} title="Detail and timeline">
            Open an application to see the role, company, source, key dates, next action, notes, and
            an append-only timeline of status changes.
          </FeatureCard>
          <FeatureCard icon={ClipboardList} title="Preparation workspace">
            Open a dedicated workspace for the application: review role context, attach the
            profile resume, record resume notes, draft and approve a cover letter, and prepare
            answers to application questions.
          </FeatureCard>
          <FeatureCard icon={ShieldCheck} title="Strict status flow">
            The app enforces legal status transitions. You cannot jump from Submitted straight to
            Offer or bypass the review stages.
          </FeatureCard>
        </FeatureGrid>

        <Callout icon={ShieldCheck} title="Strict by design" tone="success">
          The pipeline mirrors the real process: prepare, review, approve, submit, then record
          assessments, interviews, and outcomes. This keeps the data honest and the next action
          visible.
        </Callout>

        <Callout icon={ShieldCheck} title="Preparation workspace is available now" tone="success">
          Open an application and choose Prepare application. Work through the application
          context, resume, cover letter, and application answers. The resume URL is snapshotted
          onto the application when attached. The Profile back arrow returns to the application
          Resume tab, and changing the resume resets the review checkbox. Resume variants and ATS
          metadata are next.
        </Callout>

        <Callout icon={Archive} title="Closed means closed" tone="muted">
          Rejected, withdrawn, and closed applications are terminal. Their history stays available,
          but they cannot be moved back into the active pipeline.
        </Callout>
      </>
    ),
  },
  {
    id: 'companies',
    label: 'Companies',
    title: 'Keep company context in one place',
    description:
      'Companies connect the role, the research, the people, and the conversations around an opportunity.',
    content: (
      <>
        <FeatureGrid>
          <FeatureCard icon={Building2} title="Company directory">
            Browse and search companies created from discovered opportunities. Filter by research
            status and open a company for the full picture.
          </FeatureCard>
          <FeatureCard icon={Sparkles} title="Company research">
            Collect useful background about the company so outreach and applications are grounded in
            context rather than guesswork.
          </FeatureCard>
          <FeatureCard icon={Users} title="Contacts">
            Keep names, roles, emails, and source links for the people connected to the company.
          </FeatureCard>
          <FeatureCard icon={Briefcase} title="Related opportunities">
            See the company's opportunities and outreach history together, so you do not repeat work
            or lose track of a conversation.
          </FeatureCard>
        </FeatureGrid>

        <Callout icon={MessageSquare} title="Research before you reach out" tone="info">
          A short, specific message built from company context and your relevant work is usually
          more useful than a generic introduction.
        </Callout>
      </>
    ),
  },
  {
    id: 'outreach',
    label: 'Outreach & follow-ups',
    title: 'Draft, review, send, and follow up',
    description:
      'Outreach is for conversations with people. Applications are for the employer’s formal process. Keep the two connected but distinct.',
    content: (
      <>
        <FeatureGrid>
          <FeatureCard icon={Sparkles} title="Personalized drafts">
            Generate a draft from the opportunity, company, recipient, and the experience that is
            most relevant to the role.
          </FeatureCard>
          <FeatureCard icon={CheckCircle2} title="Review and approve">
            Edit the subject and message, keep the original draft for comparison, and approve only
            when it is ready.
          </FeatureCard>
          <FeatureCard icon={Mail} title="Open or copy">
            Use your own email client to send the approved message, or copy it into the tool you
            prefer. Nothing is sent automatically.
          </FeatureCard>
          <FeatureCard icon={CalendarClock} title="Follow-ups">
            Track follow-up timing, see what is due, and record when a follow-up was sent or
            cancelled.
          </FeatureCard>
          <FeatureCard icon={MessageSquare} title="Replies">
            Mark a reply when it arrives so the conversation moves out of the waiting state and into
            the next action.
          </FeatureCard>
          <FeatureCard icon={Archive} title="Archive and close">
            Close conversations that are no longer active while keeping the history for context.
          </FeatureCard>
        </FeatureGrid>

        <Callout icon={ShieldCheck} title="No automatic sending" tone="success">
          Outreach is approval-gated. The workflow prepares and tracks the message, but you review
          it and send it from your email client. That keeps the final voice and recipient under your
          control.
        </Callout>

        <div className="rounded-xl border bg-muted/20 p-4">
          <h3 className="text-sm font-semibold text-foreground">Outreach stages</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              'Draft',
              'Needs review',
              'Approved',
              'Scheduled',
              'Sent',
              'Replied',
              'Follow-up due',
              'Closed',
            ].map((status) => (
              <Badge key={status} variant="outline" className="font-normal">
                {status}
              </Badge>
            ))}
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'profile-projects',
    label: 'Profile & projects',
    title: 'The evidence behind better decisions',
    description:
      'The workspace is only as useful as the profile and project evidence behind it. This is where the system learns what you can actually do.',
    content: (
      <>
        <FeatureGrid>
          <FeatureCard icon={UserRound} title="Profile">
            Keep your headline, summary, skills, technologies, preferred roles, locations,
            experience level, portfolio, and email current.
          </FeatureCard>
          <FeatureCard icon={BadgeCheck} title="Verified skills">
            Mark skills and technologies as verified when you are confident they reflect your
            experience. Unverified items stay visible as work to confirm.
          </FeatureCard>
          <FeatureCard icon={FolderKanban} title="Portfolio projects">
            Capture the problem, solution, technologies, outcomes, and verified metrics for the work
            you want to be considered for.
          </FeatureCard>
          <FeatureCard icon={Sparkles} title="Relevant evidence">
            The strongest project for one role is not always the strongest for another. Project
            matching helps surface the evidence that fits the opportunity.
          </FeatureCard>
        </FeatureGrid>

        <Callout icon={TriangleAlert} title="Do not outsource your truth" tone="warning">
          AI-assisted analysis and drafts should be grounded in your real experience. Review
          generated content, correct anything that overstates your work, and keep verified evidence
          accurate.
        </Callout>
      </>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    title: 'Tune the system to your search',
    description:
      'Settings control what discovery looks for, how opportunities are qualified, and how outreach approval works.',
    content: (
      <>
        <FeatureGrid>
          <FeatureCard icon={Search} title="Opportunity preferences">
            Set preferred roles, technologies, locations, employment types, seniority levels,
            excluded roles and companies, minimum fit score, daily target, and remote preference.
          </FeatureCard>
          <FeatureCard icon={Send} title="Outreach preferences">
            Require approval before sending, set the maximum number of follow-ups, and choose the
            follow-up interval.
          </FeatureCard>
          <FeatureCard icon={Settings} title="Sources">
            Review and configure the job sources used for discovery. Source availability can vary.
          </FeatureCard>
          <FeatureCard icon={Bot} title="AI, email, and automation">
            These settings areas are reserved for later phases. The current workspace already uses
            AI for analysis and drafting, but provider and automation controls are not yet exposed.
          </FeatureCard>
        </FeatureGrid>

        <Callout icon={Info} title="Changes should improve decisions" tone="muted">
          Tightening preferences is usually better than adding more sources. A focused search
          produces a more useful review queue.
        </Callout>
      </>
    ),
  },
  {
    id: 'ai-control',
    label: 'AI & human control',
    title: 'Automation with a human review gate',
    description:
      'AI reduces the blank-page problem. It does not replace judgment, and it does not submit anything on your behalf.',
    content: (
      <>
        <FeatureGrid>
          <FeatureCard icon={Bot} title="What AI helps with">
            Qualifying opportunities, summarizing fit, identifying matched and missing skills,
            matching projects, researching context, and drafting outreach and application content.
          </FeatureCard>
          <FeatureCard icon={ShieldCheck} title="What requires you">
            Deciding whether to pursue a role, editing the message, approving outreach, approving
            application materials, and submitting the application.
          </FeatureCard>
          <FeatureCard icon={Sparkles} title="Keeping the source">
            Outreach keeps the original AI draft alongside your edits so you can compare, restore,
            and understand what changed.
          </FeatureCard>
          <FeatureCard icon={TriangleAlert} title="Current limitations">
            Resume variants, ATS metadata, browser automation, and automatic submission are not
            available yet. Do not treat generated content as verified fact.
          </FeatureCard>
        </FeatureGrid>

        <CodePromptTabs
          title="AI Guardrails & Human Gate Architecture"
          tabs={[
            {
              id: 'prompt-guards',
              label: 'System Prompt Guards',
              description: 'Strict instructions passed to LLM to prevent hallucinating candidate credentials.',
              code: `// System Prompt Guardrails (Zero-Hallucination Policy)
const SYSTEM_PROMPT = \`
You are an objective engineering qualification assistant for Victor.
Rules:
1. ONLY reference projects, skills, and metrics explicitly present in Victor's profile.
2. If the job description requires a technology not present in the profile, flag it as MISSING.
3. NEVER make up past employment dates or company names.
4. Consequential actions (send message, submit application) MUST be marked "AWAITING_APPROVAL".
\`;`,
            },
            {
              id: 'gate-schema',
              label: 'Human Review Gate Schema',
              description: 'The application state machine strictly prevents autonomous external writes.',
              code: `interface HumanReviewGate<T> {
  status: 'DRAFT_GENERATED' | 'AWAITING_HUMAN_REVIEW' | 'APPROVED' | 'REJECTED';
  payload: T;
  generatedAt: number;
  reviewedBy: string | null; // e.g. "victor"
  reviewedAt: number | null;
  allowAutoExecution: false; // Deterministic runtime invariant
}`,
            },
            {
              id: 'context-schema',
              label: 'Context Injection',
              description: 'Structured context assembled from validated company dossiers.',
              code: `// Injected Research & Evidence Context
{
  "targetRole": "Staff Platform Engineer",
  "company": "Stripe",
  "verifiedEvidence": [
    "Built reactive Job OS architecture with Firestore & TypeScript",
    "Over 10 years experience leading full-stack distributed teams"
  ],
  "tonePreference": "Concise, technical, direct"
}`,
            },
          ]}
        />

        <Callout icon={ShieldCheck} title="Human-in-the-loop is the default" tone="success">
          The system is designed to prepare work, not to make consequential decisions for you.
          Review generated claims, protect your voice, and keep the final action yours.
        </Callout>
      </>
    ),
  },
  {
    id: 'data-privacy',
    label: 'Data & privacy',
    title: 'Your workspace is private to your account',
    description:
      'Opportunities, applications, companies, contacts, outreach, follow-ups, and profile data are scoped to the signed-in user.',
    content: (
      <>
        <FeatureGrid>
          <FeatureCard icon={LockKeyhole} title="Account-scoped data">
            Your records are tied to your account. Another signed-in user should not see your
            opportunities, applications, or conversations.
          </FeatureCard>
          <FeatureCard icon={ClipboardList} title="Application snapshots">
            An application keeps a snapshot of the role and company, so the record survives if the
            original job is later removed or changed.
          </FeatureCard>
          <FeatureCard icon={ShieldCheck} title="Approval boundaries">
            Outreach and applications are prepared for review. The system does not silently submit
            applications or send messages.
          </FeatureCard>
          <FeatureCard icon={Info} title="External destinations">
            Opening an application or company link takes you to an external site. Review the
            destination before sharing personal information.
          </FeatureCard>
        </FeatureGrid>

        <Callout icon={TriangleAlert} title="Your data is your responsibility" tone="warning">
          Keep your profile accurate, avoid putting sensitive information into generated content,
          and review anything that will leave the workspace.
        </Callout>
      </>
    ),
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    title: 'What is next',
    description:
      'The roadmap is intentionally narrow: deepen the application workflow before expanding automation.',
    content: (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <Availability status="available" />
          <span className="text-sm text-muted-foreground">
            Opportunity intelligence, outreach, applications, preparation, and company context
            are available now.
          </span>
        </div>

        <div className="space-y-3">
          <RoadmapItem
            status="next"
            title="Resume variants and ATS metadata"
            description="Tailor resume versions to a role and keep the metadata needed to understand what was submitted and why."
          />
          <RoadmapItem
            status="planned"
            title="Submission and browser automation"
            description="Approval-gated assistance for filling and submitting applications, with explicit confirmation before any external action."
          />
          <RoadmapItem
            status="planned"
            title="Interview preparation workflows"
            description="Preparation notes, interview stages, and follow-up workflows that go beyond the current status tracking."
          />
          <RoadmapItem
            status="planned"
            title="Deeper analytics"
            description="Better visibility into response rates, source quality, outreach performance, and the stages where opportunities stall."
          />
        </div>

        <Callout icon={Milestone} title="Roadmap, not a promise" tone="muted">
          Planned work may change as the workflow is tested. Features are only considered available
          when they are implemented and usable in the workspace.
        </Callout>
      </>
    ),
  },
  {
    id: 'faq-glossary',
    label: 'FAQ & glossary',
    title: 'Questions, edge cases, and shared language',
    description:
      'A few answers that are useful once you start moving between opportunities, outreach, and applications.',
    content: (
      <>
        <Faq
          items={[
            {
              question: 'How do I start an application?',
              answer:
                'Open a qualified opportunity and choose Start application. This creates a separate application record and keeps the opportunity in discovery. Starting the same job again resolves to the same application.',
            },
            {
              question: 'Does the system apply for me?',
              answer:
                'Not yet. You open the employer application from the application record, submit it yourself, and then move the status to Submitted. Automatic submission is planned later and will remain approval-gated.',
            },
            {
              question: 'Why can I not jump straight to Offer?',
              answer:
                'The pipeline enforces legal transitions so the data reflects what actually happened. For example, an application moves through Submitted, Assessment or Interview, and then Offer. This makes the board and metrics trustworthy.',
            },
            {
              question: 'What does “qualified” mean?',
              answer:
                'Qualification means the opportunity passed your fit criteria — role, skills, location, seniority, and preferences. It is a signal to review, not a guarantee that you should apply.',
            },
            {
              question: 'Is outreach sent automatically?',
              answer:
                'No. Outreach is drafted and approved in the workspace, then opened in your email client or copied. You send it and mark it as sent. Follow-ups are tracked the same way.',
            },
            {
              question: 'What happens if the job disappears?',
              answer:
                'The application keeps its own snapshot of the role, company, source, location, and application URL, so the application record remains useful.',
            },
            {
              question: 'Can I reopen a closed application?',
              answer:
                'No. Rejected, withdrawn, and closed are terminal states. Their history remains visible, but they cannot re-enter the active pipeline.',
            },
            {
              question: 'Is my data visible to other users?',
              answer:
                'Your workspace data is scoped to your account. Other signed-in users should not see your opportunities, applications, contacts, or outreach.',
            },
          ]}
        />

        <Glossary
          items={[
            {
              term: 'Opportunity',
              definition:
                'A discovered job record. It can be qualified, analyzed, archived, used to draft outreach, or used to start an application.',
            },
            {
              term: 'Application',
              definition:
                'A separate record for a role you are pursuing. It carries the job snapshot, status, timeline, and next action.',
            },
            {
              term: 'Qualification',
              definition:
                'The decision that an opportunity meets your criteria well enough to review or pursue.',
            },
            {
              term: 'Fit analysis',
              definition:
                'An AI-assisted comparison of the role with your profile, skills, experience, and preferences.',
            },
            {
              term: 'Outreach',
              definition:
                'A personalized message to a person at a company, prepared for review and sent outside the workspace.',
            },
            {
              term: 'Follow-up',
              definition:
                'A scheduled or manual next message after an outreach attempt, tracked so the conversation does not go cold.',
            },
            {
              term: 'ATS',
              definition:
                'Applicant Tracking System. The employer or recruiting system that receives and manages applications.',
            },
            {
              term: 'Terminal status',
              definition:
                'A final application outcome: Rejected, Withdrawn, or Closed. It cannot transition back into the active pipeline.',
            },
          ]}
        />
      </>
    ),
  },
]

export const DOC_SECTION_LINKS = DOC_SECTIONS.map(({ id, label }) => ({ id, label }))
