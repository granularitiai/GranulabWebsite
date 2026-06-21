import React from "react";
import { Link } from "react-router-dom";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-electric focus:ring-offset-2 focus:ring-offset-ink";

const variants = {
  primary:
    "bg-electric text-ink shadow-glow hover:-translate-y-0.5 hover:bg-sky-300",
  secondary:
    "border border-white/15 bg-white/8 text-white hover:-translate-y-0.5 hover:border-electric/60 hover:bg-white/12",
};

export function ButtonLink({
  children,
  to,
  href,
  variant = "primary",
  className = "",
  ...props
}) {
  const classes = `${baseClasses} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a className={classes} href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} to={to} {...props}>
      {children}
    </Link>
  );
}
