import React from "react";
import { ArrowRight, BrainCircuit, Linkedin, Wrench } from "lucide-react";
import SectionHeader from "../components/SectionHeader.jsx";
import { socialLinks } from "../data/site.js";

const inquiryTypes = [
  {
    title: "Explore an AI opportunity",
    description:
      "Discuss a workflow, data challenge, or organizational question that may benefit from applied AI.",
    icon: BrainCircuit,
  },
  {
    title: "Implement or customize a solution",
    description:
      "Talk through deployment, integration, or customization of a Granulariti solution.",
    icon: Wrench,
  },
];

export default function Contact() {
  const linkedin = socialLinks.find((link) => link.name === "LinkedIn");

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(50,169,255,0.16),transparent_38%),linear-gradient(310deg,rgba(139,92,246,0.14),transparent_42%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-electric">
            Contact
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Start with the problem you want to solve.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Connect with Granulariti to discuss AI discovery, implementation, or
            a custom scientific and clinical workflow.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
        <div>
          <SectionHeader
            eyebrow="Good Starting Points"
            title="Bring a use case, workflow, or decision."
          >
            A useful first conversation focuses on the users involved, the data
            available, and what a better outcome would look like.
          </SectionHeader>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {inquiryTypes.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"
              >
                <Icon className="text-electric" size={22} />
                <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-electric/25 bg-electric/10 p-6 shadow-glow">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink/60 text-electric">
            <Linkedin size={24} />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-white">
            Connect with Cameron Williams
          </h2>
          <p className="mt-3 leading-7 text-slate-300">
            LinkedIn is currently the direct channel for service and
            collaboration inquiries.
          </p>
          <a
            href={linkedin.href}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-electric px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-sky-300"
          >
            Start a conversation <ArrowRight size={18} />
          </a>
        </aside>
      </section>
    </>
  );
}
