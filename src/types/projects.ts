export interface PortfolioProject {
  id: string
  title: string
  summary: string
  technologies: string[]
  problem: string
  solution: string
  outcomes: string[]
  verifiedMetrics: string[]
  url?: string
  relevanceTags: string[]
  isActive: boolean
  updatedAt: Date
}