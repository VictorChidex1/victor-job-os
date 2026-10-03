import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Reveal } from '@/components/motion'
import { landingContent } from '@/features/landing/data/landing-content'

export function AutomationSection() {
  return (
    <section id="automation" className="border-b">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Automation handles the work. You control the decisions.
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Repetitive preparation is automated. Consequential actions require approval.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Reveal delay={0.1}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Automation can handle</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {landingContent.automationHandles.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="size-1 shrink-0 rounded-full bg-primary/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.2}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Victor controls</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {landingContent.humanControls.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="size-1 shrink-0 rounded-full bg-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  )
}