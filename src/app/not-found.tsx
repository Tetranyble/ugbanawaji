import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NotFound(){return <main className="section-space"><div className="container-shell max-w-2xl text-center"><SearchX className="mx-auto size-11 text-primary"/><p className="section-kicker mt-5">404</p><h1 className="mt-3 text-4xl font-extrabold">That page isn’t here.</h1><p className="mt-4 leading-7 text-muted-foreground">The URL may have changed, or the content may not be public. Search the engineering portfolio or return home.</p><div className="mt-7 flex justify-center gap-3"><Button asChild><Link href="/search">Search site</Link></Button><Button asChild variant="outline"><Link href="/">Go home</Link></Button></div></div></main>}
