import {
  Compass,
  LayoutDashboard,
  Sparkles,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export interface DocCategory {
  id: string
  label: string
  icon: LucideIcon
  sectionIds: string[]
}

export const DOC_CATEGORIES: DocCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: Compass,
    sectionIds: ['overview', 'quick-start', 'workflow'],
  },
  {
    id: 'core-modules',
    label: 'Core Modules',
    icon: LayoutDashboard,
    sectionIds: ['dashboard', 'opportunities', 'applications', 'companies', 'outreach'],
  },
  {
    id: 'system-controls',
    label: 'System & Controls',
    icon: Sparkles,
    sectionIds: ['profile-projects', 'settings', 'ai-control', 'data-privacy'],
  },
  {
    id: 'reference',
    label: 'Reference',
    icon: ShieldCheck,
    sectionIds: ['roadmap', 'faq-glossary'],
  },
]

