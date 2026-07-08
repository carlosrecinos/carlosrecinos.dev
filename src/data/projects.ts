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
    tagline: "Electronic invoicing SaaS and API",
    description:
      "Mini-ERP integrated with El Salvador's Ministry of Finance to issue legally binding electronic invoices. Offers a public invoicing API used by other products and an AI document reader built on open-source LLMs. $700K+ in transactions processed in production.",
    bullets: [
      "Government API integration with strict signing and schema requirements",
      "Public invoicing API used by other products",
      "Multi-tenant billing and AI extraction pipeline",
    ],
    stack: ["go", "connectrpc/protobuf", "react", "postgresql", "gcp"],
    role: "Founder & Lead Engineer",
    links: [{ label: "turbopyme.com", href: "https://turbopyme.com" }],
  },
  {
    title: "Eloquia + AdMind",
    tagline: "Conversational-AI growth stack",
    description:
      "Multi-tenant WhatsApp agents on the Meta Cloud API that qualify inbound leads and book demos on a live calendar, paired with an LLM-powered Meta ads generator that attributes every ad through the conversation to the closed deal.",
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
      "Multi-tenant point-of-sale for restaurants on web and tablet, with subscription billing and paying customers in production.",
    stack: ["react", "node.js", "postgresql"],
    role: "Founder & Lead Engineer",
    links: [{ label: "e-comanda.com", href: "https://e-comanda.com" }],
  },
  {
    title: "Chalet",
    tagline: "Delivery & ride platform",
    description:
      "Consumer, driver, and restaurant apps with 2,000+ users. Real-time GPS tracking and automatic order assignment through a vehicle-routing optimizer.",
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
    tagline: "Real-time 3D multiplayer soccer in the browser",
    description:
      "11v11 browser soccer with server-authoritative physics, client prediction, and interpolation. Built to explore real-time netcode.",
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
    title: "Edulink",
    description:
      "Learning platform for an English school with Stripe recurring billing and Moodle integration",
    stack: ["typescript", "prisma", "stripe", "docker"],
  },
  {
    title: "RadarMédico",
    description: "Clinic management SaaS",
    stack: ["react", "node"],
  },
  {
    title: "FacturAgua",
    description: "Billing for community water boards",
    stack: ["react", "node"],
  },
  {
    title: "Pérgola",
    description:
      "Management system for a tourism complex: hotel reservations, restaurant and café POS, events, day-passes with prepaid credit, and room charges.",
    stack: ["react", "node", "postgresql"],
  },
  {
    title: "Potrero",
    description: "Farm & paddock management PWA with satellite map drawing",
    stack: ["vite", "leaflet", "fastify"],
  },
];
