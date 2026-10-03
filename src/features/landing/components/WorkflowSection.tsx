import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Reveal } from '@/components/motion'
import { landingContent } from '@/features/landing/data/landing-content'

export function WorkflowSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track scroll progress through this specific section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  })

  // Map scroll progress to the height of the glowing line
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  return (
    <section id="workflow" className="border-b bg-muted/10 overflow-hidden relative" ref={containerRef}>
      <div className="mx-auto w-full max-w-screen-xl px-4 py-24 sm:px-6 lg:py-32">
        
        {/* Section Header */}
        <Reveal>
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-20 md:mb-32">
            <Badge variant="outline" className="mb-6 text-[0.65rem] font-medium tracking-wide uppercase px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary">
              How It Works
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl leading-[1.1]">
              {landingContent.workflowHeading}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              One connected, intelligent pipeline — from the first discovery signal to the recorded outcome.
            </p>
          </div>
        </Reveal>

        {/* The Execution Graph */}
        <div className="relative max-w-4xl mx-auto">
          
          {/* The Static Backbone Line */}
          <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-[2px] bg-border/60 -translate-x-1/2 rounded-full" />
          
          {/* The Glowing Data Pulse (Scroll Driven) */}
          <motion.div 
            style={{ height: lineHeight }} 
            className="absolute left-[28px] md:left-1/2 top-0 w-[2px] bg-primary -translate-x-1/2 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)] z-10" 
          />

          <div className="flex flex-col gap-12 md:gap-24 relative z-20">
            {landingContent.workflow.map((step, index) => {
              const isEven = index % 2 === 0;
              
              return (
                <div key={step.step} className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-0 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                  
                  {/* Desktop Alignment Spacer */}
                  <div className="hidden md:block flex-1" />

                  {/* The Node Checkpoint */}
                  <div className="absolute left-[28px] md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-background border-[3px] border-muted flex items-center justify-center z-20 shadow-sm transition-colors duration-500">
                     <motion.div 
                       initial={{ scale: 0, opacity: 0 }}
                       whileInView={{ scale: 1, opacity: 1 }}
                       transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                       viewport={{ once: true, margin: "-20%" }}
                       className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),1)]" 
                     />
                  </div>

                  {/* The Detail Card */}
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? 40 : -40, y: 20 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
                    viewport={{ once: true, margin: "-20%" }}
                    className={`flex-1 w-full pl-20 md:pl-0 ${isEven ? 'md:pr-16 lg:pr-24' : 'md:pl-16 lg:pl-24'}`}
                  >
                    <div className="relative group">
                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Card Content */}
                      <div className={`relative flex flex-col p-6 md:p-8 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-border/60 shadow-sm hover:border-primary/30 transition-colors duration-300 ${isEven ? 'md:items-end md:text-right' : 'md:items-start md:text-left'}`}>
                        
                        <div className={`flex items-center gap-3 mb-4 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                           <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono border border-primary/20">
                             {step.step}
                           </span>
                           <h3 className="text-xl font-bold text-foreground tracking-tight">
                             {step.title}
                           </h3>
                        </div>
                        
                        <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
                           {step.description}
                        </p>

                      </div>
                    </div>
                  </motion.div>
                  
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}