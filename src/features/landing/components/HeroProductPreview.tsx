import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function HeroProductPreview() {
  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-2 shadow-sm">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold text-foreground">Opportunities</span>
        <Badge variant="outline" className="text-[0.65rem]">
          Demo
        </Badge>
      </div>
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">React Engineer</CardTitle>
          <div className="text-xs text-muted-foreground">Remote · Greenhouse</div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">Fit:</span>
            <Badge variant="secondary" className="text-[0.65rem]">
              High
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {['React', 'Firebase', 'Node.js'].map((tech) => (
              <Badge key={tech} variant="outline" className="text-[0.65rem]">
                {tech}
              </Badge>
            ))}
          </div>
          <Button size="sm" className="mt-1 w-fit">
            View Opportunity
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}