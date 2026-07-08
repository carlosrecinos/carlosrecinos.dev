export interface ProjectLink {
  label: string;
  href: string;
  primary?: boolean;
}

export interface FeaturedProject {
  title: string;
  tagline: string;
  description: string;
  bullets?: string[];
  stack: string[];
  role?: string;
  links?: ProjectLink[];
}

export interface MoreProject {
  title: string;
  description: string;
  stack: string[];
  link?: ProjectLink;
}

export const featured: FeaturedProject[] = [
  {
    title: "TurboPyme",
    tagline: "Electronic invoicing SaaS (compliance-critical)",
    description:
      "Mini-ERP integrated with El Salvador's Ministry of Finance (DTE) API: issues legally binding electronic invoices for businesses, with an AI document reader built on open-source LLMs.",
    bullets: [
      "Government API integration with strict signing and schema requirements",
      "Multi-tenant billing",
      "AI extraction pipeline",
    ],
    stack: ["go", "connectrpc/protobuf", "react", "postgresql", "gcp"],
    role: "Founder & Lead Engineer",
  },
  {
    title: "Eloquia + AdMind",
    tagline: "Conversational-AI growth stack",
    description:
      "Multi-tenant WhatsApp LLM agents (Meta Cloud API, tool use / function calling) that qualify inbound leads and book demos on a live calendar, plus an LLM-powered Meta ads generator with closed-loop click-to-WhatsApp attribution (ad → conversation → deal).",
    stack: [
      "typescript",
      "next.js",
      "prisma",
      "anthropic / gemini / fireworks apis",
    ],
    role: "Founder & Lead Engineer",
  },
  {
    title: "E-Comanda",
    tagline: "Restaurant POS SaaS",
    description:
      "Multi-tenant point-of-sale for restaurants (web + tablet) with subscription billing, in production with paying customers.",
    stack: ["react", "node.js", "postgresql"],
    role: "Founder & Lead Engineer",
    links: [{ label: "e-comanda.com", href: "https://e-comanda.com" }],
  },
  {
    title: "Chalet",
    tagline: "Delivery & ride platform",
    description:
      "Consumer, driver, and restaurant/admin apps with 2,000+ users; real-time GPS tracking and automatic order assignment via a vehicle-routing (VRP) optimizer.",
    stack: [
      "jetpack compose",
      "react native",
      "socket.io",
      "node.js",
      "python or-tools",
    ],
    role: "Founder & Lead Engineer",
  },
  {
    title: "Futsal",
    tagline: "Real-time 3D multiplayer soccer (browser)",
    description:
      "11v11 browser soccer with server-authoritative physics, client prediction and interpolation. Built to explore real-time netcode — playable right now.",
    stack: [
      "colyseus",
      "rapier physics",
      "react three fiber",
      "node.js",
      "vps + ci/cd",
    ],
    links: [
      {
        label: "Play it live",
        href: "https://futsal.chalatech.com",
        primary: true,
      },
    ],
  },
];

export const more: MoreProject[] = [
  {
    title: "RadarMédico",
    description: "Clinic management SaaS",
    stack: ["react", "node"],
  },
  {
    title: "FacturAgua",
    description: "Billing for community water boards",
    stack: ["react", "node"],
    link: { label: "aguaaltavista.vercel.app", href: "https://aguaaltavista.vercel.app" },
  },
  {
    title: "Chalatech Brain",
    description: "Internal ops platform: knowledge, tasks, business dashboards",
    stack: ["nestjs", "postgres", "react"],
  },
  {
    title: "Pérgola",
    description: "POS for a tourism center",
    stack: ["react", "node"],
  },
  {
    title: "Potrero",
    description: "Farm & paddock management PWA with satellite map drawing",
    stack: ["vite", "leaflet", "fastify"],
  },
  {
    title: "Aprender",
    description: "Language-learning app with FSRS spaced repetition + LLM story generation",
    stack: ["expo", "fastify", "gemini"],
  },
];
