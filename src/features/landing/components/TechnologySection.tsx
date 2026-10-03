import { Badge } from '@/components/ui/badge'
import { Reveal } from '@/components/motion'
import { landingContent } from '@/features/landing/data/landing-content'

export function TechnologySection() {
  return (
    <section id="technology" className="border-b">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <Badge variant="outline" className="mb-3 text-[0.65rem] font-medium tracking-wide uppercase">
            Technology
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Built on a modern, serverless stack.
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {landingContent.technology.map((tech) => (
              <Badge key={tech} variant="outline">
                {tech}
              </Badge>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}