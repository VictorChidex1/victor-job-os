import { Link } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { RunDiscoveryButton } from '@/components/dashboard/RunDiscoveryButton'
import { QualifyNewButton } from '@/components/dashboard/QualifyNewButton'
import { RecentOpportunities } from '@/components/dashboard/RecentOpportunities'
import { useJobsPage } from '@/hooks/useJobsPage'
import { useJobCounts } from '@/hooks/useJobCounts'
import { useOutreach } from '@/hooks/useOutreach'
import { useFollowUps } from '@/hooks/useFollowUps'
import { usePageMeta } from '@/hooks/usePageMeta'
import { motion } from 'framer-motion'

// --- Animations ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
} as const

// --- Components ---
function ActiveRadarState({ title, description }: { title: string, description: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center p-10 bg-background border border-border/60 rounded-2xl overflow-hidden shadow-sm group">
      
      {/* Subtle Blueprint Grid */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
           style={{
             backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
             backgroundSize: '24px 24px'
           }}
      />
      
      {/* Hardware Radar */}
      <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
        {/* Concentric Rings */}
        <div className="absolute inset-0 rounded-full border border-primary/20 shadow-[inset_0_0_20px_rgba(var(--primary),0.05)]" />
        <div className="absolute inset-5 rounded-full border border-primary/20" />
        <div className="absolute inset-10 rounded-full border border-primary/20" />
        
        {/* The Live Sweep */}
        <div 
          className="absolute inset-0 rounded-full animate-[spin_3s_linear_infinite] origin-center" 
          style={{ background: 'conic-gradient(from 0deg, transparent 70%, hsl(var(--primary) / 0.4) 100%)' }}
        />
        
        {/* Faux Targets */}
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:animate-[ping_2s_infinite]" />
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-primary rounded-full opacity-0 group-hover:animate-[ping_3s_infinite_1s]" />

        {/* Center Node */}
        <div className="relative w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]" />
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-2 z-10">{title}</h3>
      <p className="text-xs text-muted-foreground text-center max-w-[250px] z-10 leading-relaxed">
        {description}
      </p>
      
      {/* System Status */}
      <div className="mt-8 flex items-center gap-2 z-10 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
         <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
         <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
           System Active
         </span>
      </div>
    </div>
  )
}

interface Metric {
  label: string
  value: string
  to: string
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((metric) => (
        <motion.div
          key={metric.label}
          variants={itemVariants}
          className="relative group overflow-hidden rounded-2xl bg-background border border-border/60 p-6 shadow-sm hover:shadow-md transition-all"
        >
          <Link
            to={metric.to}
            className="absolute inset-0 z-10 rounded-2xl"
            aria-label={`View ${metric.label}`}
          >
            <span className="sr-only">{metric.label}</span>
          </Link>
          {/* Glowing Top Edge on Hover */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {metric.label}
          </div>
          <div className="text-4xl font-black text-foreground font-mono tracking-tighter">
            {metric.value}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// --- Main Page ---
export function DashboardPage() {
  usePageMeta({
    title: 'Dashboard — Victor Job OS',
    description: "Here's what needs your attention today.",
    noindex: true,
    path: '/app/dashboard',
  })
  const { counts, refresh: refreshCounts } = useJobCounts()
  const { jobs: recentJobs, loading: recentLoading, refresh: refreshRecent } = useJobsPage({
    pageSize: 5,
    skipCount: true,
  })
  const { items: outreach } = useOutreach()
  const { items: followUps } = useFollowUps()

  const refresh = () => Promise.all([refreshCounts(), refreshRecent()])

  const newCount = counts.new
  const qualifiedCount = counts.qualified
  const awaitingCount = counts.rejected

  const now = new Date()
  const draftsAwaiting = outreach.filter(
    (item) => item.status === 'needs-review' || item.status === 'draft',
  ).length
  const approvedCount = outreach.filter(
    (item) => item.status === 'approved' || item.status === 'scheduled',
  ).length
  const sentToday = outreach.filter((item) => {
    const sent = item.sentAt?.toDate?.()
    return sent ? sent.toDateString() === now.toDateString() : false
  }).length
  const replies = outreach.filter((item) => item.status === 'replied').length
  const followUpsDue = followUps.filter((item) => {
    if (item.status !== 'pending') return false
    const due = item.scheduledFor?.toDate?.() ?? now
    return due <= now
  }).length

  const metrics: Metric[] = [
    { label: 'New opportunities', value: String(newCount), to: '/app/opportunities?status=new' },
    { label: 'Qualified', value: String(qualifiedCount), to: '/app/opportunities?status=qualified' },
    { label: 'Awaiting review', value: String(awaitingCount), to: '/app/opportunities?status=rejected' },
    { label: 'Follow-ups due', value: String(followUpsDue), to: '/app/outreach' },
  ]

  const outreachMetrics: Metric[] = [
    { label: 'Drafts awaiting review', value: String(draftsAwaiting), to: '/app/outreach' },
    { label: 'Approved', value: String(approvedCount), to: '/app/outreach' },
    { label: 'Sent today', value: String(sentToday), to: '/app/outreach' },
    { label: 'Replies', value: String(replies), to: '/app/outreach' },
  ]

  return (
    <PageContainer
      title="Good morning, Victor"
      description="Here's what needs your attention today."
      actions={
        <div className="flex items-center gap-2">
          <QualifyNewButton
            pendingCount={counts.new}
            onComplete={() => void refresh()}
          />
          <RunDiscoveryButton onComplete={() => void refresh()} />
        </div>
      }
    >
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="flex flex-col gap-8 pb-10"
      >
        
        {/* Opportunity metrics */}
        <MetricGrid metrics={metrics} />

        {/* Outreach metrics */}
        <div className="flex flex-col gap-3">
          <h2 className="px-1 text-sm font-bold text-foreground">Outreach</h2>
          <MetricGrid metrics={outreachMetrics} />
        </div>

        {/* Priority & Queue Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div variants={itemVariants} className="flex flex-col gap-3">
             <h2 className="text-sm font-bold text-foreground px-1">Today&apos;s priorities</h2>
             <ActiveRadarState 
               title="Your pipeline is ready"
               description="Qualified opportunities and outreach drafts will appear here."
             />
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-3">
             <h2 className="text-sm font-bold text-foreground px-1">Outreach queue</h2>
             <ActiveRadarState 
               title={draftsAwaiting > 0 ? `${draftsAwaiting} draft${draftsAwaiting === 1 ? '' : 's'} awaiting review` : 'No drafts awaiting review'}
               description={draftsAwaiting > 0 ? 'Open Outreach to review, approve, and send them.' : 'Outreach drafts that need your attention will appear here.'}
             />
          </motion.div>
        </div>

        {/* Recent Opportunities */}
        <motion.div variants={itemVariants} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-foreground px-1">Recent opportunities</h2>
          <RecentOpportunities jobs={recentJobs} loading={recentLoading} />
        </motion.div>
        
      </motion.div>
    </PageContainer>
  )
}