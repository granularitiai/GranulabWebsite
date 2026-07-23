import React from "react";
import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { ButtonLink } from "../components/Button.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { serviceOfferings } from "../data/site.js";

const serviceDetails = {
  "ai-discovery": {
    eyebrow: "AI Discovery",
    title: "Find the AI opportunities worth pursuing.",
    body:
      "A focused engagement to identify where AI can create meaningful operational, scientific, or analytical value in your organization.",
    steps: [
      "Understand priority workflows, data assets, and organizational constraints.",
      "Evaluate opportunities by impact, feasibility, risk, and implementation effort.",
      "Deliver a prioritized recommendation set for executive and technical review.",
    ],
  },
  "ai-implementation": {
    eyebrow: "AI Implementation",
    title: "Move from an AI concept to a working system.",
    body:
      "Deploy and customize Granulariti solutions around your team's data, workflows, controls, and operating environment.",
    steps: [
      "Define the implementation scope, users, success measures, and technical dependencies.",
      "Configure the solution and integrate it into the target workflow.",
      "Evaluate outputs, document operating guidance, and enable the team.",
    ],
  },
  "custom-solutions": {
    eyebrow: "Custom Solutions",
    title: "Build AI around the workflow you actually have.",
    body:
      "Design and build tailored tools for scientific, clinical, and data workflows that are not served by an off-the-shelf product.",
    steps: [
      "Translate the workflow and user problem into a testable product specification.",
      "Build a focused prototype around the highest-value use case.",
      "Iterate toward a maintainable solution with clear human review points.",
    ],
  },
};

export default function ServiceDetail() {
  const { serviceSlug } = useParams();
  const service = serviceOfferings.find((item) => item.slug === serviceSlug);
  const details = serviceDetails[serviceSlug];

  if (!service || !details) return <Navigate to="/" replace />;

  const Icon = service.icon;

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(50,169,255,0.16),transparent_38%),linear-gradient(310deg,rgba(139,92,246,0.14),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 lg:grid-cols-[1fr_0.7fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-electric">
              Granulariti Services / {details.eyebrow}
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              {details.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              {details.body}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/contact">
                Discuss this service <ArrowRight size={18} />
              </ButtonLink>
              <ButtonLink to="/about" variant="secondary">
                About Granulariti
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-glow">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric/12 text-electric">
              <Icon size={25} />
            </span>
            <h2 className="mt-5 text-2xl font-bold text-white">{service.name}</h2>
            <p className="mt-3 leading-7 text-slate-300">{service.description}</p>
            {service.duration && (
              <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-5 text-sm font-semibold text-slate-200">
                <Clock3 className="text-electric" size={18} />
                Duration: {service.duration}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <SectionHeader eyebrow="What You Receive" title="A focused, practical engagement.">
          The work is organized around decisions and usable outputs rather than
          open-ended AI exploration.
        </SectionHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {service.deliverables.map((deliverable) => (
            <article
              key={deliverable}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"
            >
              <CheckCircle2 className="text-electric" size={22} />
              <h3 className="mt-4 text-lg font-semibold text-white">
                {deliverable}
              </h3>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-midnight/80">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            centered
            eyebrow="Delivery Approach"
            title="Structured from context to implementation."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {details.steps.map((step, index) => (
              <article
                key={step}
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-6"
              >
                <span className="text-sm font-black text-electric">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-4 leading-7 text-slate-200">{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-2xl border border-electric/25 bg-electric/10 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-electric">
              Start a conversation
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">
              Have a workflow this service could improve?
            </h2>
          </div>
          <ButtonLink to="/contact">
            Contact Granulariti <ArrowRight size={18} />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
