export type CourseShape = "brain" | "shield" | "globe" | "code" | "bell" | "surface" | "tower";

export interface Course {
  id: string;
  title: string;
  /** Describes the subject. Add your own projects, grades or highlights here if you wish. */
  summary: string;
  shape: CourseShape;
}

// The order here is the order visitors scroll through.
export const coursework: Course[] = [
  {
    id: "ai",
    title: "Artificial Intelligence",
    summary: "The study of systems that can learn, reason and support decisions, and the foundation of my interest in intelligent software.",
    shape: "brain",
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity",
    summary: "How systems, data and people are protected from threats, and why security has to be designed in from the start.",
    shape: "shield",
  },
  {
    id: "internet",
    title: "Internet Technologies",
    summary: "The protocols and services that connect computers and carry applications across the web.",
    shape: "globe",
  },
  {
    id: "programming",
    title: "Programming",
    summary: "The craft of turning logic into working software, and the core skill behind everything I build.",
    shape: "code",
  },
  {
    id: "statistics",
    title: "Statistics",
    summary: "Making sense of data, uncertainty and evidence so that decisions rest on more than intuition.",
    shape: "bell",
  },
  {
    id: "calculus",
    title: "Calculus",
    summary: "The mathematics of change, underpinning optimisation and many of the methods used in machine learning.",
    shape: "surface",
  },
  {
    id: "mobile-networks",
    title: "Mobile Networks",
    summary: "How wireless and cellular systems keep devices connected as people move.",
    shape: "tower",
  },
];
