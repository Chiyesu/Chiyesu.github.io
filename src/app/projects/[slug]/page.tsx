import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { ScrollScope } from "@/components/layout/ScrollScope";
import { ProjectVisual } from "@/components/project/ProjectVisual";
import { StatusBadge } from "@/components/project/StatusBadge";
import { Object3D } from "@/components/ui/Object3D";
import { getProject, projects } from "@/content/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { title: project.title, description: project.summary },
  };
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section data-reveal className="grid gap-4 border-t border-line py-10 md:grid-cols-[14rem_1fr] md:gap-10 md:py-14">
      <h2 className="eyebrow">{label}</h2>
      <div className="max-w-3xl text-lg leading-relaxed text-haze md:text-xl">{children}</div>
    </section>
  );
}

function ExternalAction({ label, href }: { label: string; href: string | null }) {
  if (!href) {
    return (
      <span className="flex items-center justify-between gap-8 border border-line px-5 py-4 text-dim">
        {label} <span className="pending">To be added</span>
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-8 border border-line px-5 py-4 transition-colors hover:border-signal hover:text-signal"
    >
      {label} <ArrowUpRight size={17} aria-hidden />
    </a>
  );
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];

  return (
    <ScrollScope>
    <article className="pt-28 md:pt-36">
      <header className="shell">
        <Link href="/#projects" className="eyebrow inline-flex items-center gap-2 transition-colors hover:text-signal">
          <ArrowLeft size={14} aria-hidden /> All projects
        </Link>
        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="eyebrow text-signal">Project {project.number}</span>
          <span className="eyebrow">{project.category}</span>
          <StatusBadge status={project.status} />
        </div>
        <h1 className="display mt-6 max-w-5xl text-[clamp(2.75rem,7vw,6.5rem)]">{project.title}</h1>
        <p className="mt-7 max-w-3xl text-lg leading-relaxed text-haze md:text-xl">{project.summary}</p>
      </header>

      <div className="shell mt-14">
        <ViewTransition name={`project-visual-${project.slug}`}>
          <div className="project-visual aspect-[4/3] overflow-hidden border border-line bg-carbon md:aspect-[21/9]">
            <Object3D name={project.motif} className="h-full w-full" fallback={<ProjectVisual motif={project.motif} />} />
          </div>
        </ViewTransition>
        <p className="pending mt-3">Abstract 3D illustration of the project, not a product screenshot.</p>
      </div>

      <div className="shell mt-16">
        <Block label="Overview">
          <p>{project.overview}</p>
        </Block>
        <Block label="The problem">
          <p>{project.problem}</p>
        </Block>
        <Block label="Proposed solution">
          <p>{project.solution}</p>
        </Block>
        <Block label="My contributions">
          {project.contributions.length > 0 ? (
            <ul className="space-y-2">
              {project.contributions.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-3.5 h-px w-4 shrink-0 bg-signal" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="pending">To be added</p>
          )}
        </Block>
        <Block label="Technologies">
          {project.technologies.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <li key={tech} className="border border-line px-3 py-1.5 font-mono text-sm text-mist">
                  {tech}
                </li>
              ))}
            </ul>
          ) : (
            <p className="pending">To be added</p>
          )}
        </Block>
        <Block label="Technical approach">
          <p>{project.approachNote}</p>
          <ol className="mt-8 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            {project.architecture.map((node, position) => (
              <li key={node.label} className="bg-void p-5">
                <span className="font-mono text-xs text-signal">{String(position + 1).padStart(2, "0")}</span>
                <p className="mt-5 text-base text-mist">{node.label}</p>
                <p className="mt-1 text-sm leading-snug text-dim">{node.detail}</p>
              </li>
            ))}
          </ol>
        </Block>
        <Block label="Screenshots">
          {project.media.length > 0 ? (
            <div className="grid gap-5">
              {project.media.map((item) => (
                <figure key={item.src}>
                  <Image src={item.src} alt={item.alt} width={item.width} height={item.height} className="h-auto w-full" />
                  {item.caption && <figcaption className="pending mt-2">{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          ) : (
            <p className="pending">To be added</p>
          )}
        </Block>
        <Block label="Links">
          <div className="grid gap-3 text-base sm:grid-cols-2">
            <ExternalAction label="GitHub" href={project.links.github} />
            <ExternalAction label="Live site" href={project.links.live} />
          </div>
        </Block>
      </div>

      <Link href={`/projects/${next.slug}`} className="group mt-10 block border-t border-line">
        <div className="shell flex items-end justify-between gap-6 py-16 md:py-24">
          <div>
            <p className="eyebrow">Next project</p>
            <p className="display mt-4 text-4xl transition-colors group-hover:text-signal md:text-6xl">{next.title}</p>
          </div>
          <ArrowRight className="mb-2 shrink-0 transition-transform group-hover:translate-x-2" aria-hidden />
        </div>
      </Link>
    </article>
    </ScrollScope>
  );
}
