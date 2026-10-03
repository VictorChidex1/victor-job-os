import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Building2,
  Send,
  Mail,
  Briefcase,
  CheckCircle2,
  ListTodo,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const workflowTasks = [
  "Search",
  "Open job",
  "Understand",
  "Research",
  "Prepare",
  "Apply",
  "Track",
  "Repeat",
];

export function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["0.2 end", "0.8 start"],
  });

  return (
    <section
      ref={sectionRef}
      id="problem"
      className="relative w-full bg-background py-24 sm:py-32 overflow-hidden border-b"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <ProblemIntro />

        <div className="mb-20">
          <div className="text-center text-[10px] sm:text-xs font-bold tracking-widest text-muted-foreground uppercase mb-6">
            One Opportunity. Many Tasks.
          </div>
          <WorkflowSequence />
        </div>

        <TransformationVisual scrollYProgress={scrollYProgress} />

        <ProblemClosing />
      </div>
    </section>
  );
}

function ProblemIntro() {
  return (
    <div className="flex flex-col items-center text-center mb-16 lg:mb-20">
      <Badge variant="outline" className="mb-4 text-[0.65rem] font-medium tracking-wide uppercase">
        Problem
      </Badge>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-full bg-muted/60 px-3 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-6"
      >
        THE WORK AROUND THE WORK
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-[850px] text-[clamp(2.5rem,4vw,4rem)] font-bold leading-[1.04] tracking-tight text-foreground"
      >
        The work is rarely just finding a job.
        <br />
        It is everything that happens around the job.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 max-w-[600px] text-base sm:text-lg leading-relaxed text-muted-foreground"
      >
        Every opportunity creates another chain of searching, researching,
        preparing, applying and tracking.
      </motion.p>
    </div>
  );
}

function WorkflowSequence() {
  return (
    <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-2 sm:gap-3 lg:gap-4 overflow-hidden">
      {workflowTasks.map((task, idx) => (
        <motion.div
          key={task}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
          className="flex items-center"
        >
          <div className="flex items-center justify-center rounded-[8px] border bg-background px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm text-[11px] sm:text-xs font-semibold text-foreground">
            {task}
          </div>
          {idx < workflowTasks.length - 1 && (
            <ArrowRight className="hidden sm:block ml-3 sm:ml-4 size-3.5 text-muted-foreground/30" />
          )}
        </motion.div>
      ))}
    </div>
  );
}

function TransformationVisual({ scrollYProgress }: { scrollYProgress: any }) {
  // Phase 1 (0-0.35): fragmented
  // Phase 2 (0.35-0.6): convergence (move right)
  // Phase 3 (0.6-0.75): cards fade out, system fades in
  // Phase 4 (0.75-1): system dominant
  
  const chaosX = useTransform(scrollYProgress, [0, 0.35, 0.65], [0, 0, 150]);
  const chaosOpacity = useTransform(
    scrollYProgress,
    [0, 0.35, 0.65, 0.75],
    [1, 1, 0.3, 0]
  );

  const systemScale = useTransform(
    scrollYProgress,
    [0, 0.5, 0.75, 1],
    [0.94, 0.94, 1, 1]
  );
  const systemOpacity = useTransform(
    scrollYProgress,
    [0, 0.5, 0.75, 1],
    [0.2, 0.2, 1, 1]
  );

  return (
    <div className="relative flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[750px] w-full">
      <FragmentedWorkspace
        scrollYProgress={scrollYProgress}
        x={chaosX}
        opacity={chaosOpacity}
      />

      <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-24 z-20">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
          FROM CHAOS
        </div>
        <div className="flex size-12 items-center justify-center rounded-full bg-background border shadow-sm">
          <ArrowRight className="size-5 text-foreground" />
        </div>
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">
          TO A SYSTEM
        </div>
      </div>

      <SystemWorkspace scale={systemScale} opacity={systemOpacity} />
    </div>
  );
}

