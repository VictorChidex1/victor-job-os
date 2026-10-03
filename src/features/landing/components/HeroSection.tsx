import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion/FadeIn'
import { motion } from 'framer-motion'
import { HeroProductPreview } from '@/features/landing/components/HeroProductPreview'
import { landingContent } from '@/features/landing/data/landing-content'
import { ArrowRight, Play, Check } from 'lucide-react'

export function HeroSection() {
  const titleLines = ["Your job search,", "running like a system."]
  
  return (
    <section className="relative overflow-hidden border-b bg-background">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)]"></div>

      <div className="relative mx-auto grid w-full max-w-[1700px] gap-8 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:items-center lg:pb-24 lg:pt-40">
        <div className="flex flex-col items-start z-10 max-w-2xl lg:ml-8">
          <FadeIn>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-border/50 bg-background/50 px-3 py-1.5 shadow-sm backdrop-blur-sm">
               <div className="flex items-center gap-2">
                 <span className="relative flex size-2">
                   <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                   <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
                 </span>
                 <span className="text-[0.65rem] font-bold tracking-widest text-foreground uppercase">
                   {landingContent.productName} ONLINE
                 </span>
               </div>
               <div className="h-3 w-[1px] bg-border/80"></div>
               <span className="text-[0.7rem] font-medium text-muted-foreground">
                 Automating opportunities 24/7
               </span>
            </div>
          </FadeIn>
          
          <div className="mt-2 flex flex-col">
            {titleLines.map((line, i) => (
              <div key={i} className="overflow-hidden pb-2">
                <motion.h1
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                  className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-[4.5rem] lg:leading-[1.05]"
                >
                  {line}
                </motion.h1>
              </div>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {landingContent.heroSupport}
            </p>
          </FadeIn>
          
          <FadeIn delay={0.5}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" className="rounded-full px-6 font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all" render={<Link to="/login" />}>
                {landingContent.heroCtaPrimary} <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-6 bg-background/50 backdrop-blur-sm shadow-sm hover:bg-background" render={<a href="#workflow" />}>
                <Play className="mr-2 size-4 fill-current" /> {landingContent.heroCtaSecondary}
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.6}>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {['Find opportunities', 'AI research', 'Personalized outreach', 'Track everything'].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="size-4 text-green-500" />
                  <span className="font-medium text-foreground/80">{feature}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        <div className="lg:justify-self-end relative z-10 w-full hidden lg:block">
           <HeroProductPreview />
        </div>
      </div>

      {/* Trusted Sources Footer */}
      <FadeIn delay={0.8}>
        <div className="relative z-10 mx-auto w-full border-t border-border/50 bg-background/30 backdrop-blur-md px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-[1700px] flex flex-col md:flex-row md:items-center justify-between gap-6 lg:px-8">
            <div className="shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trusted Sources</h3>
              <p className="text-sm font-medium text-foreground/80 mt-1">Real opportunities from top companies</p>
            </div>
            <div className="flex flex-wrap items-center gap-8 opacity-60 grayscale transition-all hover:grayscale-0">
               <span className="font-bold text-lg flex items-center gap-2">▲ Vercel</span>
               <span className="font-bold text-lg">Linear</span>
               <span className="font-bold text-lg border border-current p-1 rounded-sm leading-none">N Notion</span>
               <span className="font-bold text-lg text-purple-600">R Remote</span>
               <span className="font-bold text-lg">GitHub</span>
               <span className="font-bold text-lg text-blue-500">Dropbox</span>
               <span className="font-bold text-lg text-green-500">Spotify</span>
               <span className="text-sm text-muted-foreground ml-4 hidden xl:block">and more...</span>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}