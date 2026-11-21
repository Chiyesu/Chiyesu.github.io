"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation, site } from "@/content/site";

export function Navigation() {
  const pathname = usePathname();
  const [active, setActive] = useState<string>("home");
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const current = pathname === "/" ? active : pathname.startsWith("/projects/") ? "projects" : null;

  useEffect(() => {
    if (pathname !== "/") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((entry) => entry.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    navigation.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="shell flex items-center justify-between pt-4 md:pt-5">
        <Link
          href="/#home"
          aria-label={`${site.name}, home`}
          className="pointer-events-auto relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-carbon/80 font-serif text-lg leading-none text-mist backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          MC<span className="text-signal">.</span>
        </Link>

        <nav aria-label="Primary" className="pointer-events-auto hidden md:block">
          <ul className="flex items-center gap-0.5 rounded-full border border-line bg-carbon/75 p-1 backdrop-blur-md">
            {navigation.map(({ id, label }) => {
              const isCurrent = current === id;
              return (
                <li key={id} className="relative">
                  {isCurrent && (
                    <motion.span
                      layoutId="nav-current"
                      className="absolute inset-0 rounded-full bg-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    />
                  )}
                  <Link
                    href={`/#${id}`}
                    aria-current={isCurrent ? "true" : undefined}
                    className={`relative block rounded-full px-4 py-2 text-[0.82rem] transition-colors hover:text-mist ${
                      isCurrent ? "text-mist" : "text-haze"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <span className="hidden w-10 md:block" aria-hidden />

        <button
          ref={toggle}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
          className="pointer-events-auto relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-carbon/80 backdrop-blur-md md:hidden"
        >
          {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto fixed inset-0 flex items-center bg-void/97 md:hidden"
          >
            <ul className="shell space-y-1">
              {navigation.map(({ id, label }, index) => (
                <motion.li
                  key={id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * index, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={`/#${id}`}
                    onClick={() => setOpen(false)}
                    aria-current={current === id ? "true" : undefined}
                    className={`display block py-1.5 text-5xl ${current === id ? "text-signal" : "text-mist"}`}
                  >
                    {label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
