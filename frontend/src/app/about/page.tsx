"use client";

/**
 * Hirevix — About Page
 * Single-file implementation (app/about/page.tsx) as required.
 * Stack: Next.js 15, TypeScript, TailwindCSS, Framer Motion, GSAP, Recharts, Lucide React.
 *
 * Everything — data, helpers, sub-sections — lives in this file.
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Sparkles,
  Brain,
  Rocket,
  Target,
  Users,
  Globe2,
  ShieldCheck,
  Zap,
  ArrowDown,
  ArrowRight,
  Code2,
  Palette,
  Wand2,
  BarChart3,
  MousePointer2,
  Database,
  Server,
  Cloud,
  Cpu,
  Quote,
  Mail,
  CheckCircle2,
  Layers,
  Bot,
  Radar,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

function Linkedin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6.94 8.5a1.56 1.56 0 1 0 0-3.12 1.56 1.56 0 0 0 0 3.12Z" />
      <path d="M5.5 9.75h2.88V18H5.5z" />
      <path d="M10.5 9.75h2.76v1.12h.04c.38-.72 1.32-1.48 2.72-1.48 2.91 0 3.45 1.91 3.45 4.4V18H16.6v-7.5h-2.76v.95h-.04c-.4-.76-1.32-1.56-2.72-1.56-2.9 0-3.58 1.91-3.58 4.4V18H10.5z" />
    </svg>
  );
}

function Twitter(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9.09 9.09 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.5 0-4.52 2.04-4.52 4.56 0 .36.04.71.12 1.05A12.85 12.85 0 0 1 1.64 1.15a4.53 4.53 0 0 0-.61 2.29c0 1.58.8 2.98 2.02 3.8A4.49 4.49 0 0 1 .96 6.6v.06c0 2.2 1.56 4.04 3.63 4.46-.38.1-.78.15-1.19.15-.29 0-.57-.03-.84-.08.58 1.86 2.27 3.22 4.27 3.26A9.06 9.06 0 0 1 0 19.54 12.8 12.8 0 0 0 6.94 22c8.33 0 12.89-6.9 12.89-12.88 0-.2 0-.4-.02-.6A9.22 9.22 0 0 0 23 3z" />
    </svg>
  );
}

function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 1C5.925 1 1 5.925 1 12c0 4.865 3.163 8.986 7.548 10.438.552.102.752-.24.752-.534 0-.264-.01-1.147-.016-2.08-3.07.666-3.718-1.48-3.718-1.48-.502-1.276-1.226-1.617-1.226-1.617-.998-.682.076-.668.076-.668 1.104.078 1.684 1.144 1.684 1.144.98 1.679 2.574 1.194 3.2.913.1-.71.384-1.194.698-1.47-2.449-.279-5.023-1.225-5.023-5.452 0-1.204.43-2.186 1.135-2.957-.114-.28-.492-1.404.107-2.926 0 0 .926-.297 3.035 1.13A10.56 10.56 0 0 1 12 6.844c.94.004 1.888.127 2.774.373 2.107-1.427 3.032-1.13 3.032-1.13.602 1.522.224 2.646.11 2.926.708.771 1.135 1.753 1.135 2.957 0 4.237-2.579 5.169-5.036 5.443.395.34.747 1.01.747 2.037 0 1.468-.014 2.651-.014 3.01 0 .296.197.64.758.531C19.84 20.984 23 16.863 23 12c0-6.075-4.925-11-11-11z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Fonts                                                              */
/* ------------------------------------------------------------------ */

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

/* ------------------------------------------------------------------ */
/*  Deterministic pseudo-random (avoids hydration mismatches)          */
/* ------------------------------------------------------------------ */

