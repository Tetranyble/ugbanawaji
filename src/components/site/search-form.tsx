"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/components/site/analytics-tracker";
export function SearchForm({initialQuery="",placeholder,ariaLabel,buttonLabel}:{initialQuery?:string;placeholder:string;ariaLabel:string;buttonLabel:string}){const [q,setQ]=useState(initialQuery);const router=useRouter();return <form className="flex gap-2" onSubmit={(e)=>{e.preventDefault();const value=q.trim();if(value.length<2)return;trackEvent("site_search",{query:value});router.push(`/search?q=${encodeURIComponent(value)}`)}}><Input value={q} onChange={e=>setQ(e.target.value)} placeholder={placeholder} aria-label={ariaLabel}/><Button type="submit"><Search className="size-4"/> {buttonLabel}</Button></form>}
