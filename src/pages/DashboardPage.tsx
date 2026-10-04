import { Link } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { RunDiscoveryButton } from '@/components/dashboard/RunDiscoveryButton'
import { RecentOpportunities } from '@/components/dashboard/RecentOpportunities'
import { useJobs } from '@/hooks/useJobs'
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

// --- Main Page ---
export function DashboardPage() {
  const { jobs, loading, refresh } = useJobs()

  const newCount = jobs.filter((job) => job.status === 'new').length
  const qualifiedCount = jobs.filter((job) => job.status === 'qualified').length
  const awaitingCount = jobs.filter((job) => job.status === 'rejected').length

  const metrics = [
    { label: 'New opportunities', value: String(newCount), to: '/app/opportunities?status=new' },
    { label: 'Qualified', value: String(qualifiedCount), to: '/app/opportunities?status=qualified' },
    { label: 'Awaiting review', value: String(awaitingCount), to: '/app/opportunities?status=rejected' },
    { label: 'Follow-ups due', value: '0', to: '/app/outreach' },
  ]

  return (
    <PageContainer
      title="Good morning, Victor"
      description="Here's what needs your attention today."
      actions={<RunDiscoveryButton onComplete={() => void refresh()} />}
    >
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="flex flex-col gap-8 pb-10"
      >
        
        {/* Metrics Grid */}
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
               title="No drafts awaiting review"
               description="Outreach drafts that need your attention will appear here."
             />
          </motion.div>
        </div>

        {/* Recent Opportunities */}
        <motion.div variants={itemVariants} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-foreground px-1">Recent opportunities</h2>
          <RecentOpportunities jobs={jobs} loading={loading} />
        </motion.div>
        
      </motion.div>
    </PageContainer>
  )
}