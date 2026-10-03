import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Building2,
  Users,
  Send,
  BarChart3,
  Bell,
  Home,
  Briefcase,
  Mail,
  FileText,
  CheckSquare,
  Activity,
  Check,
  ChevronRight,
  TrendingUp,
  PenLine,
  LayoutGrid,
} from "lucide-react";

const workflowStages = [
  {
    icon: Search,
    title: "Discover",
    desc: "Find relevant opportunities across top companies.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Building2,
    title: "Research",
    desc: "Get key company insights in one place.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: PenLine,
    title: "Prepare",
    desc: "Create personalized outreach and applications.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: Users,
    title: "Review",
    desc: "Check and refine before sending.",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: Send,
    title: "Execute",
    desc: "Send applications and outreach with confidence.",
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
  {
    icon: BarChart3,
    title: "Track",
    desc: "Stay on top of your progress automatically.",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
];

export function ProductPreviewSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Subtle floating and parallax transforms
  const yDiscover = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const yResearch = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  const yOutreach = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const yTrack = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <section
      id="product"
      className="relative w-full overflow-hidden border-b bg-[#fafafa]"
    >
      <div
        className="mx-auto w-full max-w-[1360px] px-5 sm:px-6 py-24 lg:py-32"
        ref={containerRef}
      >
        {/* Intro */}
        <div className="flex flex-col items-center text-center mb-16 lg:mb-28">
          <Badge
            variant="secondary"
            className="mb-6 rounded-full text-[11px] font-semibold tracking-wide uppercase px-3 py-1 bg-muted/60 text-muted-foreground border-transparent"
          >
            Product
          </Badge>
          <h2 className="text-[42px] sm:text-[56px] lg:text-[72px] font-bold tracking-[-0.04em] text-foreground leading-[1] mb-6">
            See the product.
          </h2>
          <p className="max-w-[650px] text-[17px] sm:text-[19px] text-muted-foreground leading-relaxed">
            A command center for the work that happens around every opportunity.
            Victor Job OS brings your entire job search into one place — from
            discovery and research to outreach, applications and follow-ups.
          </p>
        </div>

        {/* Product Ecosystem */}
        <div className="relative w-full min-h-[1400px] xl:min-h-[700px] flex flex-col xl:block items-center justify-center">
          {/* Annotations moved into their respective cards to ensure they stay attached */}

          {/* DASHBOARD (Centerpiece) */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative xl:absolute xl:top-1/2 xl:left-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 w-full max-w-[880px] rounded-[20px] border border-border bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] overflow-hidden z-20 flex flex-col mb-8 xl:mb-0"
          >
            {/* Top Bar */}
            <div className="flex items-center px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/victor-chidera-logo.webp"
                  alt="Logo"
                  className="w-5 h-5 rounded"
                />
                <span className="text-[13px] font-bold text-foreground tracking-tight">
                  Victor Job OS
                </span>
              </div>
              <div className="mx-auto flex-1 max-w-[400px] ml-10 hidden sm:block">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/30 border border-border/40">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[12px] text-muted-foreground/70">
                    Search opportunities, companies, or notes...
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-auto">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                  VC
                </div>
              </div>
            </div>

            <div className="flex flex-1 min-h-[480px]">
              {/* Sidebar */}
              <div className="w-[180px] border-r border-border/50 p-3 hidden md:flex flex-col gap-1">
                {[
                  { icon: LayoutGrid, label: "Dashboard", active: true },
                  { icon: Briefcase, label: "Opportunities" },
                  { icon: Mail, label: "Outreach" },
                  { icon: FileText, label: "Applications" },
                  { icon: Building2, label: "Companies" },
                  { icon: CheckSquare, label: "Projects" },
                  { icon: BarChart3, label: "Analytics" },
                  { icon: Activity, label: "Activity" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${item.active ? "bg-muted/60 text-foreground" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"}`}
                  >
                    <item.icon
                      className={`w-4 h-4 ${item.active ? "text-foreground" : "text-muted-foreground/70"}`}
                    />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 md:p-8 flex flex-col">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      Good morning, Victor 👋
                    </h3>
                    <p className="text-[13px] text-muted-foreground">
                      Here's what's happening with your job search.
                    </p>
                  </div>
                  <div className="text-[12px] text-muted-foreground font-medium hidden sm:block">
                    Sat, Oct 3
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
                  {[
                    {
                      label: "New opportunities",
                      val: "30",
                      trend: "+12%",
                      color: "text-emerald-500",
                    },
                    {
                      label: "Qualified",
                      val: "12",
                      trend: "+2%",
                      color: "text-emerald-500",
                    },
                    {
                      label: "Outreach drafts",
                      val: "8",
                      trend: "+50%",
                      color: "text-emerald-500",
                    },
                    {
                      label: "Applications",
                      val: "6",
                      trend: "+0%",
                      color: "text-muted-foreground",
                    },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-border/50 bg-white flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[28px] font-bold text-foreground leading-none">
                          {m.val}
                        </span>
                        <div
                          className={`flex items-center gap-0.5 text-[10px] font-bold ${m.color}`}
                        >
                          <TrendingUp className="w-3 h-3" /> {m.trend}
                        </div>
                      </div>
                      <span className="text-[12px] text-muted-foreground font-medium">
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Row */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Opportunities */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[14px] font-bold text-foreground">
                        Today's opportunities
                      </h4>
                      <span className="text-[12px] font-medium text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-foreground">
                        View all <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {[
                        {
                          title: "Senior React Engineer",
                          company: "Vercel",
                          loc: "Remote",
                          match: "94%",
                          time: "2h ago",
                          bg: "bg-black text-white",
                        },
                        {
                          title: "Full Stack Developer",
                          company: "Linear",
                          loc: "Remote",
                          match: "87%",
                          time: "4h ago",
                          bg: "bg-[#5e6ad2] text-white",
                        },
                        {
                          title: "Frontend Engineer",
                          company: "Notion",
                          loc: "New York, USA",
                          match: "82%",
                          time: "6h ago",
                          bg: "bg-white text-black border border-border",
                        },
                      ].map((job, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-[14px] shrink-0 ${job.bg}`}
                          >
                            {job.company[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-bold text-foreground truncate">
                              {job.title}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {job.company} · {job.loc}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mb-1">
                              {job.match} Match
                            </div>
                            <div className="text-[10px] text-muted-foreground block">
                              {job.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                        Next steps{" "}
                        <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px]">
                          4
                        </span>
                      </h4>
                      <span className="text-[12px] font-medium text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-foreground">
                        View all <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {[
                        {
                          title: "Review Vercel application",
                          sub: "Senior React Engineer",
                          status: "Today",
                          checked: true,
                        },
                        {
                          title: "Send follow-up email",
                          sub: "Linear · Full Stack Developer",
                          status: "Today",
                          checked: false,
                        },
                        {
                          title: "Research company",
                          sub: "Anthropic · Frontend Engineer",
                          status: "Tomorrow",
                          checked: false,
                        },
                        {
                          title: "Prepare outreach",
                          sub: "Stripe · Software Engineer",
                          status: "Tomorrow",
                          checked: false,
                        },
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${step.checked ? "bg-blue-600 border-blue-600" : "border-border"}`}
                          >
                            {step.checked && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-[13px] font-semibold ${step.checked ? "text-foreground" : "text-foreground"}`}
                            >
                              {step.title}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {step.sub}
                            </div>
                          </div>
                          <div
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${step.status === "Today" ? "bg-blue-50 text-blue-600" : "bg-muted text-muted-foreground"}`}
                          >
                            {step.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* SURROUNDING CARDS */}
          {/* Discover */}
          <motion.div
            style={{ y: yDiscover }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="relative xl:absolute xl:top-[6%] xl:-left-4 2xl:-left-12 w-full max-w-[320px] xl:w-[250px] bg-white rounded-[18px] p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-border/60 z-10 xl:-rotate-1 mb-4 xl:mb-0"
          >
            {/* Annotation */}
            <div className="hidden xl:block absolute -top-12 -left-6 w-[150px] italic text-[14px] text-muted-foreground/80 leading-snug -rotate-6">
              Discover relevant opportunities
            </div>
            <svg className="hidden xl:block absolute -top-4 left-10 w-8 h-8 stroke-muted-foreground/40 fill-none overflow-visible">
              <path
                d="M0,0 Q10,20 30,30"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path d="M20,30 L30,30 L28,24" strokeWidth="1.5" />
            </svg>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Search className="w-3 h-3" />
              </div>
              <h4 className="text-[13px] font-bold text-foreground">
                Discover opportunities
              </h4>
            </div>
            <div className="flex flex-col gap-3">
              {[
                {
                  name: "Vercel",
                  stat: "24 new",
                  bg: "bg-black text-white",
                  color: "text-blue-500",
                },
                {
                  name: "Linear",
                  stat: "12 new",
                  bg: "bg-[#5e6ad2] text-white",
                  color: "text-emerald-500",
                },
                {
                  name: "Notion",
                  stat: "8 new",
                  bg: "bg-white text-black border",
                  color: "text-purple-500",
                },
                {
                  name: "Stripe",
                  stat: "6 new",
                  bg: "bg-[#635BFF] text-white",
                  color: "text-orange-500",
                },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${c.bg}`}
                    >
                      {c.name[0]}
                    </div>
                    <span className="text-[13px] font-medium text-muted-foreground">
                      {c.name}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold ${c.color}`}>
                    {c.stat}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Research */}
          <motion.div
            style={{ y: yResearch }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18, duration: 0.7 }}
            className="relative xl:absolute xl:bottom-[8%] xl:-left-0 2xl:-left-8 w-full max-w-[320px] xl:w-[220px] bg-white rounded-[18px] p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-border/60 z-30 xl:rotate-1 mb-4 xl:mb-0"
          >
            {/* Annotation */}
            <div className="hidden xl:block absolute -bottom-14 -left-4 w-[150px] italic text-[14px] text-muted-foreground/80 leading-snug rotate-3">
              Research faster with everything in one place
            </div>
            <svg className="hidden xl:block absolute -bottom-2 left-10 w-8 h-8 stroke-muted-foreground/40 fill-none overflow-visible">
              <path
                d="M0,30 Q10,10 30,0"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path d="M20,0 L30,0 L28,6" strokeWidth="1.5" />
            </svg>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-3 h-3" />
              </div>
              <h4 className="text-[13px] font-bold text-foreground">
                Research companies
              </h4>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: FileText, label: "Company overview" },
                { icon: Users, label: "Team and culture" },
                { icon: Activity, label: "Recent news" },
                { icon: LayoutGrid, label: "Tech stack" },
                { icon: Home, label: "Key people" },
              ].map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 text-muted-foreground"
                >
                  <r.icon className="w-3.5 h-3.5 opacity-60" />
                  <span className="text-[12px] font-medium">{r.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Outreach */}
          <motion.div
            style={{ y: yOutreach }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.26, duration: 0.7 }}
            className="relative xl:absolute xl:top-[8%] xl:-right-4 2xl:-right-12 w-full max-w-[320px] xl:w-[250px] bg-white rounded-[18px] p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-border/60 z-30 xl:rotate-2 mb-4 xl:mb-0"
          >
            {/* Annotation */}
            <div className="hidden xl:block absolute -top-12 -right-4 w-[160px] italic text-[14px] text-muted-foreground/80 leading-snug rotate-3 text-right">
              Prepare personalized outreach with AI
            </div>
            <svg className="hidden xl:block absolute -top-4 right-10 w-8 h-8 stroke-muted-foreground/40 fill-none overflow-visible">
              <path
                d="M30,0 Q20,20 0,30"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path d="M10,30 L0,30 L2,24" strokeWidth="1.5" />
            </svg>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <Mail className="w-3 h-3" />
              </div>
              <h4 className="text-[13px] font-bold text-foreground">
                Write outreach
              </h4>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-[12px] font-medium text-foreground mb-3 leading-relaxed">
                Hi Hiring Team,
                <br />
                <br />
                I'm a software engineer with experience in...
              </p>
              <div className="space-y-1.5 opacity-40">
                <div className="h-1.5 bg-muted-foreground rounded-full w-[90%]"></div>
                <div className="h-1.5 bg-muted-foreground rounded-full w-[70%]"></div>
                <div className="h-1.5 bg-muted-foreground rounded-full w-[80%]"></div>
              </div>
            </div>
          </motion.div>

          {/* Track */}
          <motion.div
            style={{ y: yTrack }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.34, duration: 0.7 }}
            className="relative xl:absolute xl:bottom-[10%] xl:-right-0 2xl:-right-8 w-full max-w-[320px] xl:w-[230px] bg-white rounded-[18px] p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-border/60 z-10 xl:-rotate-1"
          >
            {/* Annotation */}
            <div className="hidden xl:block absolute -bottom-14 -right-4 w-[150px] italic text-[14px] text-muted-foreground/80 leading-snug -rotate-2 text-right">
              Stay organized and never lose track
            </div>
            <svg className="hidden xl:block absolute -bottom-2 right-10 w-8 h-8 stroke-muted-foreground/40 fill-none overflow-visible">
              <path
                d="M30,30 Q20,10 0,0"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path d="M10,0 L0,0 L2,6" strokeWidth="1.5" />
            </svg>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                <BarChart3 className="w-3 h-3" />
              </div>
              <h4 className="text-[13px] font-bold text-foreground">
                Track progress
              </h4>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Application submitted", checked: true },
                { label: "Follow-up in 5 days", checked: false },
                { label: "Interview scheduled", checked: false },
                { label: "Offer", checked: false },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${t.checked ? "bg-emerald-500 border-emerald-500" : "border-border"}`}
                  >
                    {t.checked && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span
                    className={`text-[12px] font-medium ${t.checked ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Workflow Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-16 lg:mt-32 border border-border/60 rounded-[20px] bg-white p-6 shadow-sm hidden md:grid grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-4 divide-y md:divide-y-0 md:divide-x divide-border/50"
        >
          {workflowStages.map((stage, i) => (
            <div
              key={i}
              className="flex flex-col pt-4 md:pt-0 md:px-4 lg:px-3 xl:px-4 first:pt-0 first:pl-0 last:pr-0"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${stage.bg} ${stage.color} mb-4`}
              >
                <stage.icon className="w-5 h-5" />
              </div>
              <h4 className="text-[15px] lg:text-[14px] xl:text-[16px] font-bold text-foreground mb-2">
                {stage.title}
              </h4>
              <p className="text-[13px] lg:text-[12px] xl:text-[13px] text-muted-foreground leading-relaxed">
                {stage.desc}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Mobile Workflow List */}
        <div className="mt-8 flex flex-col gap-4 md:hidden">
          {workflowStages.map((stage, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 border border-border/60 rounded-[16px] bg-white shadow-sm"
            >
              <div
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${stage.bg} ${stage.color}`}
              >
                <stage.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-foreground mb-1">
                  {stage.title}
                </h4>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
