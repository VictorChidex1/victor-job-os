import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  Target,
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Code2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PipelineStage {
  id: string
  label: string
  title: string
  subtitle: string
  icon: typeof Compass
  badge: string
  stats: { label: string; value: string }[]
  preview: {
    heading: string
    subheading: string
    details: { tag: string; label: string; text: string }[]
    codeSnippet?: string
  }
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'discover',
    label: '1. Discover',
    title: 'Multi-Source Opportunity Aggregation',
    subtitle: 'Collects leads from supported job boards, direct career pages, and APIs, automatically de-duping and normalizing metadata.',
    icon: Compass,
    badge: 'Continuous Ingestion',
    stats: [
      { label: 'Deduplication', value: '100% Normalized' },
      { label: 'Sources', value: 'Greenhouse, Lever, LinkedIn' },
      { label: 'Sync Cadence', value: 'Live Queue' },
    ],
    preview: {
      heading: 'Raw Ingestion → Clean Schema',
      subheading: 'Duplicate records matched on company domain & title signature are merged instantly.',
      details: [
        { tag: 'Source', label: 'Greenhouse API', text: 'Senior Full Stack Engineer (Remote, US/EU)' },
        { tag: 'Dedupe', label: 'Canonical ID', text: 'hash: gh_stripe_eng_7381 (Existing: 0)' },
        { tag: 'Normalized', label: 'Base Compensation', text: '$165,000 – $195,000 USD + Equity' },
      ],
      codeSnippet: `// Canonical Normalized Opportunity
{
  "id": "opp_stripe_fullstack_2026",
  "company": "Stripe",
  "title": "Staff Platform Engineer",
  "stack": ["React", "TypeScript", "Node.js", "Distributed Systems"],
  "status": "DISCOVERED"
}`,
    },
  },
  {
    id: 'qualify',
    label: '2. Qualify',
    title: 'Precision Fit & Skill Match Engine',
    subtitle: 'Evaluates role requirements against your verified skills, project evidence, and compensation preferences before putting it on your radar.',
    icon: Target,
    badge: 'Semantic Evaluation',
    stats: [
      { label: 'Match Algorithm', value: 'Weighted Multi-Factor' },
      { label: 'Threshold', value: '≥ 80% to Qualify' },
      { label: 'Signal Extraction', value: 'Tech Stack + Seniority' },
    ],
    preview: {
      heading: '94% Match Breakdown',
      subheading: 'Calculated using real profile projects and past architectural achievements.',
      details: [
        { tag: 'Tech Stack', label: '40% / 40%', text: 'Full alignment: React 19, TypeScript, Cloud Functions' },
        { tag: 'Seniority', label: '30% / 30%', text: '7+ years required; verified 10+ years engineering lead' },
        { tag: 'Preferences', label: '24% / 30%', text: 'Remote-first, asynchronous culture, modern tooling' },
      ],
      codeSnippet: `// Qualification Decision Payload
{
  "overallScore": 94,
  "verdict": "STRONG_MATCH",
  "flags": ["Leadership Experience Required", "High System Architecture Demand"],
  "recommendedAction": "MOVE_TO_RESEARCH"
}`,
    },
  },
  {
    id: 'research',
    label: '3. Research',
    title: 'Automated Company & Team Intelligence',
    subtitle: 'Synthesizes tech stack, engineering blog topics, key executive contacts, and funding milestones into a structured dossier.',
    icon: Search,
    badge: 'Intel Dossier',
    stats: [
      { label: 'Company Profile', value: 'Tech Stack & Funding' },
      { label: 'Key People', value: 'Hiring Manager Identified' },
      { label: 'Talking Points', value: '3 Tailored Angles' },
    ],
    preview: {
      heading: 'Context Engine Active',
      subheading: 'Enriches raw listings with company culture and key engineering initiatives.',
      details: [
        { tag: 'Radar', label: 'Primary Architecture', text: 'Distributed microservices, Next.js edge frontends' },
        { tag: 'Recent News', label: 'Product Expansion', text: 'Recent launch of real-time multi-agent workflows' },
        { tag: 'Key Contact', label: 'VP of Engineering', text: 'Focusing on scaling platform throughput' },
      ],
      codeSnippet: `// Research Dossier Summary
{
  "company": "Vercel",
  "initiatives": ["AI Gateway Expansion", "Workflow DX Improvements"],
  "hook": "Observed your latest blog on distributed agents; relevant to my Job OS pipeline."
}`,
    },
  },
  {
    id: 'prepare',
    label: '4. Prepare',
    title: 'Contextual AI Outreach & Artifact Drafting',
    subtitle: 'Drafts customized cold emails, cover letters, and interview talking points grounded in your real portfolio evidence.',
    icon: Sparkles,
    badge: 'Evidence-Grounded AI',
    stats: [
      { label: 'Hallucination Guard', value: 'Strict Profile Constraints' },
      { label: 'Customization', value: 'Specific to Company Hooks' },
      { label: 'Outputs', value: 'Email, Cover Letter, Answers' },
    ],
    preview: {
      heading: 'Drafted Outreach (Founders & Engineering Leaders)',
      subheading: 'No generic fluff. Specific mention of their tech challenges and your direct experience.',
      details: [
        { tag: 'Subject', label: 'Cold Outreach', text: 'Scaling distributed workflows at Stripe — Victor' },
        { tag: 'Hook', label: 'Direct Value', text: 'Saw your recent push to simplify developer automation...' },
        { tag: 'Evidence', label: 'Project Proof', text: 'Led a reactive agentic OS with 99.8% precision rate.' },
      ],
      codeSnippet: `Subject: High-throughput platform architectures — Victor

Hi Alex,

Noticed your recent post regarding multi-agent reliability at scale. Over the past year, I built Victor Job OS—a distributed, reactive job automation pipeline with deterministic human approval gates.

Would love to share a few architecture lessons that map directly to your roadmap.

Best,
Victor`,
    },
  },
  {
    id: 'review',
    label: '5. Human Gate',
    title: 'Human-in-the-Loop Review & Execution',
    subtitle: 'No outbound emails or applications ever fire automatically without your explicit manual review and approval.',
    icon: ShieldCheck,
    badge: 'Total Sovereignty',
    stats: [
      { label: 'Autonomous Actions', value: '0 (Strict Policy)' },
      { label: 'Approval UI', value: '1-Click Review & Edit' },
      { label: 'Audit Trail', value: 'Complete Event History' },
    ],
    preview: {
      heading: 'The Human Gate Checkpoint',
      subheading: 'The machine prepares, researches, and recommends. You decide, edit, and pull the trigger.',
      details: [
        { tag: 'Status', label: 'Awaiting Victor Approval', text: 'Outreach email drafted and staged in queue' },
        { tag: 'Safety', label: 'No Blind Submissions', text: 'You verify recipient, copy, and timing' },
        { tag: 'Trace', label: 'Audit Logged', text: 'Staged at 16:45; waiting for interactive click' },
      ],
      codeSnippet: `// Human Gate State
{
  "stage": "OUTREACH_PENDING_APPROVAL",
  "approvedBy": null,
  "canAutoSend": false, // System hard-blocks automated outbound writes
  "actions": ["APPROVE_AND_SEND", "EDIT_DRAFT", "ARCHIVE"]
}`,
    },
  },
]

