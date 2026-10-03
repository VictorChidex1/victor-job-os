import { Reveal } from '@/components/motion/Reveal'
import { landingContent } from '@/features/landing/data/landing-content'

const manualSteps = ['Search', 'Open job', 'Read description', 'Research company', 'Write email', 'Apply', 'Track', 'Repeat']

export function ProblemSection() {
  return (
    <section className="border-b">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {landingContent.problem}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {manualSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                  {step}
                </span>
                {index < manualSteps.length - 1 && (
                  <span className="text-muted-foreground/50" aria-hidden="true">
                    ↓
                  </span>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}