import type { ExpertiseArea } from "./types";

// Areas of work and exposure, not claims of mastery. Edit freely as your experience grows.
export const expertise: ExpertiseArea[] = [
  {
    id: "mobile",
    number: "01",
    title: "Mobile Development",
    summary: "Cross-platform applications and local-first application architecture.",
    technologies: ["Flutter", "Dart", "Cross-platform", "Local-first"],
  },
  {
    id: "backend",
    number: "02",
    title: "Backend Engineering",
    summary: "REST APIs and database-driven systems.",
    technologies: ["C#", ".NET", "Python", "FastAPI", "REST APIs"],
  },
  {
    id: "ai",
    number: "03",
    title: "Artificial Intelligence",
    summary: "Retrieval-augmented generation, conversational AI and LLM integration.",
    technologies: ["LangChain", "RAG", "Conversational AI", "LLM integration"],
  },
  {
    id: "cloud",
    number: "04",
    title: "Cloud & Infrastructure",
    summary: "Automated media pipelines and cloud integrations.",
    technologies: ["Google Cloud Storage", "AWS S3", "Media pipelines"],
  },
  {
    id: "data",
    number: "05",
    title: "Data & Systems",
    summary: "Data storage and system integration.",
    technologies: ["PostgreSQL", "Hive", "Firebase", "JSON"],
  },
];