function FragmentedWorkspace({ scrollYProgress, x, opacity }: any) {
  // Parallax during scrolling for the chaotic cards
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -20]);

  return (
    <div className="flex-1 rounded-[24px] bg-[#fff5f5] dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-8 lg:p-10 relative overflow-hidden flex flex-col">
      <div className="relative z-10 mb-8">
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 mb-4 text-[10px] uppercase font-bold tracking-wider rounded-md border-0"
        >
          Without a system
        </Badge>
        <h3 className="text-2xl lg:text-[28px] font-bold leading-[1.15] text-foreground mb-3 max-w-[320px]">
          One opportunity.
          <br />
          Multiple disconnected tasks.
        </h3>
      </div>

      <motion.div
        style={{ x, opacity }}
        className="relative flex-1 w-full mt-4 flex flex-col lg:block items-center gap-4 lg:gap-0 lg:min-h-[550px]"
      >
        {/* Job Opportunity */}
        <motion.div
          style={{ y: y1 }}
          className="relative lg:absolute lg:top-0 lg:left-0 w-full max-w-[360px] lg:w-[250px] rounded-[16px] border border-border/50 bg-background p-5 shadow-sm lg:rotate-[-1deg]"
        >
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Briefcase className="size-3" /> JOB OPPORTUNITY
          </div>
          <div className="font-bold text-base text-foreground">
            Senior React Engineer
          </div>
          <div className="text-xs text-muted-foreground mb-4 mt-0.5">
            Vercel · Remote
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="px-2 py-1 rounded-md bg-muted/50 text-[10px] font-medium text-foreground">
              React
            </span>
            <span className="px-2 py-1 rounded-md bg-muted/50 text-[10px] font-medium text-foreground">
              Firebase
            </span>
            <span className="px-2 py-1 rounded-md bg-muted/50 text-[10px] font-medium text-foreground">
              Node.js
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="size-3.5" /> Requirements matched
          </div>
        </motion.div>

        {/* Company Research */}
        <motion.div
          style={{ y: y2 }}
          className="relative lg:absolute lg:top-8 lg:right-0 xl:right-4 w-full max-w-[360px] lg:w-[220px] rounded-[16px] border border-border/50 bg-background p-5 shadow-sm lg:rotate-[1deg]"
        >
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="size-3" /> COMPANY RESEARCH
          </div>
          <div className="font-bold text-base text-foreground mb-3">Vercel</div>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-2.5">
              <div className="size-1.5 rounded-full bg-emerald-500" /> Product
            </div>
            <div className="flex items-center gap-2.5">
              <div className="size-1.5 rounded-full bg-emerald-500" /> Team
            </div>
            <div className="flex items-center gap-2.5">
              <div className="size-1.5 rounded-full bg-emerald-500" /> Technology
            </div>
            <div className="flex items-center gap-2.5">
              <div className="size-1.5 rounded-full bg-emerald-500" /> Recent
              activity
            </div>
          </div>
        </motion.div>

        {/* Outreach */}
        <motion.div
          style={{ y: y3 }}
          className="relative lg:absolute lg:top-[220px] lg:left-6 xl:left-12 w-full max-w-[360px] lg:w-[260px] rounded-[16px] border border-border/50 bg-background p-5 shadow-sm lg:rotate-[-1.5deg]"
        >
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Mail className="size-3" /> OUTREACH
          </div>
          <div className="font-bold text-[13px] text-foreground mb-2">
            Personalized email
          </div>
          <div className="text-[11px] text-muted-foreground italic leading-relaxed border-l-[3px] border-muted pl-3 mt-3">
            "Dear Hiring Team,<br />
            <br />
            Your engineering workflow..."
          </div>
        </motion.div>

        {/* Application */}
        <motion.div
          style={{ y: y1 }}
          className="relative lg:absolute lg:top-[260px] lg:right-2 xl:right-10 w-full max-w-[360px] lg:w-[220px] rounded-[16px] border border-border/50 bg-background p-5 shadow-sm lg:rotate-[1deg]"
        >
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Send className="size-3" /> APPLICATION
          </div>
          <div className="flex flex-col gap-2.5 text-xs font-medium text-foreground mb-4">
            <div className="flex items-center justify-between">
              Resume <CheckCircle2 className="size-3.5 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between">
              Email <CheckCircle2 className="size-3.5 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between">
              Submitted <CheckCircle2 className="size-3.5 text-emerald-500" />
            </div>
          </div>
          <div className="pt-3 border-t border-border/50 flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Status
            </span>
            <span className="bg-blue-50 text-blue-600 rounded-md px-2 py-0.5 text-[10px] font-medium">
              In review
            </span>
          </div>
        </motion.div>

        {/* Tracking */}
        <motion.div
          style={{ y: y2 }}
          className="relative lg:absolute lg:top-[400px] lg:left-[15%] w-full max-w-[360px] lg:w-[250px] rounded-[16px] border border-border/50 bg-background p-5 shadow-sm lg:rotate-[-0.5deg]"
        >
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <ListTodo className="size-3" /> TRACKING
          </div>
          <div className="flex flex-col gap-2 text-xs font-medium text-foreground">
            <div className="flex justify-between items-center bg-muted/40 px-3 py-2 rounded-md">
              <span>Application</span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Done</span>
            </div>
            <div className="flex justify-between items-center bg-muted/40 px-3 py-2 rounded-md">
              <span>Follow-up</span>
              <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Pending</span>
            </div>
            <div className="flex justify-between items-center bg-muted/40 px-3 py-2 rounded-md">
              <span>Next action</span>
              <span className="text-[10px] text-muted-foreground font-semibold">Oct 12</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function SystemWorkspace({ scale, opacity }: any) {
  const systemSteps = [
    "Discover",
    "Qualify",
    "Research",
    "Prepare",
    "Review",
    "Execute",
    "Track",
  ];

  return (
    <div className="flex-1 rounded-[24px] bg-[#f0fdf4] dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-8 lg:p-10 relative overflow-hidden flex flex-col">
      <div className="relative z-10 mb-8">
        <Badge
          variant="secondary"
          className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 mb-4 text-[10px] uppercase font-bold tracking-wider rounded-md border-0"
        >
          With Victor Job OS
        </Badge>
        <h3 className="text-2xl lg:text-[28px] font-bold leading-[1.15] text-foreground mb-3 max-w-[320px]">
          One opportunity.
          <br />
          One workflow. One place.
        </h3>
      </div>

      <motion.div
        style={{ scale, opacity }}
        className="relative flex-1 w-full mt-4 flex items-center justify-center min-h-[450px]"
      >
        <div className="w-full max-w-[420px] rounded-[20px] border border-border/60 bg-background/95 backdrop-blur-sm shadow-xl p-6 lg:p-8">
          <div className="flex items-center justify-between border-b border-border/50 pb-5 mb-5">
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                VICTOR JOB OS
              </div>
              <div className="text-[17px] font-bold text-foreground">
                Senior React Engineer
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Vercel · Remote
              </div>
            </div>
            <div className="size-10 rounded-[10px] bg-zinc-950 dark:bg-zinc-100 text-white dark:text-black flex items-center justify-center font-bold text-sm shadow-sm">
              V
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="size-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-foreground">
                  QUALIFICATION
                </div>
                <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  Requirements matched
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-foreground">
                  RESEARCH
                </div>
                <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  Company researched
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-foreground">
                  OUTREACH
                </div>
                <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  Outreach prepared
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-border/50">
            <div className="flex items-center justify-between">
              {systemSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div
                    className={`size-5 rounded-full flex items-center justify-center ${
                      idx < 4
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx < 4 ? (
                      <CheckCircle2 className="size-3" />
                    ) : idx === 4 ? (
                      <ArrowRight className="size-3" />
                    ) : (
                      <div className="size-1.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>
                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProblemClosing() {
  return (
    <div className="mt-24 lg:mt-32 flex flex-col items-center text-center">
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-foreground mb-4 tracking-tight"
      >
        The problem isn't finding one more job board.
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-base sm:text-lg text-muted-foreground max-w-[600px] mb-8"
      >
        It's managing the work required to pursue each opportunity well.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-lg sm:text-xl font-semibold text-foreground tracking-tight"
      >
        Victor Job OS turns that work into a system.
      </motion.div>
    </div>
  );
}