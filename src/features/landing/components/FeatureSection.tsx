import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Reveal, StaggerContainer, StaggerItem } from '@/components/motion'
import { landingContent } from '@/features/landing/data/landing-content'

export function FeatureSection() {
  return (
    <section id="features" className="border-b">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <Badge variant="outline" className="mb-3 text-[0.65rem] font-medium tracking-wide uppercase">
            Features
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Everything around the job, organized.
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Capabilities grouped around the workflow they support.
          </p>
        </Reveal>

        <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {landingContent.capabilities.map((group) => (
            <StaggerItem key={group.title} className="h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">{group.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="size-1 shrink-0 rounded-full bg-primary/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}