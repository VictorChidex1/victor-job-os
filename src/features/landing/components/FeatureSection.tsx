import { motion } from 'framer-motion'
import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Building2,
  Mail,
  FileText,
  Activity,
  Check,
  LayoutGrid,
  Briefcase,
  CheckSquare,
  BarChart3,
  TrendingUp,
  ChevronRight
} from 'lucide-react'

const capabilities = [
  {
    id: "opportunity",
    title: "Opportunity Intelligence",
    description: "Find and qualify the best opportunities faster with built-in intelligence.",
    icon: Search,
    accent: "text-blue-500",
    bg: "bg-blue-50",
    check: "bg-blue-500",
    items: [
      "Opportunity discovery",
      "Job source aggregation",
      "Deduplication",
      "Qualification",
      "Fit analysis"
    ]
  },
  {
    id: "research",
    title: "Research",
    description: "Get the context you need to make every application smarter.",
    icon: Building2,
    accent: "text-emerald-500",
    bg: "bg-emerald-50",
    check: "bg-emerald-500",
    items: [
      "Company research",
      "Contact discovery",
      "Opportunity context",
      "Relevant project matching"
    ]
  },
  {
    id: "outreach",
    title: "Outreach",
    description: "Create personalized outreach with AI and manage your entire workflow.",
    icon: Mail,
    accent: "text-purple-500",
    bg: "bg-purple-50",
    check: "bg-purple-500",
    items: [
      "Personalized drafts",
      "Email review",
      "Approval workflow",
      "Sending",
      "Delivery tracking"
    ]
  },
  {
    id: "applications",
    title: "Applications",
    description: "Prepare, submit and track every application in one place.",
    icon: FileText,
    accent: "text-orange-500",
    bg: "bg-orange-50",
    check: "bg-orange-500",
    items: [
      "Application preparation",
      "Resume context",
      "Cover letters",
      "Application questions",
      "Submission tracking"
    ]
  },
  {
    id: "operations",
    title: "Operations",
    description: "Stay organized with built-in tracking, reminders and automation.",
    icon: BarChart3,
    accent: "text-pink-500",
    bg: "bg-pink-50",
    check: "bg-pink-500",
    items: [
      "Activity timeline",
      "Follow-ups",
      "Analytics",
      "Automation monitoring",
      "Settings"
    ]
  }
];

function FeatureCard({ data }: { data: typeof capabilities[0] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -3 }}
      className="w-full max-w-[340px] bg-white rounded-[20px] border border-border/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 flex flex-col"
    >
       <div className={`w-10 h-10 rounded-xl ${data.bg} ${data.accent} flex items-center justify-center mb-5`}>
          <data.icon className="w-5 h-5" />
       </div>
       <h4 className="text-[17px] font-bold text-foreground mb-2">{data.title}</h4>
       <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">{data.description}</p>
       
       <ul className="space-y-3 mb-8">
         {data.items.map((item, i) => (
           <li key={i} className="flex items-start gap-3 text-[13px] font-medium text-foreground/80">
             <div className={`mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${data.check}`}>
               <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
             </div>
             {item}
           </li>
         ))}
       </ul>

       <div className="mt-auto group flex items-center gap-1.5 text-[13px] font-semibold text-foreground cursor-pointer w-max">
         Learn more 
         <span className="transition-transform group-hover:translate-x-1"><ChevronRight className="w-3.5 h-3.5" /></span>
       </div>
    </motion.div>
  )
}

