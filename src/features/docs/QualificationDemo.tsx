import { useState, useMemo } from 'react'
import { Target, Check, SlidersHorizontal, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SkillItem {
  id: string
  name: string
  category: string
  weight: number
}

const AVAILABLE_SKILLS: SkillItem[] = [
  { id: 'react', name: 'React 19 / Modern Frontend', category: 'Core Stack', weight: 20 },
  { id: 'ts', name: 'TypeScript Architecture', category: 'Core Stack', weight: 15 },
  { id: 'distributed', name: 'Distributed Systems', category: 'Backend', weight: 20 },
  { id: 'cloud', name: 'Cloud & Serverless', category: 'Infra', weight: 15 },
  { id: 'ai', name: 'LLM Prompt Engineering', category: 'AI & Automation', weight: 15 },
  { id: 'leadership', name: 'Tech Leadership', category: 'Soft Skills', weight: 15 },
]

export function QualificationDemo() {
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([
    'react',
    'ts',
    'distributed',
    'cloud',
    'ai',
  ])
  const [seniorityLevel, setSeniorityLevel] = useState<'mid' | 'senior' | 'staff'>('staff')

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  // Calculate score based on selections
  const { totalScore, verdict, verdictColor } = useMemo(() => {
    const rawSkillPoints = selectedSkillIds.reduce((acc, id) => {
      const skill = AVAILABLE_SKILLS.find((s) => s.id === id)
      return acc + (skill?.weight ?? 0)
    }, 0)

    const seniorityBonus = seniorityLevel === 'staff' ? 10 : seniorityLevel === 'senior' ? 6 : 2
    const total = Math.min(99, Math.round((rawSkillPoints * 0.9) + seniorityBonus))

    let v = 'STRONG FIT'
    let c = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25'
    if (total >= 90) {
      v = 'EXCELLENT FIT'
      c = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    } else if (total >= 75) {
      v = 'HIGH FIT'
      c = 'text-primary bg-primary/10 border-primary/25'
    } else {
      v = 'REVIEW REQUIRED'
      c = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25'
    }

    return { totalScore: total, verdict: v, verdictColor: c }
  }, [selectedSkillIds, seniorityLevel])

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 sm:p-6 lg:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4 sm:pb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Target className="size-3.5" />
            </span>
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary truncate">
              Live Qualification Simulator
            </span>
          </div>
          <h3 className="mt-1.5 text-base sm:text-lg font-bold text-foreground">
            Test the Role Qualification Algorithm
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Toggle skills and seniority levels to see how the system computes multi-factor match verdicts.
          </p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto shrink-0 gap-1 border-primary/20 bg-primary/5 text-primary text-xs">
          <SlidersHorizontal className="size-3" />
          Interactive Simulator
        </Badge>
      </div>

      <div className="mt-5 sm:mt-6 grid gap-6 lg:grid-cols-12 min-w-0 max-w-full">
        {/* Left: Interactive Controls */}
        <div className="lg:col-span-7 space-y-5 min-w-0 max-w-full">
          <div>
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Candidate Target Skills
            </label>
            <div className="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2">
              {AVAILABLE_SKILLS.map((skill) => {
                const isChecked = selectedSkillIds.includes(skill.id)
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border ${
                      isChecked
                        ? 'border-primary/40 bg-primary/10 text-primary font-semibold shadow-2xs'
                        : 'border-border/70 bg-background/70 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`flex size-3.5 items-center justify-center rounded-sm text-[9px] shrink-0 ${
                        isChecked ? 'bg-primary text-primary-foreground' : 'border border-border'
                      }`}
                    >
                      {isChecked && <Check className="size-2.5" />}
                    </span>
                    <span className="truncate">{skill.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Role Seniority Requirement
            </label>
            <div className="mt-2.5 flex gap-1.5 sm:gap-2">
              {(['mid', 'senior', 'staff'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeniorityLevel(level)}
                  className={`flex-1 rounded-lg py-2 px-1.5 sm:px-3 text-[11px] sm:text-xs font-medium capitalize border transition-all text-center truncate ${
                    seniorityLevel === level
                      ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'border-border/70 bg-background/80 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {level === 'mid' ? 'Mid-Level' : level === 'senior' ? 'Senior' : 'Staff / Lead'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Dynamic Score Meter */}
        <div className="lg:col-span-5 rounded-xl border border-border/70 bg-background/90 p-4 sm:p-5 flex flex-col justify-between min-w-0 max-w-full">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall Match Score</span>
              <span className="font-mono text-[10px] uppercase font-semibold text-primary">Weighted Model</span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {totalScore}%
              </span>
              <Badge variant="outline" className={`text-xs font-semibold border ${verdictColor}`}>
                {verdict}
              </Badge>
            </div>

            {/* Score Progress Bar */}
            <div className="mt-3.5 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${totalScore}%` }}
              />
            </div>

            <div className="mt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Technical Alignment:</span>
                <span className="font-medium text-foreground">{Math.round(totalScore * 0.45)}% / 45%</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Seniority & Experience:</span>
                <span className="font-medium text-foreground">{Math.round(totalScore * 0.35)}% / 35%</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Preference & Terms:</span>
                <span className="font-medium text-foreground">{Math.round(totalScore * 0.20)}% / 20%</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Automated threshold: 80%</span>
            <span className="font-semibold text-primary inline-flex items-center gap-0.5">
              Strict Gate <ArrowUpRight className="size-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
