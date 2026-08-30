import { ContentCollection } from "@/components/site/content-collection";
export const dynamic="force-dynamic";
export default function PrinciplesPage(){return <ContentCollection type="PRINCIPLE" eyebrow="How I Engineer Systems" title="Principles for building systems that must stay correct when things go wrong." description="Financial correctness, idempotency, auditability, failure isolation, observability, explicit domain boundaries, evidence-grounded AI, compatibility and tests around the invariants that matter."/>}
