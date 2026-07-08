export interface SocialLink {
  label: string;
  href: string;
}

export interface Profile {
  name: string;
  title: string;
  headline: string;
  location: string;
  intro: string;
  email: string;
  cv: string;
  social: SocialLink[];
}

export const profile: Profile = {
  name: "Carlos Recinos",
  title: "Senior Full-Stack & Applied AI Engineer",
  headline: "Web, mobile, and LLM systems in production.",
  location: "El Salvador · GMT-6 (full US overlap) · English & Spanish",
  intro:
    "9 years shipping for companies in the US, UK, and Latin America. Founder of a bootstrapped product studio where I design, build, and operate revenue-generating SaaS end to end. I build with AI coding agents daily — and own the architecture, review, and testing that keep that speed safe.",
  email: "carlosrecinos1999@gmail.com",
  cv: "/Carlos-Recinos-CV.pdf",
  social: [
    { label: "GitHub", href: "https://github.com/carlosrecinos" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/carlos-recinos-293301192/",
    },
  ],
};

export const howIBuild: { title: string; body: string }[] = [
  {
    title: "AI-augmented by default",
    body: "Claude Code with multi-agent workflows is my daily driver — planning, scaffolding, test generation, refactors.",
  },
  {
    title: "Human-owned quality",
    body: "I review every agent diff, own the architecture decisions, and verify end to end before anything ships. Speed never outruns quality.",
  },
  {
    title: "LLMs in production, not demos",
    body: "WhatsApp agents qualifying real leads with closed-loop ad attribution, LLM ad-campaign generation, AI document extraction — running for paying customers.",
  },
];
