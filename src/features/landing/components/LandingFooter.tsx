import { Link } from 'react-router'

const currentYear = new Date().getFullYear()

const productLinks = [
  { label: 'How It Works', href: '#workflow' },
  { label: 'Features', href: '#features' },
  { label: 'Product', href: '#product' },
]

export function LandingFooter() {
  return (
    <footer className="bg-background border-t relative overflow-hidden">
      
      <div className="mx-auto w-full max-w-screen-2xl px-6 pt-20 lg:pt-24 pb-8">
        
        {/* Top Grid: Brand & Links */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src="/assets/victor-job-os.png"
                alt="Victor Job OS logo"
                className="size-8 rounded object-contain shadow-sm"
              />
              <span className="text-base font-bold text-foreground tracking-tight">Victor Job OS</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              A personal opportunity intelligence and career operations platform. Engineered for execution.
            </p>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Product</div>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="group relative flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 py-1">
                    <span className="absolute -left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Application</div>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="group relative flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 py-1">
                  <span className="absolute -left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                  <span>Sign In</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="group relative flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 py-1">
                  <span className="absolute -left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                  <span>Open Job OS</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-16 border-t border-border/40 pt-8 flex flex-col items-center">
          
          <div className="w-full flex flex-col sm:flex-row justify-between items-center text-xs font-medium text-muted-foreground px-2 gap-4">
            <span>© {currentYear} Victor Job OS. All rights reserved.</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              All Systems Operational
            </span>
          </div>
          
        </div>
      </div>
    </footer>
  )
}