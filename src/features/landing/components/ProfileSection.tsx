import { Card, CardContent } from '@/components/ui/card'
import { Reveal } from '@/components/motion'
import { landingContent } from '@/features/landing/data/landing-content'

export function ProfileSection() {
  return (
    <section className="border-b">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {landingContent.profile.title}
              </h2>
              <p className="mt-3 max-w-md text-base text-muted-foreground">
                {landingContent.profile.description}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <Card className="bg-muted/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/victor-chidera-logo.webp"
                    alt="Victor Job OS logo"
                    className="size-5 rounded object-contain"
                  />
                  <span className="text-sm font-semibold text-foreground">Victor</span>
                </div>
                <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {landingContent.profile.dimensions.map((dimension) => (
                    <li key={dimension} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="size-1 shrink-0 rounded-full bg-primary/60" />
                      {dimension}
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