function FeatureDashboardPreview() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-[800px] rounded-[20px] border border-border bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col mx-auto"
    >
      {/* Top Bar */}
      <div className="flex items-center px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <img
            src="/assets/victor-job-os.png"
            alt="Victor Job OS logo"
            className="w-5 h-5 rounded"
          />
          <span className="text-[13px] font-bold text-foreground tracking-tight">
            Victor Job OS
          </span>
        </div>
        <div className="mx-auto flex-1 max-w-[360px] ml-10 hidden sm:block">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/30 border border-border/40">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground/70">
              Search opportunities, companies...
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
            VC
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-[420px]">
        {/* Sidebar */}
        <div className="w-[160px] border-r border-border/50 p-3 hidden md:flex flex-col gap-1">
          {[
            { icon: LayoutGrid, label: "Dashboard", active: true },
            { icon: Briefcase, label: "Opportunities" },
            { icon: Mail, label: "Outreach" },
            { icon: FileText, label: "Applications" },
            { icon: Building2, label: "Companies" },
            { icon: CheckSquare, label: "Projects" },
            { icon: BarChart3, label: "Analytics" },
            { icon: Activity, label: "Activity" },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[12px] font-medium ${item.active ? "bg-muted/60 text-foreground" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"}`}
            >
              <item.icon className={`w-3.5 h-3.5 ${item.active ? "text-foreground" : "text-muted-foreground/70"}`} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-5 md:p-6 flex flex-col">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="text-xl font-bold text-foreground mb-1">
                Good morning, Victor 👋
              </div>
              <p className="text-[12px] text-muted-foreground">
                Here's what's happening with your job search.
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "New opportunities", val: "30", trend: "+12%", color: "text-emerald-500" },
              { label: "Qualified", val: "12", trend: "+2%", color: "text-emerald-500" },
              { label: "Outreach drafts", val: "8", trend: "+50%", color: "text-emerald-500" },
              { label: "Applications", val: "6", trend: "+0%", color: "text-muted-foreground" },
            ].map((m, i) => (
              <div key={i} className="p-3 rounded-xl border border-border/50 bg-white flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[22px] font-bold text-foreground leading-none">{m.val}</span>
                  <div className={`flex items-center gap-0.5 text-[9px] font-bold ${m.color}`}>
                    <TrendingUp className="w-2.5 h-2.5" /> {m.trend}
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Opportunities */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[13px] font-bold text-foreground">Today's opportunities</div>
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 cursor-pointer">
                  View all <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { title: "Senior React Engineer", company: "Vercel", match: "94%", bg: "bg-black text-white" },
                  { title: "Full Stack Developer", company: "Linear", match: "87%", bg: "bg-[#5e6ad2] text-white" },
                  { title: "Frontend Engineer", company: "Notion", match: "82%", bg: "bg-white text-black border border-border" },
                ].map((job, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-[12px] shrink-0 ${job.bg}`}>
                      {job.company[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-foreground truncate">{job.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{job.company}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">{job.match}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  Next steps <span className="w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center text-[9px]">4</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  { title: "Review Vercel application", sub: "Senior React Engineer", checked: true },
                  { title: "Send follow-up email", sub: "Linear · Full Stack Developer", checked: false },
                  { title: "Research company", sub: "Anthropic · Frontend Engineer", checked: false },
                  { title: "Prepare outreach", sub: "Stripe · Software Engineer", checked: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`mt-0.5 w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 ${step.checked ? "bg-blue-600 border-blue-600" : "border-border"}`}>
                      {step.checked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12px] font-semibold text-foreground`}>{step.title}</div>
                      <div className="text-[10px] text-muted-foreground">{step.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function FeatureSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <section id="features" className="relative w-full overflow-hidden border-b bg-[#fafafa]">
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-6 py-24 lg:py-32" ref={containerRef}>
        
        {/* Intro */}
        <div className="flex flex-col items-center text-center mb-16 lg:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 rounded-full text-[11px] font-semibold tracking-wide uppercase px-3 py-1 bg-muted/60 text-muted-foreground border-transparent">
              Features
            </Badge>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[42px] sm:text-[56px] lg:text-[72px] font-bold tracking-[-0.04em] text-foreground leading-[1] mb-6"
          >
            Everything around the job, organized.
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-[650px] text-[17px] sm:text-[19px] text-muted-foreground leading-relaxed"
          >
            Capabilities grouped around the workflow they support.<br className="hidden sm:block" />
            From finding the right opportunities to researching companies, preparing outreach, managing applications and staying on top of your progress — everything works together inside one system.
          </motion.p>
        </div>

        {/* ECOSYSTEM: Desktop (3 Columns x 2 Rows) */}
        <div className="hidden xl:grid grid-cols-[1fr_minmax(600px,780px)_1fr] grid-rows-2 gap-x-8 gap-y-12 items-center justify-items-center relative">
          
          {/* Top Left: Opportunity */}
          <div className="justify-self-end mt-12 -mr-16 relative z-10">
             <FeatureCard data={capabilities[0]} />
             
             {/* Callout & Connector */}
             <div className="absolute -top-16 -left-8 w-40 pointer-events-none hidden xl:block">
                <div className="absolute top-0 left-0 bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground italic -rotate-6 whitespace-nowrap">
                  Find better opportunities
                </div>
                <svg className="absolute top-6 left-12 w-8 h-12 overflow-visible stroke-blue-500/40" fill="none">
                   <path d="M 0,0 Q 10,20 30,30" strokeWidth="1.5" strokeDasharray="4 4" />
                   <path d="M 20,30 L 30,30 L 28,24" strokeWidth="1.5" />
                </svg>
             </div>
          </div>

          {/* Top Center: Research */}
          <div className="self-end mt-12 relative z-10">
             <FeatureCard data={capabilities[1]} />
             
             {/* Callout & Connector */}
             <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 pointer-events-none hidden xl:block">
                <div className="absolute top-0 left-4 bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground italic rotate-3 whitespace-nowrap">
                  Understand every company
                </div>
                <svg className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-12 overflow-visible stroke-emerald-500/40" fill="none">
                   <path d="M 0,0 Q 10,20 0,30" strokeWidth="1.5" strokeDasharray="4 4" />
                   <path d="M -10,30 L 0,30 L -2,24" strokeWidth="1.5" />
                </svg>
             </div>
          </div>

          {/* Top Right: Outreach */}
          <div className="justify-self-start mt-12 -ml-16 relative z-10">
             <FeatureCard data={capabilities[2]} />
             
             {/* Callout & Connector */}
             <div className="absolute -top-16 -right-8 w-40 pointer-events-none hidden xl:block">
                <div className="absolute top-0 right-0 bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground italic rotate-3 whitespace-nowrap">
                  Send better outreach
                </div>
                <svg className="absolute top-6 right-12 w-8 h-12 overflow-visible stroke-purple-500/40" fill="none">
                   <path d="M 30,0 Q 20,20 0,30" strokeWidth="1.5" strokeDasharray="4 4" />
                   <path d="M 10,30 L 0,30 L 2,24" strokeWidth="1.5" />
                </svg>
             </div>
          </div>

          {/* Bottom Left: Applications */}
          <div className="justify-self-end mb-16 -mr-8 relative z-10">
             <FeatureCard data={capabilities[3]} />
             
             {/* Callout & Connector */}
             <div className="absolute -top-16 -left-4 w-40 pointer-events-none hidden xl:block">
                <div className="absolute top-0 left-0 bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground italic -rotate-2 whitespace-nowrap">
                  Apply with confidence
                </div>
                <svg className="absolute top-6 left-12 w-8 h-12 overflow-visible stroke-orange-500/40" fill="none">
                   <path d="M 0,0 Q 10,20 30,30" strokeWidth="1.5" strokeDasharray="4 4" />
                   <path d="M 20,30 L 30,30 L 28,24" strokeWidth="1.5" />
                </svg>
             </div>
          </div>

          {/* Bottom Center: Dashboard */}
          <div className="relative z-20 self-start">
             <FeatureDashboardPreview />
          </div>

          {/* Bottom Right: Operations */}
          <div className="justify-self-start mb-16 -ml-8 relative z-10">
             <FeatureCard data={capabilities[4]} />
             
             {/* Callout & Connector */}
             <div className="absolute -top-16 -right-4 w-40 pointer-events-none hidden xl:block">
                <div className="absolute top-0 right-0 bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground italic rotate-2 whitespace-nowrap">
                  Stay on top of everything
                </div>
                <svg className="absolute top-6 right-12 w-8 h-12 overflow-visible stroke-pink-500/40" fill="none">
                   <path d="M 30,0 Q 20,20 0,30" strokeWidth="1.5" strokeDasharray="4 4" />
                   <path d="M 10,30 L 0,30 L 2,24" strokeWidth="1.5" />
                </svg>
             </div>
          </div>

        </div>

        {/* ECOSYSTEM: Tablet (2 Columns) */}
        <div className="hidden md:flex xl:hidden flex-col gap-12 items-center">
          <div className="grid grid-cols-2 gap-8 w-full max-w-[800px]">
            <FeatureCard data={capabilities[0]} />
            <FeatureCard data={capabilities[1]} />
          </div>
          <FeatureDashboardPreview />
          <div className="grid grid-cols-2 gap-8 w-full max-w-[800px]">
            <FeatureCard data={capabilities[2]} />
            <FeatureCard data={capabilities[3]} />
          </div>
          <div className="grid grid-cols-1 w-full max-w-[400px]">
            <FeatureCard data={capabilities[4]} />
          </div>
        </div>

        {/* ECOSYSTEM: Mobile (1 Column) */}
        <div className="flex flex-col gap-6 md:hidden w-full">
          <FeatureDashboardPreview />
          {capabilities.map(cap => (
            <FeatureCard key={cap.id} data={cap} />
          ))}
        </div>

      </div>
    </section>
  )
}