import type { AvailabilityStatus, SiteConfig } from "./types";

export const site: SiteConfig = {
  name: "Mashimbwa Chiyesu",
  role: "Software Developer",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "Building ideas into meaningful digital solutions.",
  intro:
    "I design and develop digital experiences, intelligent systems and software solutions that connect people, processes and ideas.",
  philosophy:
    "I believe good software goes beyond functionality. It should solve the right problem, create meaningful value and be built with the future in mind.",
  description:
    "Mashimbwa Chiyesu is a software developer working across mobile development, backend systems, artificial intelligence, cloud infrastructure and digital transformation.",
  // Change `status` to "open", "limited" or "unavailable", or set `visible` to false.
  availability: { visible: true, status: "on-request" },
  // Replace each null with your real value. Empty links render as "To be added".
  links: {
    github: "https://github.com/Chiyesu",
    linkedin: null,
    email: null,
    cv: null,
  },
};

export const availabilityLabels: Record<AvailabilityStatus, string> = {
  open: "Open to opportunities",
  limited: "Limited availability",
  unavailable: "Not currently available",
  "on-request": "Availability on request",
};

export const navigation = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "expertise", label: "Expertise" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
] as const;

export const about = {
  headline: "More than code. A mindset for building.",
  paragraphs: [
    "I am a Computer Science graduate with an interest in the intersection of technology, innovation and practical problem-solving.",
    "My development journey has exposed me to mobile application development, backend engineering, cloud infrastructure and artificial intelligence.",
    "I enjoy taking ideas from concept to implementation, exploring how different technologies work together and developing solutions that address real-world challenges.",
    "Beyond individual applications, I am particularly interested in how technology can improve larger systems, institutional processes and access to digital services.",
  ],
  interests: [
    "Software Engineering",
    "Mobile Application Development",
    "Backend Development",
    "Artificial Intelligence",
    "Cloud Infrastructure",
    "System Integration",
    "Digital Transformation",
  ],
};

export const contact = {
  headline: "Have an idea worth building?",
  body: "I'm always interested in meaningful projects, interesting collaborations and opportunities to create technology that makes a difference.",
};
