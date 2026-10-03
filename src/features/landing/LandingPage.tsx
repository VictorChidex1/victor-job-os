import { LandingHeader } from '@/features/landing/components/LandingHeader'
import { HeroSection } from '@/features/landing/components/HeroSection'
import { ProblemSection } from '@/features/landing/components/ProblemSection'
import { SystemTransition } from '@/features/landing/components/SystemTransition'
import { WorkflowSection } from '@/features/landing/components/WorkflowSection'
import { ProductPreviewSection } from '@/features/landing/components/ProductPreviewSection'
import { FeatureSection } from '@/features/landing/components/FeatureSection'
import { ProfileSection } from '@/features/landing/components/ProfileSection'
import { AutomationSection } from '@/features/landing/components/AutomationSection'
import { TechnologySection } from '@/features/landing/components/TechnologySection'
import { FinalCTA } from '@/features/landing/components/FinalCTA'
import { LandingFooter } from '@/features/landing/components/LandingFooter'

export function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <SystemTransition />
        <WorkflowSection />
        <ProductPreviewSection />
        <FeatureSection />
        <ProfileSection />
        <AutomationSection />
        <TechnologySection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}