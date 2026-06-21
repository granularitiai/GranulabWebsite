import React from "react";

export default function SectionHeader({ eyebrow, title, children, centered = false }) {
  return (
    <div className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-electric">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold text-white sm:text-4xl">{title}</h2>
      {children && <p className="mt-4 text-lg leading-8 text-slate-300">{children}</p>}
    </div>
  );
}
