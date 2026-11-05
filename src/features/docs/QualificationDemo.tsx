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
  { id: 'distributed', name: 'Distributed Systems & Queues', category: 'Backend', weight: 20 },
  { id: 'cloud', name: 'Cloud Functions & Serverless', category: 'Infra', weight: 15 },
  { id: 'ai', name: 'LLM Prompt Engineering / Agents', category: 'AI & Automation', weight: 15 },
  { id: 'leadership', name: 'Technical Leadership & Mentorship', category: 'Soft Skills', weight: 15 },
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
      v = 'EXCELLENT FIT — QUEUE DRAFT'
      c = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    } else if (total >= 75) {
      v = 'HIGH FIT — QUALIFIED'
      c = 'text-primary bg-primary/10 border-primary/25'
    } else {
      v = 'MARGINAL FIT — REVIEW REQUIRED'
      c = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25'
    }

    return { totalScore: total, verdict: v, verdictColor: c }
  }, [selectedSkillIds, seniorityLevel])

  return (
    <div className="rounded-2xl border bg-card/60 backdrop-blur-md p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Target className="size-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Live Qualification Simulator
            </span>
          </div>
          <h3 className="mt-1.5 text-lg font-bold text-foreground">
            Test the Role Qualification Algorithm
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Toggle skills and seniority levels to see how the system computes multi-factor match verdicts.
          </p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto gap-1 border-primary/20 bg-primary/5 text-primary">
          <SlidersHorizontal className="size-3" />
          Interactive Simulator
        </Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left: Interactive Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Candidate Target Skills
            </label>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {AVAILABLE_SKILLS.map((skill) => {
                const isChecked = selectedSkillIds.includes(skill.id)
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border ${
                      isChecked
                        ? 'border-primary/40 bg-primary/10 text-primary font-semibold shadow-2xs'
                        : 'border-border/70 bg-background/70 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`flex size-4 items-center justify-center rounded-sm text-[10px] ${
                        isChecked ? 'bg-primary text-primary-foreground' : 'border border-border'
                      }`}
                    >
                      {isChecked && <Check className="size-3" />}
                    </span>
                    <span>{skill.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Role Seniority Requirement
            </label>
            <div className="mt-2.5 flex gap-2">
              {(['mid', 'senior', 'staff'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeniorityLevel(level)}
                  className={`flex-1 rounded-lg py-2 px-3 text-xs font-medium capitalize border transition-all ${
                    seniorityLevel === level
                      ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'border-border/70 bg-background/80 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {level === 'mid' ? 'Mid-Level' : level === 'senior' ? 'Senior (5-8y)' : 'Staff / Lead (8y+)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Dynamic Score Meter */}
        <div className="lg:col-span-5 rounded-xl border border-border/70 bg-background/90 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall Match Score</span>
              <span className="font-mono text-[10px] uppercase font-semibold text-primary">Weighted Model</span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-foreground">
                {totalScore}%
              </span>
              <Badge variant="outline" className={`text-xs font-semibold border ${verdictColor}`}>
                {verdict}
              </Badge>
            </div>

            {/* Score Progress Bar */}
            <div className="mt-4 h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${totalScore}%` }}
              />
            </div>

            <div className="mt-5 space-y-2 text-xs">
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

          <div className="mt-6 pt-4 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Threshold for automated queueing: 80%</span>
            <span className="font-semibold text-primary inline-flex items-center gap-0.5">
              Strict Gate <ArrowUpRight className="size-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