export function InteractivePipelineStepper() {
  const [activeStageId, setActiveStageId] = useState<string>('discover')
  const currentStage = PIPELINE_STAGES.find((s) => s.id === activeStageId) ?? PIPELINE_STAGES[0]

  return (
    <div className="rounded-2xl border bg-card/60 backdrop-blur-md p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Cpu className="size-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Interactive System Architecture
            </span>
          </div>
          <h3 className="mt-1.5 text-lg font-bold text-foreground">
            The 5-Stage Job Search Operating Loop
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Click through each stage to inspect how Victor Job OS transforms raw listings into approved actions.
          </p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto gap-1.5 border-primary/20 bg-primary/5 text-primary">
          <Sparkles className="size-3" />
          Interactive Demo
        </Badge>
      </div>

      {/* Stage Selector Pills */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PIPELINE_STAGES.map((stage) => {
          const isActive = stage.id === activeStageId
          const Icon = stage.icon

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStageId(stage.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]'
                  : 'border-border/70 bg-background/80 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <Icon className="size-3.5" />
              <span>{stage.label}</span>
            </button>
          )
        })}
      </div>

      {/* Stage Detail & Live Inspector Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mt-6 grid gap-6 lg:grid-cols-12"
        >
          {/* Left Column: Stage Explanation */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border/80 bg-muted/50 text-[11px]">
                  {currentStage.badge}
                </Badge>
              </div>
              <h4 className="mt-3 text-lg font-semibold text-foreground">
                {currentStage.title}
              </h4>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {currentStage.subtitle}
              </p>

              {/* Stats / Parameters Grid */}
              <div className="mt-5 space-y-2.5 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                {currentStage.stats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className="font-semibold text-foreground">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span>Automated pipeline state machine with local persistence</span>
            </div>
          </div>

          {/* Right Column: Dynamic Live Inspector */}
          <div className="lg:col-span-7 rounded-xl border border-border/70 bg-background/90 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-xs font-semibold text-foreground">
                  {currentStage.preview.heading}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {currentStage.preview.subheading}
                </p>
              </div>
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Key Data Points */}
            <div className="mt-4 space-y-2">
              {currentStage.preview.details.map((detail) => (
                <div
                  key={detail.label}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs"
                >
                  <span className="font-mono text-[10px] font-semibold text-primary uppercase">
                    [{detail.tag}]
                  </span>
                  <span className="font-medium text-foreground">{detail.label}:</span>
                  <span className="text-muted-foreground truncate">{detail.text}</span>
                </div>
              ))}
            </div>

            {/* Live Code / JSON snippet */}
            {currentStage.preview.codeSnippet && (
              <div className="mt-4 rounded-lg border border-border/70 bg-muted/40 p-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="size-3 text-primary" />
                    Runtime Inspection Payload
                  </span>
                  <span>JSON Schema</span>
                </div>
                <pre className="font-mono text-[11px] leading-relaxed text-foreground overflow-x-auto p-1">
                  <code>{currentStage.preview.codeSnippet}</code>
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

