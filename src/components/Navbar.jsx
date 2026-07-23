import React, { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  resourceLinks,
  serviceOfferings,
  solutions,
} from "../data/site.js";

const navLinkClass = ({ isActive }) =>
  `rounded-full px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-white/12 text-white"
      : "text-slate-300 hover:bg-white/8 hover:text-white"
  }`;

function MenuLink({ item, onNavigate, compact = false }) {
  const className = ({ isActive }) =>
    `group flex gap-3 rounded-xl transition ${
      compact ? "px-3 py-2.5" : "px-4 py-3"
    } ${
      isActive
        ? "bg-electric/12 text-white"
        : "text-slate-300 hover:bg-white/8 hover:text-white"
    }`;
  const content = (
    <>
      {item.icon && (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/7 text-electric">
          <item.icon size={17} />
        </span>
      )}
      <span>
        <span className="block text-sm font-semibold">{item.name}</span>
        {item.description && (
          <span className="mt-1 block text-xs leading-5 text-slate-400">
            {item.description}
          </span>
        )}
      </span>
    </>
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className={className({ isActive: false })}
        onClick={onNavigate}
      >
        {content}
      </a>
    );
  }

  return (
    <NavLink to={item.href} className={className} onClick={onNavigate}>
      {content}
    </NavLink>
  );
}

function DesktopDropdown({ label, items, active, openMenu, setOpenMenu }) {
  const isOpen = openMenu === label;
  const menuId = `${label.toLowerCase()}-navigation`;

  function closeWhenFocusLeaves(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpenMenu(null);
  }

  return (
    <div
      className="relative"
      onBlur={closeWhenFocusLeaves}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpenMenu(null);
          event.currentTarget.querySelector("button")?.focus();
        }
      }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setOpenMenu(isOpen ? null : label)}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition ${
          active || isOpen
            ? "bg-white/12 text-white"
            : "text-slate-300 hover:bg-white/8 hover:text-white"
        }`}
      >
        {label}{" "}
        <ChevronDown
          size={15}
          className={`transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={menuId}
        className={`absolute left-1/2 top-full z-50 mt-3 w-96 -translate-x-1/2 rounded-2xl border border-white/10 bg-midnight/95 p-2 shadow-glow backdrop-blur-xl transition ${
          isOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-2 opacity-0"
        }`}
      >
        <p className="px-4 pb-2 pt-3 text-xs font-bold uppercase tracking-[0.16em] text-electric">
          {label}
        </p>
        {items.map((item) => (
          <MenuLink
            key={item.name}
            item={item}
            onNavigate={() => setOpenMenu(null)}
          />
        ))}
      </div>
    </div>
  );
}

export default function Navbar() {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  const isSolutionsActive = location.pathname.startsWith("/products");
  const isServicesActive = location.pathname.startsWith("/services");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-electric/30 bg-electric/12 text-lg font-black text-electric shadow-glow">
            G
          </span>
          <span className="text-lg font-bold tracking-wide text-white">
            Granulariti
          </span>
        </NavLink>

        <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <DesktopDropdown
            label="Solutions"
            items={solutions}
            active={isSolutionsActive}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
          />
          <DesktopDropdown
            label="Services"
            items={serviceOfferings}
            active={isServicesActive}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
          />
          <NavLink to="/resources" className={navLinkClass}>
            Resources
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-electric/50 hover:text-white lg:hidden"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="max-h-[calc(100vh-73px)] overflow-y-auto border-t border-white/10 bg-midnight/98 px-5 py-5 lg:hidden">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="grid gap-2 sm:grid-cols-3">
              <NavLink to="/" className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/about" className={navLinkClass}>
                About
              </NavLink>
              <NavLink to="/contact" className={navLinkClass}>
                Contact
              </NavLink>
            </div>

            <MobileSection title="Solutions" items={solutions} />
            <MobileSection title="Services" items={serviceOfferings} />
            <MobileSection title="Resources" items={resourceLinks} compact />
          </div>
        </div>
      )}
    </header>
  );
}

function MobileSection({ title, items, compact = false }) {
  return (
    <section>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-electric">
        {title}
      </p>
      <div className="grid gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-2 sm:grid-cols-2">
        {items.map((item) => (
          <MenuLink key={item.name} item={item} compact={compact} />
        ))}
      </div>
    </section>
  );
}
