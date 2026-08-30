import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { aiFeedback } from "@/db/schema";
export async function POST(request:Request){try{const body=await request.json() as {messageId?:string;rating?:string;comment?:string};if(!body.messageId||!["HELPFUL","NOT_HELPFUL"].includes(String(body.rating)))return NextResponse.json({ok:false},{status:400});await db.insert(aiFeedback).values({id:randomUUID(),messageId:String(body.messageId),rating:body.rating as "HELPFUL"|"NOT_HELPFUL",comment:String(body.comment??"").slice(0,1000)||null,createdAt:new Date()});return NextResponse.json({ok:true});}catch{return NextResponse.json({ok:true});}}
