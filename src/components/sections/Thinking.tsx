import { Object3D } from "@/components/ui/Object3D";
import { thinking } from "@/content/thinking";
import type { ModelName } from "@/three/modelNames";

const THEME_MODELS: ModelName[] = ["temple", "cap", "links", "tower", "globe"];

export function Thinking() {
  return (
    <section aria-labelledby="thinking-title" className="section border-t border-line bg-mist text-void">
      <div className="shell">
        <p data-reveal className="eyebrow !text-[#465160]">Thinking &amp; innovation</p>
        <h2 id="thinking-title" data-reveal className="display mt-7 max-w-6xl text-[clamp(2.75rem,7vw,7.5rem)]">{thinking.headline}</h2>
        <div className="mt-16 grid gap-10 lg:mt-24 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p data-reveal className="text-lg leading-relaxed text-[#39424e]">{thinking.intro}</p>
            <Object3D name="knot" className="mt-6 h-56 lg:sticky lg:top-28 lg:h-72" />
          </div>
          <ol className="border-t border-void/20 lg:col-span-8 lg:col-start-5">
            {thinking.themes.map((theme, index) => (
              <li key={theme.title} data-reveal className="grid gap-3 border-b border-void/20 py-6 md:grid-cols-[5.5rem_1fr_1fr] md:items-center md:gap-6">
                <div className="flex items-center gap-3 md:block">
                  <Object3D name={THEME_MODELS[index % THEME_MODELS.length]} className="h-20 w-20 shrink-0" />
                  <span className="font-mono text-xs text-[#465160]">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="display text-2xl md:text-3xl">{theme.title}</h3>
                <p className="leading-relaxed text-[#39424e]">{theme.note}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
