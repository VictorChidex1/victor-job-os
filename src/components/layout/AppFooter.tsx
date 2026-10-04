export function AppFooter() {
  return (
    <footer className="flex shrink-0 items-center gap-2 border-t px-4 py-3">
      <img
        src="/assets/victor-job-os.png"
        alt="Victor's Job OS logo"
        className="size-5 rounded object-contain"
      />
      <span className="text-xs font-medium text-foreground">Victor&apos;s Job OS</span>
      <span className="text-xs text-muted-foreground">· Opportunity command center</span>
      <span className="ml-auto text-[0.68rem] text-muted-foreground">
        V1 · Opportunity Intelligence
      </span>
    </footer>
  )
}