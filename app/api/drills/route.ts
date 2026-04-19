import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { category, weightClass } = await req.json();

    const prompt = `You are an elite folkstyle wrestling coach. Generate 6 drills for the category: "${category}"${weightClass ? ` for a ${weightClass} lb wrestler` : ""}.

Return ONLY this JSON (no markdown):
{
  "drills": [
    {
      "name": "<drill name>",
      "category": "${category}",
      "difficulty": "<beginner|intermediate|advanced>",
      "duration": "<e.g. 10 min>",
      "reps": "<e.g. 3x10 each side>",
      "description": "<2-3 sentences: what the drill is and how to execute it>",
      "coachingCue": "<1 key coaching tip — the most important thing to focus on>"
    }
  ]
}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    let text = (response.content[0] as { text: string }).text.trim();
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      text = fenceMatch[1].trim();
    } else {
      const first = text.indexOf("{");
      const last = text.lastIndexOf("}");
      if (first !== -1 && last !== -1) text = text.slice(first, last + 1);
    }

    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to generate drills", detail: msg }, { status: 500 });
  }
}
