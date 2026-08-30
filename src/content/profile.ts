export const profile = {
  siteName: "Ugbanawaji",
  name: "Ekenekiso Ugbanawaji Leonard",
  displayName: "Leonard Ekenekiso",
  location: "Lagos, Nigeria",
  email: "u.ekenekiso@ugbanawaji.com",
  phone: "+234 807 747 1000",
  domain: "https://ugbanawaji.com",
  linkedin: "https://www.linkedin.com/in/ugbanawaji",
  github: "",
  resume: "/Leonard-Ekenekiso-CV.pdf",
  portrait: "/leonard-ekenekiso.jpg",
  eyebrow: "Software Engineering · Fintech Infrastructure · Applied AI",
  headline: "I build resilient financial, platform and AI systems where reliability matters.",
  intro:
    "I work across software engineering, financial infrastructure, cloud platforms and applied AI. Over the past 8+ years, I have built and operated backend systems in banking, payments and enterprise environments, with a focus on reliability, clear architecture and practical delivery.",
  currentFocus:
    "At Boctrust Microfinance Bank, I lead software engineering and IT operations across financial infrastructure and digital transformation. I also founded Tetranyble Labs, where I am building Credense — financial intelligence and decision infrastructure for institutions.",
  metrics: [
    { value: "₦200M+", label: "monthly transaction volume supported" },
    { value: "99.9%", label: "uptime target maintained for core services" },
    { value: "50%", label: "reduction in manual loan recovery workload" },
    { value: "10,000+", label: "users served by prior backend platforms" },
  ],
  specialties: [
    {
      title: "Financial Infrastructure",
      description:
        "Core-banking integrations, payment flows, idempotency, reconciliation, ledger-aware systems and reliability patterns for regulated environments.",
      tags: ["BankOne", "NIBSS", "Stripe Connect", "PCI-DSS", "REST APIs"],
    },
    {
      title: "Backend & Distributed Systems",
      description:
        "Service boundaries, modular architecture, event-driven design, caching, database performance, fault isolation and production observability.",
      tags: ["Java", "Spring Boot", "Laravel", "Kafka", "Redis", "PostgreSQL"],
    },
    {
      title: "Cloud & Platform Engineering",
      description:
        "Production infrastructure, CI/CD, container orchestration, capacity planning, incident response and operational resilience.",
      tags: ["AWS", "Kubernetes", "Docker", "Terraform", "GitHub Actions"],
    },
    {
      title: "Applied AI & Decision Systems",
      description:
        "Designing auditable AI-assisted workflows and decision infrastructure that can integrate with existing financial systems of record.",
      tags: ["AI Agents", "Decision Engines", "Digital Twins", "Auditability"],
    },
  ],
  about: [
    "My foundation is in Electrical / Electronic Engineering, and my software career has grown through building real systems for schools, payments, lending and banking. That background influences how I think: interfaces matter, failure modes matter, capacity matters, and a system is only useful if people can operate it reliably.",
    "I work across Java/Spring Boot and PHP/Laravel backends, relational databases, distributed system patterns, cloud infrastructure and delivery automation. As my scope has expanded, I have also taken responsibility for engineering leadership, IT operations, security reviews, vendor decisions and technology roadmaps.",
    "Today I am also exploring how auditable AI can improve financial decision-making. I am building Credense through Tetranyble Labs around the idea that AI in critical financial workflows should integrate with existing systems, preserve traceability and make its actions reviewable.",
  ],
  stack: ["Java", "Spring Boot", "Laravel", "MySQL", "PostgreSQL", "Redis", "Kafka", "AWS", "Kubernetes", "Docker", "GitHub Actions", "Terraform"],
  contactIntro:
    "I am open to conversations around software engineering, platform and fintech infrastructure, technical leadership, applied AI, and selected product collaborations.",
  education: {
    degree: "B.Tech, Electrical / Electronic Engineering",
    school: "Rivers State University of Science and Technology",
    year: "2019",
    certification: "Microsoft Certified: Azure Fundamentals — 2022",
  },
};

