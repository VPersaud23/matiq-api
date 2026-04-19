import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Match {
  opponent: string;
  school: string;
  result: "W" | "L" | "T";
  score: string;
  weightClass: string;
  notes: string;
  date: string;
}

export async function POST(req: NextRequest) {
  try {
    const { matches }: { matches: Match[] } = await req.json();

    if (!matches || matches.length === 0) {
      return NextResponse.json({ error: "No matches provided" }, { status: 400 });
    }

    const matchList = matches
      .map((m, i) =>
        `Match ${i + 1} (${m.date}): ${m.result} vs ${m.opponent}${m.school ? ` (${m.school})` : ""}` +
        `${m.score ? `, score ${m.score}` : ""}${m.weightClass ? `, ${m.weightClass} lbs` : ""}` +
        `${m.notes ? `. Notes: ${m.notes}` : ""}`
      )
      .join("\n");

    const wins = matches.filter(m => m.result === "W").length;
    const losses = matches.filter(m => m.result === "L").length;
    const ties = matches.filter(m => m.result === "T").length;

    const prompt = `You are an elite folkstyle wrestling coach analyzing a wrestler's match history.

Record: ${wins}W - ${losses}L - ${ties}T

Match History:
${matchList}

Analyze patterns across these matches and provide actionable coaching insights.

Return ONLY this JSON (no markdown):
{
  "headline": "<1 short sentence summarizing their season so far>",
  "patterns": [
    {
      "label": "<pattern name, e.g. 'Struggles in close matches'>",
      "detail": "<2-3 sentences explaining the pattern and what it means for their development>",
      "type": "<strength|weakness|trend>"
    }
  ],
  "topFocus": "<The single most important thing to work on based on this match history, 2 sentences>",
  "nextMatchTip": "<1 concrete tactical tip for their next match based on these patterns>"
}

Identify 3-4 patterns. Be honest and specific — generic advice is not helpful.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
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
    return NextResponse.json({ error: "Analysis failed", detail: msg }, { status: 500 });
  }
}
