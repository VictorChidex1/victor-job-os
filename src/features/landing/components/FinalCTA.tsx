import { useRef } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { motion, useScroll, useTransform } from 'framer-motion'
import { landingContent } from '@/features/landing/data/landing-content'

export function FinalCTA() {
  const containerRef = useRef<HTMLElement>(null)
  
  // Track scroll progress to trigger the "Event Horizon" pull
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  })

  // Scale the blueprint grid up as we scroll down into it
  const gridScale = useTransform(scrollYProgress, [0, 1], [1, 1.4])
  
  // Fade and push the content up slightly as you enter
  const contentY = useTransform(scrollYProgress, [0, 1], [100, 0])
  const contentOpacity = useTransform(scrollYProgress, [0.3, 1], [0, 1])

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-[700px] md:min-h-[900px] w-full bg-black overflow-hidden flex items-center justify-center border-t border-border/10"
    >
      
      {/* 1. The Scaling Grid Background (The Blueprint) */}
      <motion.div 
        style={{ scale: gridScale }}
        className="absolute inset-[-50%] z-0 flex items-center justify-center pointer-events-none"
      >
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            backgroundPosition: 'center center'
          }}
        />
      </motion.div>

      {/* 2. The Vignette / Event Horizon Masks */}
      {/* Radial fade to black on the edges */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_10%,#000_80%)] pointer-events-none" />
      {/* Linear fade to black at top and bottom to blend seamlessly */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-transparent to-black pointer-events-none opacity-90" />

      {/* 3. The Climax Content */}
      <motion.div 
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-20 mx-auto w-full max-w-screen-xl px-4 text-center flex flex-col items-center"
      >
        
        {/* Glowing Status Badge */}
        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse shadow-[0_0_8px_rgba(var(--primary),1)]" />
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-zinc-300 uppercase">
            System Initialization Ready
          </span>
        </div>

        {/* Massive Typography */}
        <h2 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] drop-shadow-2xl">
          {landingContent.finalCta.heading}
        </h2>
        
        <p className="mx-auto mt-8 max-w-xl text-lg md:text-xl text-zinc-400 leading-relaxed font-light">
          {landingContent.finalCta.support}
        </p>
        
        {/* The Action Button */}
        <div className="mt-12 md:mt-16">
          <Button 
            size="lg" 
            className="group relative h-14 md:h-16 px-8 md:px-12 text-base md:text-lg font-bold bg-white text-black hover:bg-zinc-200 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all duration-500 hover:shadow-[0_0_80px_-15px_rgba(255,255,255,0.6)] hover:scale-105 rounded-full overflow-hidden" 
            render={<Link to="/login" />}
          >
            <span className="relative z-10">{landingContent.finalCta.cta}</span>
            {/* Hover Light Sweep */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          </Button>
        </div>

      </motion.div>
    </section>
  )
}