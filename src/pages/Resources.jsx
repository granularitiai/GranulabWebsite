import React from "react";
import { ArrowRight, BookOpen, Instagram, Linkedin, Youtube } from "lucide-react";
import { ButtonLink } from "../components/Button.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { socialLinks } from "../data/site.js";

const resourceTypes = [
  {
    name: "Build Tutorials",
    description:
      "Practical walkthroughs for applied AI, analytics, automation, and product development.",
    icon: Youtube,
    social: "YouTube",
  },
  {
    name: "Short AI Insights",
    description:
      "Concise ideas, interface demos, and lessons from active Granulariti builds.",
    icon: Instagram,
    social: "Instagram",
  },
  {
    name: "Professional Updates",
    description:
      "Clinical data, AI engineering, and product perspectives for professional teams.",
    icon: Linkedin,
    social: "LinkedIn",
  },
];

export default function Resources() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(50,169,255,0.16),transparent_38%),linear-gradient(310deg,rgba(139,92,246,0.14),transparent_42%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-electric">
            Resources
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Practical AI knowledge for scientific and data-driven builders.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Explore tutorials, product builds, technical breakdowns, and applied
            lessons from Granulariti.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Learning Channels"
          title="Follow the format that works for you."
        >
          Resources are published across Granulariti's active learning and
          professional channels.
        </SectionHeader>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {resourceTypes.map(({ name, description, icon: Icon, social }) => {
            const link = socialLinks.find((item) => item.name === social);
            return (
              <a
                key={name}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-white/10 bg-white/[0.06] p-6 transition hover:-translate-y-1 hover:border-electric/45 hover:bg-white/10"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric/12 text-electric">
                  <Icon size={24} />
                </span>
                <h2 className="mt-6 text-xl font-semibold text-white">{name}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {description}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-electric">
                  Open {social}{" "}
                  <ArrowRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-midnight/80 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="rounded-xl bg-electric/12 p-3 text-electric">
              <BookOpen size={24} />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Explore working Granulariti solutions
              </h2>
              <p className="mt-2 text-slate-300">
                Move from learning about applied AI to trying it directly.
              </p>
            </div>
          </div>
          <ButtonLink to="/products/clinical-data-visualization">
            Launch a solution <ArrowRight size={18} />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
