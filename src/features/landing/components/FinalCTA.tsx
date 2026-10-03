import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/motion'
import { landingContent } from '@/features/landing/data/landing-content'

export function FinalCTA() {
  return (
    <section className="border-b">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {landingContent.finalCta.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            {landingContent.finalCta.support}
          </p>
          <Button size="lg" className="mt-8" render={<Link to="/login" />}>
            {landingContent.finalCta.cta}
          </Button>
        </Reveal>
      </div>
    </section>
  )
}