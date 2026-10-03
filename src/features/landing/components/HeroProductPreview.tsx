import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Building2,
  FileText,
  BarChart3,
  UserCheck,
  LayoutDashboard,
  Briefcase,
  Mail,
  CheckSquare,
  Building,
  FolderDot,
  Activity,
  Send,
} from "lucide-react";

function DashboardMock() {
  return (
    <div className="flex h-[400px] w-full max-w-[600px] overflow-hidden rounded-xl border border-border/50 bg-background shadow-2xl">
      {/* Sidebar */}
      <div className="w-[160px] bg-zinc-950 p-4 text-zinc-400 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-zinc-100 mb-4">
          <div className="size-6 rounded bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-xs">
            V
          </div>
          <span className="text-xs font-semibold">Victor Job OS</span>
        </div>
        <nav className="flex flex-col gap-2 text-[0.65rem]">
          <div className="flex items-center gap-2 text-zinc-100 bg-zinc-900 px-2 py-1.5 rounded-md">
            <LayoutDashboard className="size-3" /> Dashboard
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 hover:text-zinc-100">
            <Briefcase className="size-3" /> Opportunities
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 hover:text-zinc-100">
            <Mail className="size-3" /> Outreach
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 hover:text-zinc-100">
            <CheckSquare className="size-3" /> Applications
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 hover:text-zinc-100">
            <Building className="size-3" /> Companies
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 hover:text-zinc-100">
            <FolderDot className="size-3" /> Projects
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 hover:text-zinc-100">
            <BarChart3 className="size-3" /> Analytics
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 hover:text-zinc-100">
            <Activity className="size-3" /> Activity
          </div>
        </nav>
      </div>
      {/* Main Content */}
      <div className="flex-1 p-6 bg-zinc-50 dark:bg-zinc-900">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex h-8 w-full max-w-[200px] items-center gap-2 rounded-md border bg-background px-3 text-xs text-muted-foreground shadow-sm">
            <Search className="size-3" /> Search opportunities...
          </div>
          <div className="size-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-900 dark:text-zinc-100">
            VC
          </div>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Good morning, Victor 👋
          </h2>
          <p className="text-xs text-muted-foreground">
            Here's what's happening with your job search.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "New Opportunities", value: "30", color: "text-blue-500" },
            { label: "Qualified", value: "12", color: "text-emerald-500" },
            { label: "Outreach Ready", value: "8", color: "text-purple-500" },
            { label: "Applications", value: "6", color: "text-orange-500" },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-lg border bg-background p-3 shadow-sm"
            >
              <div className={`text-xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-[0.6rem] font-medium text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-foreground">
            Recent Opportunities{" "}
            <span className="text-[0.65rem] text-muted-foreground font-normal">
              View all →
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              {
                title: "Senior React Engineer",
                company: "Vercel",
                match: "94%",
                time: "2h ago",
                bg: "bg-black text-white",
              },
              {
                title: "Full Stack Developer",
                company: "Linear",
                match: "87%",
                time: "4h ago",
                bg: "bg-indigo-600 text-white",
              },
              {
                title: "Frontend Engineer",
                company: "Notion",
                match: "82%",
                time: "6h ago",
                bg: "bg-zinc-200 text-black",
              },
            ].map((job, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border bg-background p-2.5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`size-8 rounded-md flex items-center justify-center text-xs font-bold ${job.bg}`}
                  >
                    {job.company[0]}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {job.title}
                    </div>
                    <div className="text-[0.6rem] text-muted-foreground">
                      {job.company} · Remote
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[0.6rem] border-0"
                  >
                    {job.match} Match
                  </Badge>
                  <span className="text-[0.65rem] text-muted-foreground">
                    {job.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  colorClass,
  className,
  delay,
  initialPos,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: initialPos.x, y: initialPos.y, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, type: "spring", bounce: 0.4 }}
      className={`absolute z-20 hidden lg:block ${className}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay,
        }}
      >
        <Card className="w-[240px] shadow-xl border-border/50 bg-background/95 backdrop-blur-md relative overflow-visible">
          <div
            className={`absolute -top-2.5 right-4 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${colorClass}`}
          >
            {badge}
          </div>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 rounded-xl p-2 ${colorClass.replace("bg-", "bg-").replace("text-", "text-").replace("/10", "/20")}`}
              >
                <Icon className="size-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {title}
                </h4>
                <p className="mt-1 text-[0.65rem] leading-relaxed text-muted-foreground">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function HeroProductPreview() {
  return (
    <div className="relative flex h-[600px] w-full items-center justify-center scale-90 xl:scale-100 origin-center lg:origin-right">
      {/* Ambient Glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="h-[400px] w-[600px] rounded-[100%] bg-blue-500/20 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute h-[300px] w-[500px] rounded-[100%] bg-purple-500/20 blur-[100px]"
        />
      </div>

      {/* Central Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="relative z-10 w-full flex justify-center"
      >
        <DashboardMock />
      </motion.div>

      {/* Floating Cards */}
      <FloatingCard
        badge="1. Discover"
        title="Find Opportunities"
        subtitle="Automatically discover relevant developer roles."
        icon={Search}
        colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
        className="-top-8 -left-4"
        initialPos={{ x: -40, y: -40 }}
        delay={0.2}
      />

      <FloatingCard
        badge="2. Research"
        title="Research Company"
        subtitle="Get key insights about the company and role."
        icon={Building2}
        colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
        className="-top-4 -right-12"
        initialPos={{ x: 40, y: -40 }}
        delay={0.3}
      />

      <FloatingCard
        badge="3. Prepare"
        title="Prepare Outreach"
        subtitle="Generate personalized emails that get replies."
        icon={FileText}
        colorClass="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
        className="-right-8 top-[40%]"
        initialPos={{ x: 40, y: 0 }}
        delay={0.4}
      />

      <FloatingCard
        badge="4. Apply"
        title="Application Support"
        subtitle="Prepare cover letters, answers and documents."
        icon={Send}
        colorClass="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
        className="-bottom-8 -right-12"
        initialPos={{ x: 40, y: 40 }}
        delay={0.5}
      />

      <FloatingCard
        badge="5. Track"
        title="Track Progress"
        subtitle="Keep everything organized and track results."
        icon={BarChart3}
        colorClass="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
        className="-bottom-16 left-1/2 -translate-x-1/2"
        initialPos={{ x: 0, y: 40 }}
        delay={0.6}
      />

      <FloatingCard
        badge="6. Review"
        title="You Stay in Control"
        subtitle="Review and approve everything before it's sent."
        icon={UserCheck}
        colorClass="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
        className="bottom-4 -left-16"
        initialPos={{ x: -40, y: 40 }}
        delay={0.7}
      />
    </div>
  );
}
