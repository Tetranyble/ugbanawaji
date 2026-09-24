import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiConversations, aiMessages } from "@/db/schema";
import { answerFromPortfolio } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { getSitePage } from "@/lib/data";
import { itemValue } from "@/lib/page-content";

function sessionHash(value:string){return createHash("sha256").update(`${value}|${env.appKey||"ask"}`).digest("hex");}
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request:Request){
  const conversationId=new URL(request.url).searchParams.get("conversationId")??"";
  if(!uuidPattern.test(conversationId))return NextResponse.json({error:"Invalid conversation reference."},{status:400});
  try{
    const[conversation]=await db.select({id:aiConversations.id}).from(aiConversations).where(eq(aiConversations.id,conversationId)).limit(1);
    if(!conversation)return NextResponse.json({error:"Conversation not found."},{status:404});
    const messages=await db.select({id:aiMessages.id,role:aiMessages.role,content:aiMessages.content,citations:aiMessages.citations}).from(aiMessages).where(eq(aiMessages.conversationId,conversationId)).orderBy(desc(aiMessages.createdAt)).limit(50).then(rows=>rows.reverse());
    return NextResponse.json({conversationId,messages:messages.map(message=>({id:message.id,role:message.role.toLowerCase(),content:message.content,sources:message.role==="ASSISTANT"?message.citations:undefined,messageId:message.role==="ASSISTANT"?message.id:undefined}))},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){console.error("Loading portfolio conversation failed",error);return NextResponse.json({error:"The conversation could not be loaded."},{status:503});}
}

export async function POST(request:Request){
  const page=await getSitePage("ask");
  const copy=page?.sectionMap.chat;
  try{
    const rate=await checkRateLimit("ask",Number(process.env.AI_MAX_QUESTIONS_PER_HOUR??20),60*60_000);if(!rate.allowed)return NextResponse.json({error:itemValue(copy,"rateLimited")},{status:429});
    const body=await request.json() as {question?:string;sessionId?:string;conversationId?:string};const question=String(body.question??"").trim().slice(0,1200);if(question.length<3)return NextResponse.json({error:itemValue(copy,"invalidQuestion")},{status:400});
    const sh=sessionHash(String(body.sessionId||randomUUID()));let conversationId=String(body.conversationId||"");let history:Array<{role:"USER"|"ASSISTANT";content:string}>=[];
    if(conversationId){const [conversation]=await db.select().from(aiConversations).where(and(eq(aiConversations.id,conversationId),eq(aiConversations.sessionHash,sh))).limit(1);if(!conversation)conversationId="";else history=await db.select({role:aiMessages.role,content:aiMessages.content}).from(aiMessages).where(eq(aiMessages.conversationId,conversationId)).orderBy(desc(aiMessages.createdAt)).limit(Number(process.env.AI_MAX_CONVERSATION_MESSAGES??10)).then(rows=>rows.reverse());}
    const now=new Date();if(!conversationId){conversationId=randomUUID();await db.insert(aiConversations).values({id:conversationId,sessionHash:sh,startedAt:now,updatedAt:now});}
    await db.insert(aiMessages).values({id:randomUUID(),conversationId,role:"USER",content:question,citations:[],grounded:false,createdAt:now});
    const result=await answerFromPortfolio(question,history);const messageId=randomUUID();await db.insert(aiMessages).values({id:messageId,conversationId,role:"ASSISTANT",content:result.answer,citations:result.sources,grounded:result.grounded,createdAt:new Date()});await db.update(aiConversations).set({updatedAt:new Date()}).where(eq(aiConversations.id,conversationId));
    return NextResponse.json({...result,conversationId,messageId});
  }catch(error){console.error("Portfolio assistant failed",error);return NextResponse.json({error:itemValue(copy,"serverUnavailable")},{status:503});}
}
