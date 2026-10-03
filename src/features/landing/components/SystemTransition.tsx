import { Reveal } from '@/components/motion'
import { Separator } from '@/components/ui/separator'

const manual = ['Search', 'Research', 'Write', 'Apply', 'Track', 'Repeat']
const system = ['Discover', 'Qualify', 'Research', 'Match', 'Prepare', 'Review', 'Execute', 'Track']

export function SystemTransition() {
  return (
    <section className="border-b">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <Reveal>
            <div className="rounded-lg border p-6">
              <h3 className="text-sm font-semibold text-muted-foreground">Manual job search</h3>
              <ul className="mt-4 space-y-2">
                {manual.map((step) => (
                  <li key={step} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="hidden lg:flex">
            <Separator orientation="vertical" className="h-48" />
          </Reveal>
          <Reveal delay={0.1} className="lg:hidden">
            <Separator />
          </Reveal>

          <Reveal delay={0.2}>
            <div className="rounded-lg border bg-muted/30 p-6">
              <h3 className="text-sm font-semibold text-foreground">Victor Job OS</h3>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {system.map((step) => (
                  <li key={step} className="flex items-center gap-3 text-sm text-foreground">
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}