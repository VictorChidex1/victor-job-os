import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Reveal } from '@/components/motion'
import { landingContent } from '@/features/landing/data/landing-content'

export function AutomationSection() {
  // Generate mock logs based on the automationHandles array
  const terminalLogs = landingContent.automationHandles.map((handle, index) => {
    // Make the last few items look like they are waiting or queued
    let status = 'DONE'
    if (index === 5) status = 'WAITING'
    if (index > 5) status = 'QUEUED'
    
    // Fake timestamps
    const time = `14:22:0${index}`
    return { action: handle, time, status }
  })

  // Duplicate for infinite scroll
  const scrollLogs = [...terminalLogs, ...terminalLogs]

  return (
    <section id="automation" className="border-b bg-background overflow-hidden">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          
          {/* Left: Text & Human Controls */}
          <Reveal>
            <div className="max-w-xl">
              <Badge variant="outline" className="mb-6 text-[0.65rem] font-medium tracking-wide uppercase px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary">
                Automation
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl leading-[1.1]">
                Automation handles the work. You control the decisions.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Repetitive preparation is handled in the background at machine speed. But consequential actions—like sending an email or submitting an application—stop and wait for your executive approval.
              </p>

              <div className="mt-10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-6">
                  You retain absolute control over:
                </h4>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {landingContent.humanControls.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground font-medium">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {/* Right: The Dual-Engine Pipeline Visual */}
          <Reveal delay={0.2}>
            <div className="relative w-full aspect-[4/3] md:aspect-[4/3] max-w-[600px] mx-auto lg:ml-auto">
              
              {/* The Engine (Terminal Background) */}
              <div className="absolute inset-0 right-4 bottom-4 md:right-12 md:bottom-12 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden font-mono text-[11px] md:text-xs text-zinc-400 p-6 flex flex-col">
                {/* Terminal Header */}
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800/50">
                  <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-zinc-800" />
                    <div className="size-2.5 rounded-full bg-zinc-800" />
                    <div className="size-2.5 rounded-full bg-zinc-800" />
                  </div>
                  <span className="text-zinc-600 ml-2">Job_OS_Automation_Engine</span>
                </div>

                {/* Fade Overlays */}
                <div className="absolute inset-x-0 top-[60px] h-12 bg-gradient-to-b from-zinc-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent z-10 pointer-events-none" />

                {/* Scrolling Logs */}
                <div className="relative flex-1 overflow-hidden">
                  <motion.div 
                    animate={{ y: ["0%", "-50%"] }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    className="absolute top-0 left-0 right-0 flex flex-col gap-3.5 pr-4"
                  >
                    {scrollLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                        <span className={`shrink-0 ${
                          log.status === 'DONE' ? 'text-emerald-500' : 
                          log.status === 'WAITING' ? 'text-amber-500' : 'text-zinc-600'
                        }`}>
                          {log.status === 'DONE' ? '✓' : log.status === 'WAITING' ? '⚠' : '○'}
                        </span>
                        <span className={log.status === 'WAITING' ? 'text-zinc-200' : ''}>
                          {log.action}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* The Gate (Foreground Human Control) */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8, type: "spring", bounce: 0.3 }}
                viewport={{ once: true }}
                className="absolute -right-2 -bottom-2 md:right-0 md:bottom-0 w-[280px] md:w-[320px] rounded-xl bg-white dark:bg-zinc-900 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] border border-border/50 p-5 z-20 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action Required</span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Just now</span>
                </div>
                
                <div className="space-y-4">
                  <div className="text-sm font-semibold leading-tight text-foreground">
                    Outreach draft for Senior React Engineer ready for review.
                  </div>
                  
                  {/* Mock Draft Preview */}
                  <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/40 border border-border/50 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/50" />
                    <span className="italic">"Hi team, I noticed you are scaling the frontend infrastructure. Given my recent work on similar architecture at..."</span>
                  </div>
                  
                  <div className="flex gap-2 w-full pt-1">
                    <button className="flex-1 px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors">
                      Reject
                    </button>
                    <button className="flex-1 px-3 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors">
                      Approve & Send
                    </button>
                  </div>
                </div>
              </motion.div>

            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}