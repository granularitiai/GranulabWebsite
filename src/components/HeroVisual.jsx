import React from "react";
import { Activity, Bot, Database, GitBranch, LineChart, Zap } from "lucide-react";

const nodes = [
  { label: "Clinical Data", icon: Database, accent: "text-electric" },
  { label: "AI Workflow", icon: GitBranch, accent: "text-violet" },
  { label: "Automation", icon: Zap, accent: "text-cyan-300" },
  { label: "Analytics", icon: LineChart, accent: "text-blue-300" },
];

export default function HeroVisual() {
  return (
    <div className="relative rounded-[2rem] border border-white/10 bg-white/6 p-5 shadow-glow">
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(50,169,255,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.22),transparent_30%)]" />
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-ink/70 p-5">
        <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Granulariti OS
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              Applied AI Pipeline
            </h3>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Live
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {nodes.map(({ label, icon: Icon, accent }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/7 p-4"
            >
              <Icon className={accent} size={24} />
              <p className="mt-4 font-semibold text-white">{label}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-electric to-violet" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-electric/20 bg-electric/8 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-electric/15 p-2 text-electric">
              <Bot size={22} />
            </div>
            <div>
              <p className="font-semibold text-white">Decision Intelligence</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Enrollment signals, site performance, protocol data, and
                automated reporting connected into builder-ready AI systems.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {["RAG", "Trials", "Agents"].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"
            >
              <Activity className="mx-auto mb-2 text-electric" size={18} />
              <p className="text-xs font-semibold text-slate-300">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
