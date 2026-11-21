import { ArrowDownRight } from "lucide-react";
import type { CSSProperties } from "react";
import { availabilityLabels, site } from "@/content/site";
import { HeroStage } from "./HeroStage";

const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;
const dotColor = { open: "bg-signal", limited: "bg-signal/60", unavailable: "bg-dim", "on-request": "bg-haze" };

export function Hero() {
  const [first, last] = site.name.split(" ");
  const { visible, status } = site.availability;

  return (
    <section id="home" aria-labelledby="hero-title">
      <HeroStage>
        <div className="shell pointer-events-none flex h-full flex-col justify-end pb-9 md:justify-center md:pb-0 md:pt-10">
          <div className="max-w-3xl">
            {visible && (
              <p className="enter eyebrow mb-6 flex items-center gap-2.5" style={delay(0)}>
                <span className={`h-1.5 w-1.5 rounded-full ${dotColor[status]}`} aria-hidden />
                {availabilityLabels[status]}
              </p>
            )}
            <h1 id="hero-title" className="display text-[clamp(3.5rem,9.2vw,9rem)] !leading-[0.92]">
              <span className="block overflow-hidden pb-[0.08em]">
                <span className="enter-line">{first}</span>
              </span>
              <span className="block overflow-hidden pb-[0.08em]">
                <span className="enter-line" style={delay(0.1)}>{last}</span>
              </span>
            </h1>
            <p className="enter eyebrow mt-5 !text-signal" style={delay(0.25)}>{site.role}</p>
            <p className="enter mt-6 font-serif text-2xl leading-tight md:text-3xl" style={delay(0.35)}>
              {site.tagline}
            </p>
            <p className="enter mt-3 max-w-lg text-[0.98rem] leading-relaxed text-haze" style={delay(0.45)}>
              {site.intro}
            </p>
            <div className="enter pointer-events-auto mt-8 flex flex-wrap items-center gap-3" style={delay(0.55)}>
              <a
                href="#projects"
                className="group inline-flex items-center gap-2 bg-mist px-6 py-3.5 text-sm font-medium text-void transition-colors hover:bg-signal"
              >
                Explore My Work
                <ArrowDownRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" aria-hidden />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center border border-white/25 bg-void/30 px-6 py-3.5 text-sm backdrop-blur-sm transition-colors hover:border-signal hover:text-signal"
              >
                Let&apos;s Connect
              </a>
            </div>
          </div>
        </div>
      </HeroStage>
    </section>
  );
}
