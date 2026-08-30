import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiConversations, aiMessages } from "@/db/schema";
import { answerFromPortfolio } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

function sessionHash(value:string){return createHash("sha256").update(`${value}|${env.appKey||"ask"}`).digest("hex");}
export async function POST(request:Request){
  try{
    const rate=await checkRateLimit("ask",Number(process.env.AI_MAX_QUESTIONS_PER_HOUR??20),60*60_000);if(!rate.allowed)return NextResponse.json({error:"Question limit reached. Please try again later."},{status:429});
    const body=await request.json() as {question?:string;sessionId?:string;conversationId?:string};const question=String(body.question??"").trim().slice(0,1200);if(question.length<3)return NextResponse.json({error:"Ask a slightly more specific question."},{status:400});
    const sh=sessionHash(String(body.sessionId||randomUUID()));let conversationId=String(body.conversationId||"");let history:Array<{role:"USER"|"ASSISTANT";content:string}>=[];
    if(conversationId){const [conversation]=await db.select().from(aiConversations).where(and(eq(aiConversations.id,conversationId),eq(aiConversations.sessionHash,sh))).limit(1);if(!conversation)conversationId="";else history=await db.select({role:aiMessages.role,content:aiMessages.content}).from(aiMessages).where(eq(aiMessages.conversationId,conversationId)).orderBy(desc(aiMessages.createdAt)).limit(Number(process.env.AI_MAX_CONVERSATION_MESSAGES??10)).then(rows=>rows.reverse());}
    const now=new Date();if(!conversationId){conversationId=randomUUID();await db.insert(aiConversations).values({id:conversationId,sessionHash:sh,startedAt:now,updatedAt:now});}
    await db.insert(aiMessages).values({id:randomUUID(),conversationId,role:"USER",content:question,citations:[],grounded:false,createdAt:now});
    const result=await answerFromPortfolio(question,history);const messageId=randomUUID();await db.insert(aiMessages).values({id:messageId,conversationId,role:"ASSISTANT",content:result.answer,citations:result.sources,grounded:result.grounded,createdAt:new Date()});await db.update(aiConversations).set({updatedAt:new Date()}).where(eq(aiConversations.id,conversationId));
    return NextResponse.json({...result,conversationId,messageId});
  }catch(error){console.error("Ask Ugbanawaji failed",error);return NextResponse.json({error:"Ask Ugbanawaji is temporarily unavailable."},{status:503});}
}
