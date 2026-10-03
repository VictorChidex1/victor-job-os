import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion/FadeIn'
import { HeroProductPreview } from '@/features/landing/components/HeroProductPreview'
import { landingContent } from '@/features/landing/data/landing-content'

export function HeroSection() {
  return (
    <section className="border-b">
      <div className="mx-auto grid w-full max-w-screen-2xl gap-12 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-2 lg:items-center lg:pb-24 lg:pt-40">
        <div>
          <FadeIn>
            <Badge variant="outline" className="mb-4">
              {landingContent.productName.toUpperCase()}
            </Badge>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Your job search,
              <br />
              running like a system.
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 max-w-md text-base text-muted-foreground">
              {landingContent.heroSupport}
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link to="/login" />}>
                {landingContent.heroCtaPrimary}
              </Button>
              <Button size="lg" variant="outline" render={<a href="#workflow" />}>
                {landingContent.heroCtaSecondary}
              </Button>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.15} className="lg:justify-self-end">
          <HeroProductPreview />
        </FadeIn>
      </div>
    </section>
  )
}