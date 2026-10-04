import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Reveal } from '@/components/motion'
import { landingContent } from '@/features/landing/data/landing-content'

export function ProfileSection() {
  const orbitNodes = [
    // Outer Ring (r=50%)
    { label: landingContent.profile.dimensions[5], style: { top: '25%', left: '93.3%' }, delay: 0.1 }, // Preferred roles
    { label: landingContent.profile.dimensions[6], style: { top: '75%', left: '6.7%' }, delay: 0.2 }, // Preferred locations
    { label: landingContent.profile.dimensions[7], style: { top: '25%', left: '6.7%' }, delay: 0.3 }, // Work preferences
    { label: landingContent.profile.dimensions[8], style: { top: '75%', left: '93.3%' }, delay: 0.4 }, // Outreach style

    // Middle Ring (r=35%)
    { label: landingContent.profile.dimensions[0], style: { top: '15%', left: '50%' }, delay: 0.5 }, // Skills
    { label: landingContent.profile.dimensions[1], style: { top: '85%', left: '50%' }, delay: 0.6 }, // Experience
    { label: landingContent.profile.dimensions[4], style: { top: '50%', left: '85%' }, delay: 0.7 }, // Technologies

    // Inner Ring (r=20%)
    { label: landingContent.profile.dimensions[2], style: { top: '36%', left: '36%' }, delay: 0.8 }, // Projects
    { label: landingContent.profile.dimensions[3], style: { top: '64%', left: '64%' }, delay: 0.9 }, // Portfolio
  ]

  return (
    <section id="profile" className="border-b overflow-hidden bg-background">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          
          {/* Left: Text Content */}
          <Reveal>
            <div className="max-w-xl">
              <Badge variant="outline" className="mb-6 text-[0.65rem] font-medium tracking-wide uppercase px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary">
                Built Around You
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl leading-[1.1]">
                {landingContent.profile.title}
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                {landingContent.profile.description}
              </p>
            </div>
          </Reveal>

          {/* Right: OS Kernel Orbital Animation */}
          <div className="relative w-full aspect-square max-w-[600px] mx-auto lg:ml-auto flex items-center justify-center pointer-events-none">
            
            {/* Outer Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
              className="absolute inset-0 border-[1px] border-dashed border-border/60 rounded-full"
            />

            {/* Middle Ring */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
              className="absolute top-[15%] left-[15%] right-[15%] bottom-[15%] border-[1px] border-border/40 rounded-full"
            />

            {/* Inner Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
              className="absolute top-[30%] left-[30%] right-[30%] bottom-[30%] border-[1px] border-dashed border-border/60 rounded-full"
            />

            {/* Glowing Background Radial */}
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.05)_0%,transparent_50%)] -z-10" />

            {/* Central OS Kernel */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              viewport={{ once: true }}
              className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-28 h-28 md:w-32 md:h-32 rounded-full bg-background/80 backdrop-blur-xl border border-primary/20 shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] z-30 flex flex-col items-center justify-center overflow-hidden"
            >
               {/* Internal Glow */}
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
               <img 
                 src="/assets/victor-job-os.png" 
                 alt="Victor Job OS" 
                 className="size-10 md:size-12 object-contain z-10" 
               />
               <motion.div
                 animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                 className="absolute inset-0 border rounded-full border-primary/20"
               />
            </motion.div>

            {/* Orbital Dimension Nodes */}
            {orbitNodes.map((node) => (
              <motion.div
                key={node.label}
                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: node.delay, duration: 0.6, type: 'spring', bounce: 0.4 }}
                viewport={{ once: true, margin: "-100px" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-border/50 shadow-sm flex items-center gap-2 z-40"
                style={node.style}
              >
                <motion.span 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2 + Math.random() * 2 }}
                  className="size-1.5 md:size-2 shrink-0 rounded-full bg-primary/70" 
                />
                <span className="text-[10px] md:text-[11px] font-medium text-foreground whitespace-nowrap tracking-wide">
                  {node.label}
                </span>
              </motion.div>
            ))}

          </div>
        </div>
      </div>
    </section>
  )
}