const seeded = (seed: number) => {
  const x = Math.sin(seed * 999.7) * 10000;
  return x - Math.floor(x);
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const PARTICLES = Array.from({ length: 36 }).map((_, i) => ({
  id: i,
  size: 2 + seeded(i * 3.1) * 5,
  left: seeded(i * 7.7) * 100,
  top: seeded(i * 11.3) * 100,
  duration: 10 + seeded(i * 5.2) * 16,
  delay: seeded(i * 2.9) * 8,
  opacity: 0.15 + seeded(i * 4.1) * 0.35,
}));

const STATS: { label: string; value: number; suffix: string; icon: LucideIcon }[] = [
  { label: "Active job seekers", value: 250000, suffix: "+", icon: Users },
  { label: "Partner companies", value: 4200, suffix: "+", icon: Globe2 },
  { label: "AI match accuracy", value: 96, suffix: "%", icon: Target },
  { label: "Median time-to-hire", value: 9, suffix: " days", icon: Zap },
];

const TIMELINE = [
  { year: "2021", title: "Hirevix is founded", desc: "Three engineers and a hunch: hiring is a search problem, not a form problem." },
  { year: "2022", title: "Matching engine v1 ships", desc: "Our first neural ranking model goes live, cutting screening time by 70%." },
  { year: "2023", title: "50,000 hires milestone", desc: "Enterprise customers join, and the model starts learning across industries." },
  { year: "2024", title: "Series B & global expansion", desc: "Hirevix opens offices in three new regions and doubles its dataset." },
  { year: "2025", title: "Hirevix Copilot launches", desc: "Conversational, AI-guided applications replace static resumes for good." },
  { year: "2026", title: "1M+ candidates matched", desc: "A new benchmark for time-to-offer, set and held across every vertical." },
];

const GROWTH_DATA = [
  { month: "Jan", hires: 1200 },
  { month: "Feb", hires: 1450 },
  { month: "Mar", hires: 1620 },
  { month: "Apr", hires: 1980 },
  { month: "May", hires: 2340 },
  { month: "Jun", hires: 2790 },
  { month: "Jul", hires: 3210 },
  { month: "Aug", hires: 3640 },
  { month: "Sep", hires: 4120 },
  { month: "Oct", hires: 4780 },
  { month: "Nov", hires: 5390 },
  { month: "Dec", hires: 6150 },
];

const MATCH_DATA = [
  { t: "0", v: 20 },
  { t: "1", v: 34 },
  { t: "2", v: 30 },
  { t: "3", v: 48 },
  { t: "4", v: 45 },
  { t: "5", v: 62 },
  { t: "6", v: 74 },
  { t: "7", v: 88 },
];

const WORKFLOW_STEPS: { title: string; desc: string; icon: LucideIcon }[] = [
  { title: "Profile intelligence", desc: "Parses resumes, portfolios and signals into a living candidate graph.", icon: Brain },
  { title: "Signal extraction", desc: "Surfaces skills and trajectory that keyword filters miss entirely.", icon: Layers },
  { title: "Neural matching", desc: "Ranks candidates against role context, not just a checklist of tags.", icon: Cpu },
  { title: "Human review", desc: "Recruiters confirm and refine every shortlist before it ships.", icon: Users },
  { title: "Offer & hire", desc: "Structured feedback loops make each match sharper than the last.", icon: CheckCircle2 },
];

const BENTO_FEATURES: { title: string; desc: string; icon: LucideIcon; className: string }[] = [
  {
    title: "Context-aware matching",
    desc: "Hirevix reads a role's real requirements and a candidate's real trajectory — not just overlapping keywords.",
    icon: Brain,
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Bias-audited models",
    desc: "Every ranking model is tested against fairness benchmarks before it ever touches a shortlist.",
    icon: ShieldCheck,
    className: "md:col-span-1",
  },
  {
    title: "Real-time signal",
    desc: "Market and skill-demand data refresh hourly, so matches stay current.",
    icon: Activity,
    className: "md:col-span-1",
  },
  {
    title: "Conversational applying",
    desc: "Candidates talk to Hirevix Copilot instead of wrestling with static forms.",
    icon: Bot,
    className: "md:col-span-1",
  },
  {
    title: "Global talent graph",
    desc: "Millions of verified profiles, connected across industries and geographies.",
    icon: Globe2,
    className: "md:col-span-2",
  },
];

const TEAM = [
  { name: "Ariana Kade", role: "Co-Founder & CEO", initials: "AK" },
  { name: "Rohan Malhotra", role: "Co-Founder & CTO", initials: "RM" },
  { name: "Sofia Duarte", role: "Head of AI Research", initials: "SD" },
  { name: "Ethan Cole", role: "VP, Product", initials: "EC" },
  { name: "Naomi Osei", role: "Head of Design", initials: "NO" },
  { name: "Marcus Lin", role: "VP, Engineering", initials: "ML" },
];

const TESTIMONIALS = [
  { quote: "Hirevix cut our screening time from three weeks to four days.", name: "Priya Nair", role: "Head of Talent, Nimbus" },
  { quote: "The matches feel like they were made by someone who read every resume.", name: "Daniel Osei", role: "CTO, Fractal Labs" },
  { quote: "We finally stopped losing great candidates to slow pipelines.", name: "Laura Bianchi", role: "VP People, Vantage" },
  { quote: "It's the first hiring tool our engineers actually trust.", name: "Kenji Watanabe", role: "Eng. Director, Orbitly" },
  { quote: "Onboarding took a day. The results took a week to believe.", name: "Maya Fischer", role: "COO, Northstar" },
  { quote: "Our offer-acceptance rate jumped the same quarter we switched.", name: "Tomás Herrera", role: "Head of Talent, Pace" },
];

const TECH_STACK: { name: string; icon: LucideIcon }[] = [
  { name: "Next.js 15", icon: Code2 },
  { name: "TypeScript", icon: Layers },
  { name: "TailwindCSS", icon: Palette },
  { name: "Framer Motion", icon: Wand2 },
  { name: "GSAP", icon: MousePointer2 },
  { name: "Recharts", icon: BarChart3 },
  { name: "Lucide Icons", icon: Sparkles },
  { name: "OpenAI API", icon: Bot },
  { name: "Vercel Edge", icon: Cloud },
  { name: "PostgreSQL", icon: Database },
  { name: "Redis Cache", icon: Server },
  { name: "Neural Ranker", icon: Radar },
];

/* ------------------------------------------------------------------ */
/*  Small shared helpers                                               */
/* ------------------------------------------------------------------ */

/** Hover tilt effect applied directly to the DOM node (no extra state). */
const handleTiltMove = (e: React.MouseEvent<HTMLDivElement>) => {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;
  const py = (e.clientY - rect.top) / rect.height;
  const rotateX = (0.5 - py) * 10;
  const rotateY = (px - 0.5) * 10;
  el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
};

const handleTiltLeave = (e: React.MouseEvent<HTMLDivElement>) => {
  e.currentTarget.style.transform =
    "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)";
};

/** Simple count-up used by the statistics section. */
function useCountUp(target: number, active: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

const formatStat = (value: number, suffix: string) => {
  const formatted = value >= 1000 ? value.toLocaleString("en-US") : value.toString();
  return `${formatted}${suffix}`;
};

/* ------------------------------------------------------------------ */
/*  Reveal wrapper (Framer Motion, used across sections)               */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  y = 28,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-violet-200/80 font-[family-name:var(--font-mono)]">
      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_2px_rgba(167,139,250,0.7)]" />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Aurora + grid + particle backdrop (shared visual language)         */
/* ------------------------------------------------------------------ */

function AuroraBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="aurora-blob aurora-a" />
      <div className="aurora-blob aurora-b" />
      <div className="aurora-blob aurora-c" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 90%)",
        }}
      />
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 60, damping: 20 });
  const springY = useSpring(my, { stiffness: 60, damping: 20 });
  const blobX = useTransform(springX, [-1, 1], [-30, 30]);
  const blobY = useTransform(springY, [-1, 1], [-30, 30]);
  const textX = useTransform(springX, [-1, 1], [-10, 10]);
  const textY = useTransform(springY, [-1, 1], [-6, 6]);

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    my.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const words = "The AI hiring engine built to see people, not keywords.".split(" ");

  return (
    <section
      onMouseMove={onMouseMove}
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-[#05060a] px-6"
    >
      <AuroraBackdrop />
      <motion.div
        style={{ x: blobX, y: blobY }}
        className="pointer-events-none absolute inset-0"
      />

      <motion.div
        style={{ x: textX, y: textY }}
        className="relative z-10 flex max-w-4xl flex-col items-center text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Eyebrow>About Hirevix</Eyebrow>
        </motion.div>

        <h1 className="mt-8 font-[family-name:var(--font-display)] text-[13vw] leading-[0.98] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.4rem]">
          <span className="flex flex-wrap justify-center gap-x-[0.28em]">
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={
                  w === "see" || w === "people," || w === "keywords."
                    ? "bg-gradient-to-b from-white to-violet-300 bg-clip-text text-transparent"
                    : ""
                }
              >
                {w}
              </motion.span>
            ))}
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-7 max-w-xl text-balance text-base text-white/60 sm:text-lg font-[family-name:var(--font-body)]"
        >
          Hirevix pairs a neural matching engine with real recruiters, turning
          months of screening into days of signal — for every company and
          every candidate on the platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <button className="group relative overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-transform duration-300 hover:scale-[1.03]">
            <span className="relative z-10 flex items-center gap-2">
              Explore Hirevix <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
          <button className="rounded-full border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white/80 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white">
            Meet the team
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.3 }}
        className="absolute bottom-10 z-10 flex flex-col items-center gap-2 text-white/40"
      >
        <span className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.3em]">
          Scroll
        </span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-4 w-4" />
        </motion.span>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline                                                            */
