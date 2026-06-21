import React from "react";
import { ArrowUpRight } from "lucide-react";
import { socialLinks } from "../data/site.js";

export default function SocialCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {socialLinks.map(({ name, label, href, icon: Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="group rounded-2xl border border-white/10 bg-white/6 p-6 transition duration-200 hover:-translate-y-1 hover:border-electric/50 hover:bg-white/10"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-electric/12 text-electric">
              <Icon size={24} />
            </div>
            <ArrowUpRight
              size={20}
              className="text-slate-500 transition group-hover:text-electric"
            />
          </div>
          <h3 className="mt-6 text-xl font-semibold text-white">{name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{label}</p>
        </a>
      ))}
    </div>
  );
}
