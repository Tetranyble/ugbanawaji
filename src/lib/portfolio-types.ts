export type PortfolioProfile = {
  id: string;
  siteName: string;
  name: string;
  displayName: string;
  location: string;
  email: string;
  phone: string;
  domain: string;
  linkedin: string;
  github: string;
  resume: string;
  portrait: string;
  eyebrow: string;
  headline: string;
  intro: string;
  currentFocus: string;
  contactIntro: string;
};


export type FocusArea = {
  id: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  tags: string[];
};

export type SkillGroup = {
  id: string;
  title: string;
  sortOrder: number;
  items: string[];
};

export type EducationEntry = {
  id: string;
  type: "EDUCATION" | "CERTIFICATION";
  title: string;
  institution: string | null;
  year: string | null;
  detail: string | null;
  sortOrder: number;
};

export type NavigationItem = {
  id: string;
  placement: "HEADER" | "MOBILE" | "FOOTER" | "HEADER_CTA";
  label: string;
  href: string;
  external: boolean;
  sortOrder: number;
};

export type PublicProject = {
  id: string;
  title: string;
  slug: string;
  kind: string;
  lifecycleStatus: "PRODUCTION" | "ACTIVE_DEVELOPMENT" | "RESEARCH" | "OPEN_SOURCE" | "ARCHIVED";
  summary: string;
  problem: string | null;
  constraints: string | null;
  challenge: string | null;
  solution: string | null;
  architecture: string | null;
  decisions: string | null;
  tradeoffs: string | null;
  implementation: string | null;
  reliabilitySecurity: string | null;
  impact: string | null;
  lessonsLearned: string | null;
  whatDifferently: string | null;
  confidentialityNote: string | null;
  diagrams: Array<{ title: string; mermaid: string }> | null;
  codeSamples: Array<{ title: string; language: string; code: string; explanation?: string }> | null;
  featured: boolean;
  status: "DRAFT" | "PUBLISHED";
  externalUrl: string | null;
  repoUrl: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  techStack: string[];
  metrics: Array<{ label: string; value: string }>;
};

export type PublicExperience = {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  summary: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  highlights: string[];
  impactAreas: string[];
};

export const EMPTY_PROFILE: PortfolioProfile = {
  id: "main",
  siteName: "",
  name: "",
  displayName: "",
  location: "",
  email: "",
  phone: "",
  domain: "http://localhost:3000",
  linkedin: "",
  github: "",
  resume: "",
  portrait: "",
  eyebrow: "",
  headline: "",
  intro: "",
  currentFocus: "",
  contactIntro: "",
};