export const fallbackExperiences = [
  {
    id: "boctrust",
    company: "Boctrust Microfinance Bank",
    role: "Technology Lead — Software Engineering & IT Operations",
    location: "Lagos, Nigeria",
    startDate: "Apr 2024",
    endDate: null,
    current: true,
    summary:
      "Leading software engineering, IT operations, digital transformation, cloud infrastructure and technology governance in a regulated banking environment.",
    highlights: [
      "Led BankOne core-banking and NIBSS Direct Debit integrations for automated loan repayment workflows.",
      "Scaled backend services supporting ₦200M+ monthly transaction volume and improved production reliability.",
      "Implemented Kubernetes deployment strategies, observability, incident response and capacity planning for core services.",
      "Defined service boundaries and integration patterns while aligning technology roadmaps with business and regulatory requirements.",
    ],
    sortOrder: 100,
  },
  {
    id: "scnip",
    company: "Scnip Technology",
    role: "Backend Developer",
    location: "Abuja, Nigeria",
    startDate: "Jul 2023",
    endDate: "Apr 2024",
    current: false,
    summary:
      "Built Java/Spring Boot services for payments, subscriptions, user management and workflow automation.",
    highlights: [
      "Built backend services supporting 10,000+ active users.",
      "Integrated Stripe Connect with retry logic, error handling and fault isolation.",
      "Improved API response times through SQL profiling, Redis caching and targeted backend refactoring.",
      "Expanded automated test coverage around critical business workflows.",
    ],
    sortOrder: 90,
  },
  {
    id: "harde-lead",
    company: "Harde Business School",
    role: "Software Engineering Team Lead",
    location: "Lagos, Nigeria",
    startDate: "Jan 2023",
    endDate: "Mar 2024",
    current: false,
    summary:
      "Led backend modernization and engineering delivery across financial operations, reporting, academic administration and internal systems.",
    highlights: [
      "Led migration from a monolith toward modular Spring Boot services.",
      "Led a team of four engineers and standardized sprint planning, code review, testing and documentation practices.",
      "Improved data integrity, auditability and backend performance across business-critical workflows.",
    ],
    sortOrder: 80,
  },
  {
    id: "pensuh",
    company: "Pensuh Innovation",
    role: "Contract Full Stack / Backend Developer",
    location: "Anambra, Nigeria",
    startDate: "Oct 2018",
    endDate: "Dec 2024",
    current: false,
    summary:
      "Built and maintained a multi-tenant school operations platform spanning enrollment, attendance, academic records and tuition payment workflows.",
    highlights: [
      "Designed reusable Laravel backend modules and optimized MySQL schemas for multi-tenant workloads.",
      "Integrated online payments and cloud-backed storage for institutional workflows.",
      "Built systems used across multiple institutions and thousands of student records.",
    ],
    sortOrder: 60,
  },
];

