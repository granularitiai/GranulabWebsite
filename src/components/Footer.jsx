import React from "react";
import { NavLink } from "react-router-dom";
import { socialLinks } from "../data/site.js";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-midnight">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p className="max-w-2xl text-sm text-slate-400">
          © 2026 Granulariti. Built for applied AI, biotech, and data science.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-400">
            <NavLink className="transition hover:text-white" to="/resources">
              Resources
            </NavLink>
            <NavLink className="transition hover:text-white" to="/about">
              About
            </NavLink>
            <NavLink className="transition hover:text-white" to="/contact">
              Contact
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            {socialLinks.map(({ name, href, icon: Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={name}
                className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:border-electric/60 hover:text-white"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
