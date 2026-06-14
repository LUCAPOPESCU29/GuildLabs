import { NextRequest, NextResponse } from "next/server";
import { callGroq, isGroqConfigured, GroqError } from "@/lib/groq";
import { rateLimit, clientIp, sweepExpired, bodyTooLarge } from "@/lib/rate-limit";

export const runtime = "nodejs";

const SYSTEM = `You are Maven, the GuildLabs community assistant in a Discord-style chat.
Answer the user's question concisely and helpfully (2-5 sentences, plain text — no markdown headers).
You know about GuildLabs' tools: Construct (AI Discord server builder), ChartIt (live stock/crypto charts in Discord), and Maven (community Q&A). Key fact: every GuildLabs tool is completely free and open-source — there are no paid plans, subscriptions, or API keys to buy. Never invent pricing tiers. For general questions, answer normally. If you don't know, say so briefly.`;

// Tiny offline knowledge base so the demo answers even without an AI key.
function fallbackAnswer(q: string): string {
  const s = q.toLowerCase();
  if (/construct|build|server|blueprint/.test(s))
    return "Construct builds a whole Discord server from a description: categories, channels, roles and permissions. Try `/build a crypto trading community` and review the blueprint before deploying.";
  if (/chart|stock|crypto|price|ticker/.test(s))
    return "ChartIt posts live charts in Discord. Try `/chart AAPL` or `/chart BTC-USD` here to see a quote and chart.";
  if (/maven|question|answer|faq/.test(s))
    return "Maven surfaces previously-answered questions in your community so people get instant answers. Ask me anything with `/ask`.";
  if (/price|free|cost|subscription/.test(s))
    return "Everything GuildLabs makes is free and open-source — no subscription, no API keys to buy.";
  return "I'm Maven — I answer questions about GuildLabs (Construct, ChartIt, Maven) and Discord. Add a GROQ_API_KEY for full AI answers, or try `/build`, `/chart`, or `/ask`.";
}

export async function POST(req: NextRequest) {
  sweepExpired();
  const limit = rateLimit(`ask:${clientIp(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ answer: "Slow down a moment — too many questions." });
  }
  if (bodyTooLarge(req, 16_000)) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  const body = await req.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim().slice(0, 500) : "";
  if (!question) {
    return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  }

  if (!isGroqConfigured()) {
    return NextResponse.json({ answer: fallbackAnswer(question), source: "offline" });
  }

  try {
    const answer = await callGroq(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: question },
      ],
      { json: false }
    );
    return NextResponse.json({ answer: answer.trim(), source: "ai" });
  } catch (e) {
    if (e instanceof GroqError) {
      return NextResponse.json({ answer: fallbackAnswer(question), source: "offline" });
    }
    return NextResponse.json({ error: "Couldn't answer right now." }, { status: 502 });
  }
}
