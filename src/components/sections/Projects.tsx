import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";
import { ProjectVisual } from "@/components/project/ProjectVisual";
import { StatusBadge } from "@/components/project/StatusBadge";
import { Object3D } from "@/components/ui/Object3D";
import { projects } from "@/content/projects";

export function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-title" className="border-t border-line pt-24 md:pt-40">
      <div className="shell pb-14 md:pb-20">
        <p data-reveal className="eyebrow">The showcase</p>
        <h2 id="projects-title" data-reveal className="display mt-7 max-w-4xl text-[clamp(2.75rem,7vw,7rem)]">
          Selected work.
        </h2>
      </div>
      <div>
        {projects.map((project) => (
          <article key={project.slug} data-stack className="bg-void lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center">
            <div data-stack-card className="shell w-full origin-top py-6 lg:py-0">
              <Link href={`/projects/${project.slug}`} data-cursor="View" className="project-link group grid overflow-hidden border border-line bg-carbon transition-colors hover:border-white/30 lg:h-[82svh] lg:grid-cols-[1.45fr_1fr]">
                <ViewTransition name={`project-visual-${project.slug}`}>
                  <div className="project-visual aspect-[4/3] overflow-hidden border-b border-line lg:aspect-auto lg:h-full lg:min-h-0 lg:border-b-0 lg:border-r">
                    <Object3D name={project.motif} className="h-full w-full" fallback={<ProjectVisual motif={project.motif} />} />
                  </div>
                </ViewTransition>
                <div className="flex flex-col justify-between gap-10 p-6 md:p-10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-sm text-signal">{project.number}</span>
                    <StatusBadge status={project.status} />
                  </div>
                  <div>
                    <p className="eyebrow">{project.category}</p>
                    <h3 className="display mt-4 text-4xl md:text-5xl xl:text-6xl">{project.title}</h3>
                    <p className="mt-5 leading-relaxed text-haze">{project.summary}</p>
                    <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-dim">
                      {project.technologies.map((tech) => <li key={tech}>{tech}</li>)}
                    </ul>
                    <span className="mt-8 inline-flex items-center gap-2 text-sm text-mist transition-colors group-hover:text-signal">
                      View case study
                      <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
