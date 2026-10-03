import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Reveal } from '@/components/motion'

const previewStats = [
  { label: 'New opportunities', value: '24' },
  { label: 'Qualified', value: '8' },
  { label: 'Outreach drafts', value: '6' },
  { label: 'Applications', value: '3' },
]

const previewList = [
  { title: 'React Engineer', meta: 'Remote · Greenhouse' },
  { title: 'Full Stack Developer', meta: 'Remote · Lever' },
]

export function ProductPreviewSection() {
  return (
    <section id="product" className="border-b">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <Badge variant="outline" className="mb-3 text-[0.65rem] font-medium tracking-wide uppercase">
            Product
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            See the product
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            A command center for the work that happens around every opportunity.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/victor-chidera-logo.webp"
                  alt="Victor Job OS logo"
                  className="size-5 rounded object-contain"
                />
                <span className="text-xs font-semibold text-foreground">Victor Job OS</span>
              </div>
              <Badge variant="outline" className="text-[0.65rem]">
                Demo preview
              </Badge>
            </div>
            <div className="grid gap-0 lg:grid-cols-[180px_1fr]">
              <aside className="hidden border-r bg-muted/20 p-3 lg:block">
                {['Dashboard', 'Opportunities', 'Outreach', 'Applications', 'Companies'].map(
                  (item, index) => (
                    <div
                      key={item}
                      className={
                        index === 0
                          ? 'rounded-md bg-accent px-2 py-1.5 text-xs font-medium text-accent-foreground'
                          : 'px-2 py-1.5 text-xs text-muted-foreground'
                      }
                    >
                      {item}
                    </div>
                  ),
                )}
              </aside>
              <div className="p-5">
                <div className="mb-4 text-sm font-medium text-foreground">Good morning, Victor</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {previewStats.map((stat) => (
                    <Card key={stat.label}>
                      <CardContent className="p-3">
                        <div className="text-lg font-semibold text-foreground">{stat.value}</div>
                        <div className="text-[0.7rem] text-muted-foreground">{stat.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Today&apos;s opportunities
                  </div>
                  <div className="mt-2 space-y-2">
                    {previewList.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-md border p-3 text-sm"
                      >
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.meta}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}