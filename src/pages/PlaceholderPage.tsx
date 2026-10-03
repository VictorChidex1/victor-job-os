import { Link, useLocation } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/outreach', label: 'Outreach' },
  { to: '/companies', label: 'Companies' },
  { to: '/projects', label: 'Projects' },
  { to: '/settings', label: 'Settings' },
]

export function PlaceholderPage() {
  const location = useLocation()
  const label = location.pathname === '/' ? 'Dashboard' : location.pathname

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Victor&apos;s Job OS
            <Badge variant="outline">V1</Badge>
          </CardTitle>
          <CardDescription>
            Foundation phase — this route is a placeholder.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground">
            Active route: <span className="font-mono">{label}</span>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Placeholder navigation">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Button variant="secondary" size="sm" type="button">
            Stack ready
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}