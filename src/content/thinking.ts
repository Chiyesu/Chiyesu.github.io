import type { ThinkingTheme } from "./types";

export const thinking = {
  headline: "Technology is most powerful when it transforms how things work.",
  intro: "Research interests and open explorations. These are questions I am thinking about, not finished products.",
  themes: [
    {
      title: "AI-powered institutional systems",
      note: "How can AI help institutions make their knowledge easier to reach while staying grounded in trusted sources?",
    },
    {
      title: "Education sector digitisation",
      note: "What does it take to move learning resources and educational processes into digital forms people can actually use?",
    },
    {
      title: "Interoperability and system integration",
      note: "How can separate systems share information so that services work together instead of in isolation?",
    },
    {
      title: "Digital infrastructure",
      note: "Which foundations need to be in place for digital services to be reliable and widely accessible?",
    },
    {
      title: "Technology for local challenges",
      note: "How can solutions begin with local context and the real constraints of the people they serve?",
    },
  ] satisfies ThinkingTheme[],
};
