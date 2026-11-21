import { ArrowUpRight, Download, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { Object3D } from "@/components/ui/Object3D";
import { contact, site } from "@/content/site";

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

interface ContactRow {
  label: string;
  href: string | null;
  icon: ReactNode;
  download?: boolean;
  external?: boolean;
}

export function Contact() {
  const { email, github, linkedin, cv } = site.links;
  const rows: ContactRow[] = [
    { label: "Email", href: email ? `mailto:${email}` : null, icon: <Mail size={18} aria-hidden /> },
    { label: "GitHub", href: github, icon: <GitHubMark />, external: true },
    { label: "LinkedIn", href: linkedin, icon: <LinkedInMark />, external: true },
    { label: "Download CV", href: cv, icon: <Download size={18} aria-hidden />, download: true },
  ];

  return (
    <section id="contact" aria-labelledby="contact-title" className="section relative overflow-hidden">
      <div className="shell relative">
        <p data-reveal className="eyebrow">Contact</p>
        <h2 id="contact-title" data-reveal className="display mt-7 max-w-6xl text-[clamp(3.25rem,10vw,10.5rem)] !leading-[0.95]">
          Have an idea <em className="text-signal">worth building?</em>
        </h2>
        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p data-reveal className="text-lg leading-relaxed text-haze md:text-xl">{contact.body}</p>
            <Object3D name="portal" className="mt-6 h-64 lg:h-72" />
          </div>
          <ul data-reveal className="border-t border-line lg:col-span-7 lg:col-start-6">
            {rows.map(({ label, href, icon, download, external }) => (
              <li key={label} className="border-b border-line">
                {href ? (
                  <a
                    href={href}
                    download={download || undefined}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className="group flex items-center justify-between py-5 text-xl transition-colors hover:text-signal md:text-2xl"
                  >
                    <span className="flex items-center gap-4">{icon}{label}</span>
                    <ArrowUpRight size={20} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </a>
                ) : (
                  <div className="flex items-center justify-between py-5 text-xl text-dim md:text-2xl">
                    <span className="flex items-center gap-4">{icon}{label}</span>
                    <span className="pending">To be added</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
