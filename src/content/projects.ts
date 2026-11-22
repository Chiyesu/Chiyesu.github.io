import type { Project, ProjectStatus } from "./types";

export const statusLabels: Record<ProjectStatus, string> = {
  completed: "Completed",
  "in-development": "In development",
  prototype: "Prototype",
  concept: "Concept",
};

/*
 * Set `status` only once confirmed. Add real screenshots to `media`.
 * Add GitHub and live URLs to `links`. Empty values are shown honestly.
 */
export const projects: Project[] = [
  {
    // Built end to end by Mashimbwa. Features come from the public site. Add the stack when ready.
    slug: "electromove",
    number: "01",
    title: "ElectroMove Solutions",
    category: "E-commerce & Logistics",
    status: "completed",
    motif: "commerce",
    summary:
      "An online store and logistics platform helping customers in Zambia buy electronics, in stock or sourced and imported to specification.",
    overview:
      "ElectroMove Solutions connects product sourcing, electronics sales, logistics and engineering services in one website for customers across Zambia.",
    problem: "Customers in Zambia can struggle to find specific electronics locally and to manage importing them.",
    solution:
      "A storefront for products in stock, a request flow for items that need sourcing, and order tracking from supplier to delivery.",
    contributions: [
      "Built the e-commerce platform from concept to deployment",
      "Storefront with categories, search, deals, wishlist and cart",
      "Sourcing request flow for exact models and specifications",
      "Order tracking through to delivery",
    ],
    technologies: [],
    approachNote: "The live site brings the customer journey together, from finding a product to tracking its delivery.",
    architecture: [
      { label: "Storefront", detail: "Product categories, search, deals, wishlist and cart" },
      { label: "Sourcing requests", detail: "Customers request an exact model or specification" },
      { label: "Order tracking", detail: "Follow an order through to delivery" },
      { label: "Support", detail: "Help centre, delivery, returns and warranty information" },
    ],
    media: [],
    links: { github: null, live: "https://electromove.net" },
  },
  {
    slug: "zitfuse",
    number: "02",
    title: "Zitfuse",
    category: "Educational Technology",
    status: null,
    motif: "learning",
    summary:
      "A mobile educational platform designed to improve access to learning resources through digital technology.",
    overview:
      "Zitfuse is a mobile educational platform designed to improve access to learning resources through digital technology.",
    problem: "Learners need dependable, convenient access to educational resources.",
    solution:
      "A mobile application that brings learning resources together, pairing cloud-delivered media with local data management and AI-powered assistance.",
    contributions: [
      "Mobile application development",
      "Cloud media integration",
      "Local data management",
      "AI-powered assistance",
    ],
    technologies: ["Flutter", "Dart", "Hive", "Google Cloud Storage", "Gemini"],
    approachNote: "A Flutter client that combines local storage, cloud media and an AI assistance layer.",
    architecture: [
      { label: "Mobile client", detail: "Flutter and Dart" },
      { label: "Local data", detail: "Hive" },
      { label: "Cloud media", detail: "Google Cloud Storage" },
      { label: "AI assistance", detail: "Gemini" },
    ],
    media: [],
    links: { github: null, live: null },
  },
  {
    slug: "cbu-ai-chatbot",
    number: "03",
    title: "CBU AI Academic & Administrative Chatbot",
    category: "Artificial Intelligence",
    status: null,
    motif: "agents",
    summary:
      "An AI-powered institutional support chatbot designed to provide students with accessible academic and administrative information.",
    overview:
      "An AI-powered institutional support chatbot designed to provide students with accessible academic and administrative information.",
    problem: "Students need accessible answers to academic and administrative questions.",
    solution:
      "A conversational assistant whose responses are grounded in institutional documentation through retrieval-augmented generation.",
    contributions: [],
    technologies: ["Python", "LangChain", "FastAPI", "Ollama", "RAG"],
    approachNote:
      "The architecture explores an orchestrator coordinating specialised agents, alongside retrieval-augmented generation grounded in institutional documentation.",
    architecture: [
      { label: "API layer", detail: "FastAPI" },
      { label: "Orchestrator", detail: "Coordinates specialised agents" },
      { label: "Retrieval", detail: "RAG over institutional documentation" },
      { label: "Language model", detail: "Served through Ollama" },
    ],
    media: [],
    links: { github: null, live: null },
  },
  {
    slug: "media-pipeline",
    number: "04",
    title: "Educational Media Processing Pipeline",
    category: "Cloud Infrastructure & Automation",
    status: null,
    motif: "pipeline",
    summary:
      "An automated media-processing workflow designed to handle educational video libraries, automate conversions and prepare content for cloud-based delivery.",
    overview:
      "An automated media-processing workflow designed to handle educational video libraries, automate conversions and prepare content for cloud-based delivery.",
    problem: "Educational video libraries need to be converted and prepared before they can be delivered from the cloud.",
    solution: "An automated workflow that handles conversion and prepares content for adaptive streaming formats.",
    contributions: [],
    technologies: ["Python", "AWS S3", "Google Cloud Storage", "DASH", "HLS"],
    approachNote: "Python automation moves video from source libraries through conversion into cloud storage.",
    architecture: [
      { label: "Video library", detail: "Educational source media" },
      { label: "Automation", detail: "Python workflow" },
      { label: "Packaging", detail: "DASH and HLS" },
      { label: "Cloud storage", detail: "AWS S3 and Google Cloud Storage" },
    ],
    media: [],
    links: { github: null, live: null },
  },
  {
    slug: "alterra",
    number: "05",
    title: "Alterra",
    category: "Business Planning & Productivity",
    status: "concept",
    motif: "ledger",
    summary:
      "A concept for a lightweight business planning application focused on organising business ideas, startup costs and investment considerations.",
    overview:
      "Alterra is a concept for a lightweight business planning application focused on organising business ideas, startup costs and investment considerations.",
    problem: "Business ideas, startup costs and investment considerations are difficult to keep organised in one place.",
    solution: "A lightweight application concept that gives each of these planning areas a clear structure.",
    contributions: [],
    technologies: ["Flutter", "Dart", "Hive"],
    approachNote: "Planned as a lightweight Flutter application with local storage through Hive.",
    architecture: [
      { label: "Application", detail: "Flutter and Dart" },
      { label: "Planning areas", detail: "Ideas, startup costs, investment" },
      { label: "Local storage", detail: "Hive" },
    ],
    media: [],
    links: { github: null, live: null },
  },
];

export const getProject = (slug: string) => projects.find((project) => project.slug === slug);
