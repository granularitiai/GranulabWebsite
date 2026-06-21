import React from "react";
import { ArrowRight, BrainCircuit, ChartNoAxesCombined, GraduationCap } from "lucide-react";
import { ButtonLink } from "../components/Button.jsx";
import HeroVisual from "../components/HeroVisual.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import SocialCards from "../components/SocialCards.jsx";
import { focusAreas, socialLinks } from "../data/site.js";

const services = [
  {
    title: "AI Systems for Clinical Trials",
    description:
      "Tools and workflows for enrollment prediction, site selection, trial optimization, and clinical data intelligence.",
    icon: BrainCircuit,
  },
  {
    title: "Data Science & Automation",
    description:
      "Practical analytics, dashboards, workflow automation, and agentic AI systems built for real-world use cases.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "AI Education & Build Content",
    description:
      "Tutorials, demos, and breakdowns showing how to build applied AI products using modern tools.",
    icon: GraduationCap,
  },
];

export default function Home() {
  const youtube = socialLinks.find((link) => link.name === "YouTube");

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(50,169,255,0.14),transparent_38%),linear-gradient(320deg,rgba(139,92,246,0.16),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-28">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-electric/30 bg-electric/10 px-4 py-2 text-sm font-semibold text-electric">
              Applied AI, clinical analytics, and builder education
            </p>
            <h1 className="max-w-5xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Applied AI for Biotech, Clinical Trials, and Data-Driven Builders
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Granulariti builds practical AI systems, analytics workflows, and
              educational content that help teams move from raw data to
              real-world decisions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/about">
                Explore the Brand <ArrowRight size={18} />
              </ButtonLink>
              <ButtonLink
                href={youtube.href}
                target="_blank"
                rel="noreferrer"
                variant="secondary"
              >
                Watch on YouTube
              </ButtonLink>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="What Granulariti Does"
          title="Practical systems for high-signal AI work."
        >
          The brand sits at the intersection of clinical trial operations, data
          science, automation, and modern AI product building.
        </SectionHeader>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {services.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/6 p-6 transition hover:-translate-y-1 hover:border-electric/45 hover:bg-white/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-electric/12 text-electric">
                <Icon size={25} />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-midnight/80">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            centered
            eyebrow="Featured Focus Areas"
            title="Built around use cases that can ship."
          />
          <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
            {focusAreas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-white/10 bg-white/7 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-electric/50 hover:text-white"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <SectionHeader eyebrow="Social / Content" title="Follow the Build Journey">
            Granulariti shares AI tutorials, biotech AI product ideas, and
            practical demos across YouTube, Instagram, and LinkedIn.
          </SectionHeader>
          <SocialCards />
        </div>
      </section>
    </>
  );
}
