import { ScrollScope } from "@/components/layout/ScrollScope";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Expertise } from "@/components/sections/Expertise";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Thinking } from "@/components/sections/Thinking";
import { site } from "@/content/site";

export default function HomePage() {
  const sameAs = [site.links.github, site.links.linkedin].filter(Boolean);
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: site.role,
    url: site.url,
    description: site.description,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <ScrollScope>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <About />
      <Expertise />
      <Projects />
      <Experience />
      <Thinking />
      <Contact />
    </ScrollScope>
  );
}
