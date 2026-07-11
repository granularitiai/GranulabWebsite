import React from "react";
import { ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { products, socialLinks } from "../data/site.js";

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-white/12 text-white"
      : "text-slate-300 hover:bg-white/8 hover:text-white"
  }`;

export default function Navbar() {
  const location = useLocation();
  const isProductsActive = location.pathname.startsWith("/products");
  const productActive = ({ isActive }) =>
    `block rounded-xl px-4 py-3 text-sm transition ${
      isActive
        ? "bg-electric/12 text-white"
        : "text-slate-300 hover:bg-white/8 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-electric/30 bg-electric/12 text-lg font-black text-electric shadow-glow">
            G
          </span>
          <span className="text-lg font-bold tracking-wide text-white">
            Granulariti
          </span>
        </NavLink>

        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <div className="group relative">
            <button
              type="button"
              className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                isProductsActive
                  ? "bg-white/12 text-white"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              Products <ChevronDown size={15} />
            </button>
            <div className="invisible absolute left-0 top-full z-50 mt-3 w-80 translate-y-2 rounded-2xl border border-white/10 bg-midnight/95 p-2 opacity-0 shadow-glow backdrop-blur-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              {products.map((product) => (
                <NavLink
                  key={product.name}
                  to={product.href}
                  className={productActive}
                >
                  <span className="block font-semibold">{product.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">
                    {product.description}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            {socialLinks.map(({ name, href, icon: Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={name}
                className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:-translate-y-0.5 hover:border-electric/60 hover:text-white"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </nav>
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 pb-4 md:hidden">
        <NavLink to="/" className={navLinkClass}>
          Home
        </NavLink>
        <NavLink to="/about" className={navLinkClass}>
          About
        </NavLink>
        {products.map((product) => (
          <NavLink
            key={product.name}
            to={product.href}
            className={(state) => `${navLinkClass(state)} whitespace-nowrap`}
          >
            {product.name}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
