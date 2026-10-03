import { Link } from 'react-router'

const currentYear = new Date().getFullYear()

const productLinks = [
  { label: 'How It Works', href: '#workflow' },
  { label: 'Features', href: '#features' },
  { label: 'Product', href: '#product' },
]

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <img
                src="/assets/victor-chidera-logo.webp"
                alt="Victor Job OS logo"
                className="size-6 rounded object-contain"
              />
              <span className="text-sm font-semibold text-foreground">Victor Job OS</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              A personal opportunity intelligence and career operations platform.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground">Product</div>
            <ul className="mt-3 space-y-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-foreground/80 hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground">Application</div>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/login" className="text-sm text-foreground/80 hover:text-foreground">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-foreground/80 hover:text-foreground">
                  Open Job OS
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-xs text-muted-foreground">
          © {currentYear} Victor Job OS
        </div>
      </div>
    </footer>
  )
}