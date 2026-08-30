"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){useEffect(()=>{console.error(error)},[error]);return <main className="section-space"><div className="container-shell max-w-2xl text-center"><AlertTriangle className="mx-auto size-11 text-primary"/><p className="section-kicker mt-5">Something went wrong</p><h1 className="mt-3 text-4xl font-extrabold">This part of the site hit an unexpected error.</h1><p className="mt-4 leading-7 text-muted-foreground">The error has been contained. You can retry without losing the rest of the site.</p><Button className="mt-7" onClick={reset}>Try again</Button></div></main>}