/* ------------------------------------------------------------------ */

function Timeline() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !lineRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: "top",
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
            end: "bottom 80%",
            scrub: 0.6,
          },
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative mx-auto max-w-5xl px-6 py-28 md:py-36">
      <Reveal className="mb-16 flex flex-col items-center text-center">
        <Eyebrow>Our story</Eyebrow>
        <h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-white md:text-5xl">
          Five years, one obsession
        </h2>
        <p className="mt-4 max-w-lg text-white/55">
          Every milestone below moved us closer to a hiring loop that respects
          people's time — on both sides of the table.
        </p>
      </Reveal>

      <div ref={containerRef} className="relative pl-8 md:pl-0">
        <div className="absolute left-8 top-0 h-full w-px bg-white/10 md:left-1/2" />
        <div
          ref={lineRef}
          className="absolute left-8 top-0 h-full w-px bg-gradient-to-b from-violet-400 via-fuchsia-400 to-cyan-300 md:left-1/2"
        />

        <div className="flex flex-col gap-14">
          {TIMELINE.map((item, i) => {
            const alignRight = i % 2 === 0;
            return (
              <div
                key={item.year}
                className={`relative flex flex-col md:flex-row md:items-center ${
                  alignRight ? "md:justify-start" : "md:justify-end"
                }`}
              >
                <span className="absolute left-8 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-violet-300 shadow-[0_0_16px_4px_rgba(167,139,250,0.55)] md:left-1/2" />
                <Reveal
                  y={22}
                  className={`w-full md:w-[45%] ${alignRight ? "md:pr-14 md:text-right" : "md:pl-14"}`}
                >
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
                    <span className="font-[family-name:var(--font-mono)] text-xs tracking-widest text-violet-300">
                      {item.year}
                    </span>
                    <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{item.desc}</p>
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Statistics + Growth chart                                          */
/* ------------------------------------------------------------------ */

function StatCard({ stat }: { stat: (typeof STATS)[number] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const count = useCountUp(stat.value, inView);
  const Icon = stat.icon;

  return (
    <div
      ref={ref}
      onMouseMove={handleTiltMove}
      onMouseLeave={handleTiltLeave}
      className="glow-border rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.35)]"
    >
      <Icon className="h-5 w-5 text-violet-300" />
      <div className="mt-5 font-[family-name:var(--font-display)] text-4xl text-white">
        {formatStat(count, stat.suffix)}
      </div>
      <p className="mt-2 text-sm text-white/50">{stat.label}</p>
    </div>
  );
}

function StatisticsAndGrowth() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <Reveal className="mb-14 flex flex-col items-center text-center">
        <Eyebrow>By the numbers</Eyebrow>
        <h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-white md:text-5xl">
          Growth that compounds
        </h2>
      </Reveal>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {STATS.map((stat) => (
          <Reveal key={stat.label} delay={0.05}>
            <StatCard stat={stat} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.15} className="mt-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md md:p-10">
          <div className="mb-6 flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-white">
                Successful hires, monthly
              </h3>
              <p className="mt-1 text-sm text-white/50">
                Platform-wide completed placements, trailing twelve months.
              </p>
            </div>
            <div className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs text-emerald-300">
              <ArrowRight className="h-3.5 w-3.5 -rotate-45" />
              +412% YoY
            </div>
          </div>
          <div className="h-64 w-full md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={GROWTH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.35)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0b0e17",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                />
                <Line
                  type="monotone"
                  dataKey="hires"
                  stroke="url(#lineGlow)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, fill: "#a78bfa" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Hiring Workflow                                                  */
/* ------------------------------------------------------------------ */

function Workflow() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <Reveal className="mb-16 flex flex-col items-center text-center">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-white md:text-5xl">
          The AI hiring workflow
        </h2>
        <p className="mt-4 max-w-lg text-white/55">
          A single ordered pipeline, from raw profile to signed offer, with a
          human confirming every step the model takes.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {WORKFLOW_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <Reveal key={step.title} delay={i * 0.08} className="relative">
              <div
                onMouseMove={handleTiltMove}
                onMouseLeave={handleTiltLeave}
                className="glow-border relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md"
              >
                <span className="font-[family-name:var(--font-mono)] text-[11px] text-white/30">
                  0{i + 1}
                </span>
                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-400/20">
                  <Icon className="h-5 w-5 text-violet-200" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{step.desc}</p>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <span className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-white/20 md:block">
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Bento feature grid                                                  */
/* ------------------------------------------------------------------ */

function BentoGrid() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <Reveal className="mb-14 flex flex-col items-center text-center">
        <Eyebrow>What sets us apart</Eyebrow>
        <h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-white md:text-5xl">
          Built for signal, not noise
        </h2>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:auto-rows-[180px]">
        {BENTO_FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <Reveal key={f.title} delay={i * 0.06} className={f.className}>
              <div
                onMouseMove={handleTiltMove}
                onMouseLeave={handleTiltLeave}
                className="glow-border group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-md"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5">
                  <Icon className="h-5 w-5 text-violet-200" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Mission & Vision                                                    */
/* ------------------------------------------------------------------ */

function MissionVision() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Reveal>
          <div className="glow-border h-full rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-9 backdrop-blur-md">
            <Rocket className="h-6 w-6 text-violet-300" />
            <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl text-white">
              Our mission
            </h3>
            <p className="mt-4 leading-relaxed text-white/60">
              Give every candidate a fair, fast read — and every company a
              shortlist they can trust without re-doing the work themselves.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="glow-border h-full rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/[0.08] to-transparent p-9 backdrop-blur-md">
            <Globe2 className="h-6 w-6 text-cyan-300" />
            <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl text-white">
              Our vision
            </h3>
            <p className="mt-4 leading-relaxed text-white/60">
              A hiring market where the best match wins — not the best-worded
              resume or the loudest network — anywhere in the world.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Live dashboard mockup                                               */
/* ------------------------------------------------------------------ */

function LiveDashboard() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const rows = [
    { name: "Frontend Engineer", match: 94 },
    { name: "Product Designer", match: 88 },
    { name: "Data Scientist", match: 91 },
    { name: "Growth Marketer", match: 79 },
  ];

  return (
    <section className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <Reveal className="mb-14 flex flex-col items-center text-center">
        <Eyebrow>Inside the platform</Eyebrow>
        <h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-white md:text-5xl">
          A live look at matching
        </h2>
      </Reveal>

      <Reveal>
        <div
          ref={ref}
          className="glow-border overflow-hidden rounded-3xl border border-white/10 bg-[#0a0d16]/80 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-3 font-[family-name:var(--font-mono)] text-[11px] text-white/40">
              hirevix.ai/dashboard
            </span>
          </div>

          <div className="grid grid-cols-1 gap-0 md:grid-cols-5">
            <div className="border-white/10 p-6 md:col-span-3 md:border-r">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-white/70">Match confidence</span>
                <span className="font-[family-name:var(--font-mono)] text-xs text-emerald-300">
                  live
                </span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MATCH_DATA}>
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="#a78bfa"
                      strokeWidth={2}
                      fill="url(#areaFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 space-y-3">
                {rows.map((row, i) => (
                  <div key={row.name}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-white/60">{row.name}</span>
                      <span className="font-[family-name:var(--font-mono)] text-white/40">
                        {row.match}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${row.match}%` } : { width: 0 }}
                        transition={{ duration: 1, delay: 0.2 + i * 0.15, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 md:col-span-2">
              <span className="text-sm font-medium text-white/70">Pipeline health</span>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Open roles", value: "182" },
                  { label: "In review", value: "3,410" },
                  { label: "Offers out", value: "94" },
                  { label: "Avg. match", value: "89%" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                    <p className="font-[family-name:var(--font-display)] text-xl text-white">
                      {m.value}
                    </p>
                    <p className="mt-1 text-[11px] text-white/40">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3.5 text-xs text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
                Neural ranker synced 2 minutes ago
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonials marquee                                                */
/* ------------------------------------------------------------------ */

function TestimonialsMarquee() {
  const loop = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      <Reveal className="mb-14 flex flex-col items-center px-6 text-center">
        <Eyebrow>Trusted by talent teams</Eyebrow>
        <h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-white md:text-5xl">
          What hiring teams say
        </h2>
      </Reveal>

      <div className="marquee-mask relative">
        <div className="marquee-track flex w-max gap-5">
          {loop.map((t, i) => (
            <div
              key={i}
              className="w-[320px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md sm:w-[380px]"
            >
              <Quote className="h-5 w-5 text-violet-300/70" />
              <p className="mt-4 text-sm leading-relaxed text-white/70">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400/30 to-cyan-300/30 text-xs font-medium text-white">
                  {t.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Team                                                                */
/* ------------------------------------------------------------------ */

function Team() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <Reveal className="mb-14 flex flex-col items-center text-center">
        <Eyebrow>The people behind it</Eyebrow>
        <h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-white md:text-5xl">
          Meet the team
        </h2>
      </Reveal>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
        {TEAM.map((member, i) => (
          <Reveal key={member.name} delay={i * 0.05}>
            <div
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
              className="glow-border flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-center backdrop-blur-md"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-400/40 to-cyan-300/40 font-[family-name:var(--font-display)] text-lg text-white">
                {member.initials}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{member.name}</h3>
              <p className="mt-1 text-xs text-white/45">{member.role}</p>
              <div className="mt-4 flex items-center gap-3 text-white/35">
                <Linkedin className="h-3.5 w-3.5 transition-colors hover:text-white" />
                <Twitter className="h-3.5 w-3.5 transition-colors hover:text-white" />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Tech stack                                                          */
/* ------------------------------------------------------------------ */

function TechStack() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <Reveal className="mb-14 flex flex-col items-center text-center">
        <Eyebrow>Under the hood</Eyebrow>
        <h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-white md:text-5xl">
          What we build with
        </h2>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {TECH_STACK.map((t, i) => {
          const Icon = t.icon;
          return (
            <Reveal key={t.name} delay={i * 0.04}>
              <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 transition-all duration-300 hover:border-violet-400/30 hover:bg-white/[0.04] hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.4)]">
                <Icon className="h-4 w-4 text-violet-300 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-sm text-white/70">{t.name}</span>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Large CTA                                                           */
/* ------------------------------------------------------------------ */

function CTA() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-600/20 via-[#0a0d16] to-cyan-500/10 px-8 py-20 text-center backdrop-blur-md md:px-16 md:py-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="aurora-blob aurora-a" style={{ opacity: 0.5 }} />
            <div className="aurora-blob aurora-c" style={{ opacity: 0.4 }} />
          </div>
          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-display)] text-4xl text-white md:text-6xl">
              Hiring, finally solved by understanding.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-white/60">
              Join thousands of teams matching on substance instead of
              keywords — free to start, ready in minutes.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button className="group rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-transform duration-300 hover:scale-[1.03]">
                <span className="flex items-center gap-2">
                  Get started free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
              <button className="rounded-full border border-white/15 px-8 py-4 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white">
                Talk to sales
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                              */
/* ------------------------------------------------------------------ */

function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const columns = [
    { title: "Product", links: ["Matching engine", "Copilot", "For companies", "Pricing"] },
    { title: "Company", links: ["About", "Careers", "Press", "Blog"] },
    { title: "Resources", links: ["Help center", "API docs", "Status", "Guides"] },
  ];
  return (
    <footer className="relative border-t border-white/10 px-6 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 md:grid-cols-5">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-cyan-300">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <span className="font-[family-name:var(--font-display)] text-lg text-white">
              Hirevix
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/45">
            The AI hiring engine built to see people, not keywords.
          </p>
          <div className="mt-6 flex items-center gap-4 text-white/40">
            <Linkedin className="h-4 w-4 transition-colors hover:text-white" />
            <Twitter className="h-4 w-4 transition-colors hover:text-white" />
            <Github className="h-4 w-4 transition-colors hover:text-white" />
            <Mail className="h-4 w-4 transition-colors hover:text-white" />
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold text-white">{col.title}</h4>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-white/45 transition-colors hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-14 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/35 md:flex-row">
        <span>© {currentYear ?? 2026} Hirevix, Inc. All rights reserved.</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white/60">Privacy</a>
          <a href="#" className="hover:text-white/60">Terms</a>
          <a href="#" className="hover:text-white/60">Security</a>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll progress bar                                                 */
/* ------------------------------------------------------------------ */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed left-0 top-0 z-50 h-[2px] w-full bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function AboutPage() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".gsap-fade").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
            },
          }
        );
      });
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <main
      className={`${display.variable} ${body.variable} ${mono.variable} relative min-h-screen w-full bg-[#05060a] font-[family-name:var(--font-body)] text-white antialiased`}
    >
      <style>{`
        @keyframes auroraDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(4%, -6%) scale(1.08); }
          66% { transform: translate(-5%, 4%) scale(0.96); }
        }
        .aurora-blob {
          position: absolute;
          width: 60vw;
          height: 60vw;
          max-width: 780px;
          max-height: 780px;
          border-radius: 9999px;
          filter: blur(110px);
          animation: auroraDrift 22s ease-in-out infinite;
        }
        .aurora-a {
          top: -10%;
          left: -10%;
          background: radial-gradient(circle at center, rgba(139,92,246,0.55), transparent 65%);
        }
        .aurora-b {
          bottom: -20%;
          right: -10%;
          background: radial-gradient(circle at center, rgba(34,211,238,0.4), transparent 65%);
          animation-delay: -7s;
        }
        .aurora-c {
          top: 30%;
          right: 20%;
          background: radial-gradient(circle at center, rgba(217,70,239,0.35), transparent 65%);
          animation-delay: -14s;
        }
        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-24px) translateX(10px); }
          100% { transform: translateY(0) translateX(0); }
        }
        .particle {
          position: absolute;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(196,181,253,0.9), rgba(196,181,253,0));
          animation-name: floatParticle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .glow-border {
          transition: box-shadow 0.35s ease, border-color 0.35s ease, transform 0.25s ease;
        }
        .glow-border:hover {
          border-color: rgba(167, 139, 250, 0.35);
        }
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marqueeScroll 44s linear infinite;
        }
        .marquee-mask {
          mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora-blob, .particle, .marquee-track { animation: none !important; }
        }
      `}</style>

      <ScrollProgress />
      <Hero />
      <Timeline />
      <StatisticsAndGrowth />
      <Workflow />
      <BentoGrid />
      <MissionVision />
      <LiveDashboard />
      <TestimonialsMarquee />
      <Team />
      <TechStack />
      <CTA />
      <Footer />
    </main>
  );
}