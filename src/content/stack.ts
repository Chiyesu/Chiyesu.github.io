export interface StackNode {
  id: string;
  label: string;
  area: string;
  /** How the tool is used. Keep this to what you can stand behind in an interview. */
  usage: string;
  /** Project slugs from projects.ts. Projects sharing a tool also get a cross-link in the 3D network. */
  usedIn: string[];
  /** Why the story moves on to the next node. */
  linkToNext: string;
}

// The order here is the order visitors scroll through.
export const stack: StackNode[] = [
  {
    id: "flutter",
    label: "Flutter & Dart",
    area: "Mobile",
    usage: "I build cross-platform mobile applications with Flutter and Dart, including Zitfuse. Alterra is planned on the same foundation.",
    usedIn: ["zitfuse", "alterra"],
    linkToNext: "Mobile apps need somewhere to keep data on the device.",
  },
  {
    id: "hive",
    label: "Hive",
    area: "Data",
    usage: "Hive handles local data management in Zitfuse and is the planned storage layer for Alterra, supporting a local-first approach.",
    usedIn: ["zitfuse", "alterra"],
    linkToNext: "Local storage opens the wider question of how application data is managed.",
  },
  {
    id: "firebase",
    label: "Firebase",
    area: "Data",
    usage: "Firebase is part of my data and systems toolkit, alongside local and relational storage.",
    usedIn: [],
    linkToNext: "From application data to structured, relational data.",
  },
  {
    id: "postgresql",
    label: "PostgreSQL",
    area: "Data",
    usage: "PostgreSQL is my relational database for database-driven systems.",
    usedIn: [],
    linkToNext: "Databases become useful through the services built around them.",
  },
  {
    id: "dotnet",
    label: "C# & .NET",
    area: "Backend",
    usage: "I use C# and .NET for backend engineering, working on REST APIs and database-driven systems.",
    usedIn: [],
    linkToNext: "The same API thinking carries across into Python.",
  },
  {
    id: "python",
    label: "Python",
    area: "Backend",
    usage: "Python drives the automation in my educational media pipeline and the backend of the CBU AI chatbot.",
    usedIn: ["media-pipeline", "cbu-ai-chatbot"],
    linkToNext: "For the chatbot, Python services are exposed through an API.",
  },
  {
    id: "fastapi",
    label: "FastAPI",
    area: "Backend",
    usage: "FastAPI provides the API layer of the CBU AI Academic & Administrative Chatbot.",
    usedIn: ["cbu-ai-chatbot"],
    linkToNext: "Behind that API sits the AI orchestration.",
  },
  {
    id: "langchain",
    label: "LangChain",
    area: "AI",
    usage: "LangChain supports the chatbot, whose architecture explores an orchestrator coordinating specialised agents.",
    usedIn: ["cbu-ai-chatbot"],
    linkToNext: "Agents need trusted knowledge to answer from.",
  },
  {
    id: "rag",
    label: "RAG",
    area: "AI",
    usage: "Retrieval-augmented generation grounds the chatbot's responses in institutional documentation.",
    usedIn: ["cbu-ai-chatbot"],
    linkToNext: "Retrieved context is handed to a language model.",
  },
  {
    id: "ollama",
    label: "Ollama",
    area: "AI",
    usage: "Ollama serves the language model behind the CBU AI chatbot.",
    usedIn: ["cbu-ai-chatbot"],
    linkToNext: "LLM integration also reaches into my mobile work.",
  },
  {
    id: "gemini",
    label: "Gemini",
    area: "AI",
    usage: "Gemini powers the AI assistance inside the Zitfuse learning platform.",
    usedIn: ["zitfuse"],
    linkToNext: "Zitfuse also depends on media delivered from the cloud.",
  },
  {
    id: "gcs",
    label: "Google Cloud Storage",
    area: "Cloud",
    usage: "Google Cloud Storage supports media in Zitfuse and is a cloud destination in my educational media pipeline.",
    usedIn: ["zitfuse", "media-pipeline"],
    linkToNext: "The media pipeline works across more than one cloud.",
  },
  {
    id: "s3",
    label: "AWS S3",
    area: "Cloud",
    usage: "AWS S3 provides cloud storage in my pipeline for educational video libraries.",
    usedIn: ["media-pipeline"],
    linkToNext: "The video moving through this storage is prepared for streaming.",
  },
  {
    id: "streaming",
    label: "DASH & HLS",
    area: "Delivery",
    usage: "DASH and HLS are the streaming formats my pipeline prepares educational video for, ready for cloud-based delivery.",
    usedIn: ["media-pipeline"],
    linkToNext: "Every layer connected, from the device in someone's hand to the systems behind it.",
  },
];
