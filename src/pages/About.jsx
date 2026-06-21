import React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ButtonLink } from "../components/Button.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { explorationAreas, socialLinks } from "../data/site.js";

const principles = [
  "Practical over hype",
  "Builder-focused education",
  "AI systems for real business and biotech use cases",
];

export default function About() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(50,169,255,0.16),transparent_36%),linear-gradient(300deg,rgba(139,92,246,0.14),transparent_42%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <p className="mb-5 inline-flex rounded-full border border-electric/30 bg-electric/10 px-4 py-2 text-sm font-semibold text-electric">
            About Granulariti
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Granulariti is built for applied AI.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Granulariti exists to turn AI, data science, and automation into
            practical systems that solve real problems in biotech, clinical
            trials, and business workflows.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <SectionHeader eyebrow="Founder / Mission" title="Useful AI products, taught clearly.">
          Granulariti was created by Cameron Williams, a Data Scientist focused
          on clinical trials, AI systems, and practical automation. The mission
          is simple: build useful AI products, teach what works, and help
          organizations turn data into better decisions.
        </SectionHeader>
        <div className="rounded-2xl border border-white/10 bg-white/6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {["Clinical trials", "Applied AI", "Automation", "Education"].map(
              (item) => (
                <div key={item} className="rounded-2xl bg-white/6 p-5">
                  <p className="text-sm font-semibold text-electric">{item}</p>
                  <div className="mt-4 h-2 rounded-full bg-gradient-to-r from-electric to-violet" />
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-midnight/80">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            centered
            eyebrow="Why Granulariti Exists"
            title="Applied AI is the useful layer."
          >
            Most AI content is either too theoretical or too generic.
            Granulariti focuses on applied AI — the kind that can be built,
            tested, shipped, and used.
          </SectionHeader>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {principles.map((principle) => (
              <article
                key={principle}
                className="rounded-2xl border border-white/10 bg-white/6 p-6"
              >
                <CheckCircle2 className="text-electric" size={26} />
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {principle}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Current Areas of Exploration"
          title="Where the brand is actively building."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {explorationAreas.map((area) => (
            <div
              key={area}
              className="rounded-2xl border border-white/10 bg-white/6 p-5 text-sm font-medium leading-6 text-slate-200 transition hover:-translate-y-1 hover:border-electric/45 hover:text-white"
            >
              {area}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-electric/10 p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-electric">
                Follow along
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white">
                Want to follow what Granulariti is building?
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {socialLinks.map(({ name, href }) => (
                <ButtonLink
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  variant={name === "YouTube" ? "primary" : "secondary"}
                >
                  {name} <ArrowRight size={18} />
                </ButtonLink>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
