import { Object3D } from "@/components/ui/Object3D";
import { about, site } from "@/content/site";
import { Coursework } from "./Coursework";
import { StackNetwork } from "./StackNetwork";

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="section relative overflow-clip !pb-0">
      <div aria-hidden data-parallax="14" className="outline-type display pointer-events-none absolute -right-[3vw] top-[12%] select-none whitespace-nowrap text-[25vw]">
        Behind the code
      </div>
      <div className="shell relative">
        <p data-reveal className="eyebrow">Behind the code</p>
        <h2 id="about-title" data-reveal className="display mt-7 max-w-5xl text-[clamp(2.75rem,7vw,7rem)]">
          More than code. <em className="text-signal">A mindset for building.</em>
        </h2>
        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-12">
          <Object3D name="cluster" className="order-first h-64 lg:sticky lg:top-28 lg:order-none lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:h-[26rem]" />
          <div className="space-y-6 text-lg leading-relaxed text-haze lg:col-span-5 lg:col-start-4 lg:row-start-1 md:text-xl">
            {about.paragraphs.map((paragraph, index) => (
              <p key={paragraph} data-reveal className={index === 0 ? "text-mist" : undefined}>{paragraph}</p>
            ))}
          </div>
          <aside data-reveal className="lg:col-span-3 lg:col-start-1 lg:row-start-1">
            <h3 className="eyebrow">Interests</h3>
            <ul className="mt-5 border-t border-line">
              {about.interests.map((interest) => (
                <li key={interest} className="border-b border-line py-2.5 text-sm text-haze">{interest}</li>
              ))}
            </ul>
          </aside>
        </div>
        <blockquote data-reveal className="mt-24 border-l border-signal pl-6 md:ml-[8.33%] md:mt-32 md:pl-10">
          <p className="display max-w-4xl text-3xl !leading-[1.15] md:text-5xl">&ldquo;{site.philosophy}&rdquo;</p>
        </blockquote>
      </div>
      <Coursework />
      <StackNetwork />
    </section>
  );
}
