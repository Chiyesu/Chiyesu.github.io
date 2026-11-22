/** `null` always means "not provided yet". The UI renders it honestly, never with invented data. */
export type Maybe<T> = T | null;

export type AvailabilityStatus = "open" | "limited" | "unavailable" | "on-request";

export interface SiteConfig {
  name: string;
  role: string;
  /** Used for canonical URLs. Set NEXT_PUBLIC_SITE_URL when deploying. */
  url: string;
  tagline: string;
  intro: string;
  philosophy: string;
  description: string;
  availability: { visible: boolean; status: AvailabilityStatus };
  links: {
    github: Maybe<string>;
    linkedin: Maybe<string>;
    email: Maybe<string>;
    /** Path to a file in /public, for example "/cv.pdf". */
    cv: Maybe<string>;
  };
}

export interface ExpertiseArea {
  id: string;
  number: string;
  title: string;
  summary: string;
  technologies: string[];
}

export type ProjectStatus = "completed" | "in-development" | "prototype" | "concept";
export type ProjectMotif = "commerce" | "learning" | "agents" | "pipeline" | "ledger";

export interface ProjectMedia {
  /** Path in /public, for example "/projects/zitfuse/home.webp". */
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}

export interface Project {
  slug: string;
  number: string;
  title: string;
  category: string;
  /** Leave null until confirmed. No status badge is shown while null. */
  status: Maybe<ProjectStatus>;
  motif: ProjectMotif;
  summary: string;
  overview: string;
  problem: string;
  solution: string;
  contributions: string[];
  technologies: string[];
  approachNote: string;
  architecture: { label: string; detail: string }[];
  media: ProjectMedia[];
  links: { github: Maybe<string>; live: Maybe<string> };
}

export interface YearMonth {
  year: number;
  /** 1 to 12 */
  month: number;
}

export interface ExperienceEntry {
  organisation: string;
  start: YearMonth;
  end: YearMonth;
  role: Maybe<string>;
  responsibilities: string[];
  achievements: string[];
}

export interface ThinkingTheme {
  title: string;
  note: string;
}
