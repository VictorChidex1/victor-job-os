import { Card, CardContent } from '@/components/ui/card'
import { Reveal, StaggerContainer, StaggerItem } from '@/components/motion'
import { landingContent } from '@/features/landing/data/landing-content'

export function WorkflowSection() {
  return (
    <section id="workflow" className="border-b">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {landingContent.workflowHeading}
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            One connected workflow — from the first signal to the recorded outcome.
          </p>
        </Reveal>

        <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {landingContent.workflow.map((step) => (
            <StaggerItem key={step.step}>
              <Card className="h-full">
                <CardContent className="flex flex-col gap-2 p-5">
                  <span className="text-xs font-medium text-muted-foreground">{step.step}</span>
                  <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}