import type { CSSProperties } from "react";
import { Object3D } from "@/components/ui/Object3D";
import { experience } from "@/content/experience";
import type { YearMonth } from "@/content/types";
import type { ModelName } from "@/three/modelNames";

const ROW_MODELS: ModelName[] = ["prism", "helix", "lattice"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const toIndex = ({ year, month }: YearMonth) => year * 12 + month - 1;
const format = ({ year, month }: YearMonth) => `${LONG_MONTHS[month - 1]} ${year}`;
const toDateTime = ({ year, month }: YearMonth) => `${year}-${String(month).padStart(2, "0")}`;

export function Experience() {
  const first = Math.min(...experience.map((entry) => toIndex(entry.start)));
  // End months are inclusive, so the scale runs to the end of the last month.
  const last = Math.max(...experience.map((entry) => toIndex(entry.end))) + 1;
  const span = last - first;
  const ticks = Array.from({ length: Math.floor(span / 3) + 1 }, (_, i) => first + i * 3);

  return (
    <section id="experience" aria-labelledby="experience-title" className="section border-t border-line">
      <div className="shell">
        <p data-reveal className="eyebrow">Experience</p>
        <div className="flex items-center justify-between gap-6">
          <h2 id="experience-title" data-reveal className="display mt-7 text-[clamp(2.75rem,7vw,7rem)]">Where I&apos;ve worked.</h2>
          <Object3D name="gyroscope" className="hidden h-56 w-72 shrink-0 md:block" />
        </div>

        <div aria-hidden className="relative mt-16 hidden h-6 md:ml-[calc(30%+1.25rem)] md:block">
          {ticks.map((tick) => (
            <span key={tick} className="absolute font-mono text-[0.68rem] text-dim" style={{ left: `${((tick - first) / span) * 100}%` }}>
              {MONTHS[tick % 12]} {String(Math.floor(tick / 12)).slice(2)}
            </span>
          ))}
        </div>

        <ol className="mt-10 border-t border-line md:mt-3">
          {experience.map((entry, index) => {
            const left = ((toIndex(entry.start) - first) / span) * 100;
            const width = ((toIndex(entry.end) + 1 - toIndex(entry.start)) / span) * 100;
            return (
              <li key={entry.organisation} data-reveal style={{ "--d": `${index * 0.1}s` } as CSSProperties} className="group grid gap-5 border-b border-line py-8 transition-colors hover:bg-white/[0.025] md:grid-cols-[30%_1fr] md:items-center">
                <div className="flex items-center gap-4 md:pr-6">
                  <Object3D name={ROW_MODELS[index % ROW_MODELS.length]} className="h-16 w-16 shrink-0" />
                  <div>
                    <h3 className="display text-3xl md:text-4xl">{entry.organisation}</h3>
                    <p className="mt-2 font-mono text-xs text-haze">
                      <time dateTime={toDateTime(entry.start)}>{format(entry.start)}</time> – <time dateTime={toDateTime(entry.end)}>{format(entry.end)}</time>
                    </p>
                  </div>
                </div>
                <div>
                  <div aria-hidden className="relative h-px bg-line">
                    <div data-bar className="absolute -top-px h-[3px] bg-signal/80 transition-colors group-hover:bg-signal" style={{ left: `${left}%`, width: `${width}%`, "--d": `${0.2 + index * 0.12}s` } as CSSProperties} />
                  </div>
                  <div className="mt-5 text-haze">
                    {entry.role ? <p className="text-mist">{entry.role}</p> : <p className="pending">Role and responsibilities to be added</p>}
                    {[...entry.responsibilities, ...entry.achievements].length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm">
                        {[...entry.responsibilities, ...entry.achievements].map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
