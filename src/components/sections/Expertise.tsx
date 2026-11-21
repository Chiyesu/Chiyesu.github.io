import { expertise } from "@/content/expertise";
import { ExpertiseOrbit } from "./ExpertiseOrbit";

export function Expertise() {
  return (
    <section id="expertise" aria-labelledby="expertise-title" data-scene-gate="1" className="relative z-10 bg-carbon">
      <ExpertiseOrbit />
      <noscript>
        <ul className="shell pb-20">
          {expertise.map((area) => (
            <li key={area.id} className="border-t border-line py-5">
              <h3 className="display text-3xl">{area.title}</h3>
              <p className="mt-2 text-haze">{area.summary}</p>
              <p className="mt-2 font-mono text-sm text-dim">{area.technologies.join(", ")}</p>
            </li>
          ))}
        </ul>
      </noscript>
    </section>
  );
}