export const fallbackProjects = [
  {
    id: "credense",
    title: "Credense",
    slug: "credense-financial-decision-infrastructure",
    kind: "Founder Project · Applied AI / Fintech",
    lifecycleStatus: "ACTIVE_DEVELOPMENT" as const,
    summary:
      "Financial intelligence and decision infrastructure designed to help institutions use operational and financial data more effectively, automate complex decisions and introduce AI into critical workflows without replacing systems of record.",
    problem:
      "Financial institutions often have valuable operational data spread across core banking, payment, ledger and enterprise systems. The difficult part is not collecting more data; it is turning existing evidence into repeatable, explainable decisions without creating a second uncontrolled source of truth.",
    constraints:
      "The platform must integrate with existing systems of record, keep decision inputs and actions traceable, support deterministic policy enforcement around probabilistic AI, and evolve incrementally without requiring an institution to replace core banking or ledger infrastructure.",
    challenge:
      "AI can improve interpretation and decision support, but critical financial workflows cannot depend on opaque autonomous behavior. The architecture has to preserve auditability, permissions, financial invariants and clear ownership of irreversible actions.",
    solution:
      "Credense is being designed around a Decision Engine, institutional Digital Twins and auditable AI Agents, with modular integration boundaries for existing financial infrastructure. AI can interpret evidence and propose actions while deterministic services retain authority over policy, permissions and final side effects.",
    architecture:
      "A modular decision layer sits above existing systems of record. Connectors normalize evidence from banking, payment and operational systems; the decision layer evaluates policy and AI-assisted reasoning; an execution boundary validates permissions and invariants before any downstream action. Evidence, policy versions and outcomes remain traceable.",
    decisions:
      "PostgreSQL and existing institutional systems remain canonical for business state. AI/search representations are derived. Integration contracts are explicit, decision semantics are typed, and irreversible financial actions stay behind deterministic services rather than being delegated directly to an agent.",
    tradeoffs:
      "This design deliberately gives up some of the apparent simplicity of fully autonomous agents. It adds policy boundaries, audit records and explicit integration contracts, but the additional structure is valuable in regulated workflows where explainability and recovery matter more than maximizing autonomous behavior.",
    implementation:
      "Credense is in active development. Current work focuses on decision semantics, evidence normalization, system-of-record integration boundaries and an auditable agent model. The portfolio intentionally distinguishes architectural direction from production claims.",
    reliabilitySecurity:
      "The architecture is shaped around least-privilege integrations, auditable decision context, deterministic validation before side effects, idempotent integration behavior where retries are possible, and explicit separation between recommendation and execution.",
    impact:
      "The product direction turns firsthand banking, payment, reconciliation and operational experience into reusable decision infrastructure for financial institutions. Quantitative product-impact claims will be added only when they are supported by production evidence.",
    lessonsLearned:
      "Applied AI becomes more useful in critical systems when the architecture makes uncertainty visible. The important boundary is not AI versus no AI; it is probabilistic reasoning versus deterministic authority over invariants and irreversible actions.",
    whatDifferently:
      "As the product matures, I would keep pushing policy/version provenance, evaluation datasets and operational observability earlier into each feature so model quality, policy quality and execution quality can be measured independently.",
    confidentialityNote: "Founder product architecture overview. Unreleased implementation detail is intentionally selective and production claims are avoided while the product is still being built.",
    diagrams: [
      {
        title: "Evidence-grounded decision boundary",
        mermaid: "flowchart LR\n  A[Core banking / payments / operations] --> B[Evidence connectors]\n  B --> C[(Canonical evidence store)]\n  C --> D[Decision Engine]\n  D --> E[AI-assisted reasoning]\n  D --> F[Deterministic policy checks]\n  E --> F\n  F --> G{Authorized action?}\n  G -->|Yes| H[Execution connector]\n  G -->|No / Review| I[Human review]\n  H --> J[Audit trail]\n  I --> J",
      },
    ],
    codeSamples: [
      {
        title: "Representative decision boundary",
        language: "java",
        code: "public record DecisionRequest(Evidence evidence, PolicyVersion policy) {}\n\npublic interface DecisionService {\n    DecisionOutcome evaluate(DecisionRequest request);\n}\n\npublic interface ExecutionPolicy {\n    AuthorizationResult authorize(DecisionOutcome outcome);\n}",
        explanation: "Illustrative portfolio code, not production source. The important idea is that reasoning and execution authorization are separate contracts.",
      },
    ],
    techStack: ["Java", "Spring Boot", "AI Agents", "Decision Engine", "PostgreSQL", "Event-driven Architecture"],
    metrics: [
      { label: "Stage", value: "Building" },
      { label: "Focus", value: "Financial institutions" },
    ],
    featured: true,
    status: "PUBLISHED" as const,
    externalUrl: "https://tetranyble.com",
    repoUrl: null,
    sortOrder: 100,
  },
  {
    id: "boctrust-platform",
    title: "Banking Platform Reliability & Integration",
    slug: "banking-platform-reliability-integration",
    kind: "Production Systems · Banking",
    lifecycleStatus: "PRODUCTION" as const,
    summary:
      "A portfolio-safe case study of core-banking integration, automated loan repayment, platform reliability, observability and deployment modernization in a regulated environment.",
    problem:
      "Loan-repayment and other banking workflows depended on multiple systems and manual operational steps. The engineering problem was to automate more of the flow while preserving the bank's core system as the authoritative source and improving production reliability around external dependencies.",
    constraints:
      "The work operated in a regulated financial environment with existing core-banking contracts, sensitive customer and transaction data, external network dependencies, availability requirements and the need to improve the platform incrementally rather than replace the core system.",
    challenge:
      "Financial workflows depended on multiple internal and external systems, with manual recovery steps, operational risk and reliability constraints.",
    solution:
      "Introduced clearer service boundaries and integration patterns, automated repayment workflows through BankOne and NIBSS, and strengthened deployment, observability, incident response and capacity-planning practices.",
    architecture:
      "Application services own business workflow state while integration boundaries isolate external banking APIs. BankOne remains the core system of record. NIBSS Direct Debit participates through an explicit connector boundary. Operational telemetry and Kubernetes-based deployment practices support production diagnosis and controlled rollout.",
    decisions:
      "Keep the core banking platform authoritative; isolate external APIs behind integration services; make failure states observable rather than hiding them; use controlled deployment and capacity-planning practices so reliability improvements are operational as well as code-level.",
    tradeoffs:
      "Working with existing banking systems means accepting external contracts and operational constraints that cannot simply be redesigned. The architecture therefore favors adapters, incremental modernization and explicit recovery paths over a clean-slate rewrite.",
    implementation:
      "The portfolio-safe implementation view covers BankOne and NIBSS integration work, service-boundary design, production observability, secure architecture review, Kubernetes deployment strategy and capacity planning. Internal endpoints, credentials, customer data and proprietary workflow rules are intentionally omitted.",
    reliabilitySecurity:
      "Reliability work included observability and incident-response improvements, capacity planning, controlled Kubernetes deployment strategies and secure architecture reviews for critical banking APIs. The documented production outcome includes 99.9% uptime for core services.",
    impact:
      "Reduced manual loan-recovery workload by approximately 50%, supported ₦200M+ monthly transaction volume, and maintained 99.9% uptime for core services.",
    lessonsLearned:
      "Integration reliability is a domain concern, not only an HTTP-client concern. Teams need explicit ownership of external failure states, operational evidence and a safe recovery process when a bank or network dependency becomes slow or ambiguous.",
    whatDifferently:
      "I would formalize service-level objectives and integration-specific failure budgets earlier, then connect those directly to capacity planning, alert thresholds and post-incident learning so reliability work is measured consistently across dependencies.",
    confidentialityNote: "Sanitized case study. Proprietary banking implementation details, customer data, credentials, exact internal topology and restricted operational procedures are omitted.",
    diagrams: [
      {
        title: "Sanitized banking integration boundary",
        mermaid: "flowchart LR\n  U[Digital banking / lending workflow] --> A[Application services]\n  A --> B[Integration boundary]\n  B --> C[BankOne core banking]\n  B --> D[NIBSS Direct Debit]\n  A --> E[(Application data)]\n  A --> F[Observability]\n  F --> G[Alerting / incident response]",
      },
    ],
    codeSamples: [
      {
        title: "Representative idempotent integration pattern",
        language: "java",
        code: "public Result execute(Command command, IdempotencyKey key) {\n    return repository.findByKey(key)\n        .map(Result::fromExisting)\n        .orElseGet(() -> persistAndExecute(command, key));\n}",
        explanation: "Illustrative pattern only. It illustrates the kind of duplicate-protection boundary useful around retried financial workflows; it is not copied from an employer repository.",
      },
    ],
    techStack: ["Java", "Spring Boot", "BankOne", "NIBSS", "Kubernetes", "AWS", "PostgreSQL", "Redis"],
    metrics: [
      { label: "Volume", value: "₦200M+ / month" },
      { label: "Uptime", value: "99.9%" },
      { label: "Manual workload", value: "~50% lower" },
    ],
    featured: true,
    status: "PUBLISHED" as const,
    externalUrl: null,
    repoUrl: null,
    sortOrder: 90,
  },
  {
    id: "payments-platform",
    title: "Subscription & Payments Backend",
    slug: "subscription-payments-backend",
    kind: "Backend Engineering · Payments",
    lifecycleStatus: "PRODUCTION" as const,
    summary:
      "Java/Spring Boot services for payments, subscriptions, user management and business workflows, including Stripe Connect integration with retry and fault-isolation patterns.",
    problem:
      "A growing platform needed reliable payment and subscription workflows alongside user and business services. External payment dependencies, database access and high-traffic endpoints had to behave predictably as usage increased.",
    constraints:
      "The system had to integrate an external payment provider, preserve existing business workflows, improve latency without weakening correctness, and increase automated-test coverage while continuing to serve active users.",
    challenge:
      "High-traffic business workflows needed predictable payment behavior, better API latency and stronger failure handling.",
    solution:
      "Built connector services, added retries and fault isolation, optimized SQL access, introduced targeted Redis caching and expanded automated tests around critical paths.",
    architecture:
      "Spring Boot services expose application APIs while payment-specific connector logic isolates Stripe Connect. Relational persistence remains authoritative for business state, Redis is used selectively for high-value cacheable reads, and tests cover critical service and integration behavior.",
    decisions:
      "Keep payment-provider behavior behind a connector boundary, optimize database access before relying on broad caching, use Redis selectively, and add automated tests around business rules most likely to create costly regressions.",
    tradeoffs:
      "Caching can reduce latency but introduces staleness and invalidation concerns, so it was targeted rather than used as a substitute for query optimization. Retry behavior also has to be bounded so transient provider failures do not become duplicate business actions.",
    implementation:
      "The documented work includes Java/Spring Boot backend services, Stripe Connect integration with retry/error handling and fault isolation, SQL profiling, Redis caching and expanded automated tests. Private code and internal product details remain excluded.",
    reliabilitySecurity:
      "Payment-connector failure handling separated provider errors from core application behavior. Automated tests strengthened critical workflows, while database profiling and targeted caching improved performance without moving authoritative state out of the relational database.",
    impact:
      "Supported 10,000+ active users, processed documented subscription-payment volume and improved API response times by 35% through SQL profiling, Redis caching and targeted backend refactoring.",
    lessonsLearned:
      "Performance work is most durable when measurement comes first. SQL profiling and clear integration boundaries provide better long-term leverage than adding infrastructure before the actual bottleneck is understood.",
    whatDifferently:
      "I would introduce explicit dependency-level latency and error budgets earlier so performance, provider reliability and application regressions can be compared from the same operational dashboard.",
    confidentialityNote: "Portfolio-safe summary. Private source code, internal product topology and customer data are intentionally omitted.",
    diagrams: [
      {
        title: "Payment connector and performance boundary",
        mermaid: "flowchart LR\n  C[Client] --> API[Spring Boot API]\n  API --> S[Application service]\n  S --> DB[(Relational database)]\n  S --> R[(Redis cache)]\n  S --> P[Payment connector]\n  P --> X[Stripe Connect]\n  S --> T[Automated tests / observability]",
      },
    ],
    codeSamples: [
      {
        title: "Representative provider isolation",
        language: "java",
        code: "public PaymentResult charge(PaymentRequest request) {\n    try {\n        return gateway.charge(request);\n    } catch (TransientGatewayException e) {\n        throw new RetryablePaymentException(e);\n    }\n}",
        explanation: "Illustrative code showing dependency isolation. It is not production source from the original system.",
      },
    ],
    techStack: ["Java", "Spring Boot", "Stripe Connect", "Redis", "SQL", "REST APIs"],
    metrics: [
      { label: "Users", value: "10,000+" },
      { label: "API response", value: "35% faster" },
    ],
    featured: true,
    status: "PUBLISHED" as const,
    externalUrl: null,
    repoUrl: null,
    sortOrder: 80,
  },
];
