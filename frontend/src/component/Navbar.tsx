"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/reception", label: "Receptionist" },
  { href: "/doctor", label: "Doctor" },
  { href: "/admin", label: "Admin" },
  { href: "/display", label: "Display Board" },
];

const Navbar = () => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href === "/reception" && pathname === "/");

  const profileByPath: Record<string, { initials: string; name: string } | null> = {
    "/doctor": { initials: "RK", name: "Dr. Rohan Kapoor" },
    "/admin": { initials: "AD", name: "Admin" },
    "/reception": { initials: "RC", name: "Receptionist" },
    "/": { initials: "RC", name: "Receptionist" },
    "/display": null,
  };

  const activeProfile = profileByPath[pathname] ?? null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-slate-50/95 backdrop-blur">
      <nav className="relative mx-auto flex h-[70px] w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/reception" className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14b8a6] text-white shadow-sm">
            <Activity className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold text-slate-900">MediQueue</span>
            <span className="block text-xs font-medium text-slate-500">Smart Patient Queue</span>
          </span>
        </Link>

        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 md:block">
          <div className="pointer-events-auto flex items-center gap-2 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 transition-all ${
                  isActive(item.href)
                    ? "bg-teal-100 text-teal-700 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center md:flex">
          {activeProfile ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {activeProfile.initials}
              </div>
              <p className="text-sm font-semibold text-slate-800">{activeProfile.name}</p>
            </div>
          ) : (
            <div className="h-10 w-[220px]" aria-hidden />
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {isMobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-teal-100 text-teal-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;