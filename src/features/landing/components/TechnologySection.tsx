import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Reveal } from '@/components/motion'

export function TechnologySection() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track scroll progress through this specific section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  // Map scroll progress to Z-axis separation
  // As the user scrolls, the layers pull apart
  const topZ = useTransform(scrollYProgress, [0, 0.5, 1], [0, 160, 240])
  const midZ = useTransform(scrollYProgress, [0, 0.5, 1], [0, 80, 120])
  const glowOpacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0.3, 1, 0.3])

  return (
    <section id="technology" className="border-b bg-background overflow-hidden" ref={containerRef}>
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          
          {/* Left: Text Content */}
          <Reveal>
            <div className="max-w-xl">
              <Badge variant="outline" className="mb-6 text-[0.65rem] font-medium tracking-wide uppercase px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary">
                Technology
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl leading-[1.1]">
                Built on a modern, serverless stack.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Victor Job OS is engineered for speed, scale, and absolute zero-maintenance. The architecture is cleanly separated into presentation, logic, and data layers.
              </p>
            </div>
          </Reveal>

          {/* Right: The Holographic Stack */}
          <Reveal delay={0.2}>
            <div 
              className="relative w-full aspect-square max-w-[450px] mx-auto lg:ml-auto flex items-center justify-center pointer-events-none"
              style={{ perspective: 2000 }}
            >
              
              <motion.div 
                className="relative w-[70%] h-[70%]"
                style={{ 
                  rotateX: 60, 
                  rotateZ: -45, 
                  transformStyle: "preserve-3d" 
                }}
              >
                {/* Central Ambient Glow */}
                <motion.div 
                  style={{ opacity: glowOpacity }}
                  className="absolute inset-0 bg-primary/30 blur-[100px] rounded-full -translate-z-20"
                />

                {/* Layer 1: Data (Bottom) */}
                <motion.div 
                  style={{ translateZ: 0 }}
                  className="absolute inset-0 rounded-2xl bg-white/10 dark:bg-black/40 backdrop-blur-md border-[2px] border-border/50 shadow-[-20px_20px_40px_rgba(0,0,0,0.1)] p-6 md:p-8 flex flex-col justify-end"
                >
                  <div className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Data Layer
                  </div>
                  <div className="flex flex-wrap gap-3">
                     <span className="px-3 py-1.5 rounded-lg bg-background/80 font-semibold text-xs md:text-sm text-foreground shadow-sm border border-border/50">Firestore</span>
                     <span className="px-3 py-1.5 rounded-lg bg-background/80 font-semibold text-xs md:text-sm text-foreground shadow-sm border border-border/50">Firebase</span>
                  </div>
                </motion.div>

                {/* Layer 2: Logic (Middle) */}
                <motion.div 
                  style={{ z: midZ }}
                  className="absolute inset-0 rounded-2xl bg-white/30 dark:bg-zinc-900/60 backdrop-blur-md border-[2px] border-border/70 shadow-[-30px_30px_50px_rgba(0,0,0,0.15)] p-6 md:p-8 flex flex-col justify-end"
                >
                  <div className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Logic Layer
                  </div>
                  <div className="flex flex-wrap gap-3">
                     <span className="px-3 py-1.5 rounded-lg bg-background/90 font-semibold text-xs md:text-sm text-foreground shadow-sm border border-border/50">Node.js</span>
                     <span className="px-3 py-1.5 rounded-lg bg-background/90 font-semibold text-xs md:text-sm text-foreground shadow-sm border border-border/50">Cloud Functions</span>
                  </div>
                </motion.div>

                {/* Layer 3: Presentation (Top) */}
                <motion.div 
                  style={{ z: topZ }}
                  className="absolute inset-0 rounded-2xl bg-white/60 dark:bg-zinc-800/80 backdrop-blur-xl border-[2px] border-white/60 dark:border-white/20 shadow-[-40px_40px_60px_rgba(0,0,0,0.2)] p-6 md:p-8 flex flex-col justify-end"
                >
                  <div className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-widest text-primary">
                    Presentation Layer
                  </div>
                  <div className="flex flex-wrap gap-3">
                     <span className="px-3 py-1.5 rounded-lg bg-background font-semibold text-xs md:text-sm text-foreground shadow-sm border border-border/50">React</span>
                     <span className="px-3 py-1.5 rounded-lg bg-background font-semibold text-xs md:text-sm text-foreground shadow-sm border border-border/50">Framer Motion</span>
                     <span className="px-3 py-1.5 rounded-lg bg-background font-semibold text-xs md:text-sm text-foreground shadow-sm border border-border/50">shadcn/ui</span>
                  </div>
                </motion.div>

              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}