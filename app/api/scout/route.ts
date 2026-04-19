import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { opponentName, school, weightClass } = await req.json();

    const prompt = `You are an elite folkstyle wrestling analyst. Generate a realistic scouting report for a high school wrestler.

Wrestler: ${opponentName} | School: ${school} | Weight Class: ${weightClass} lbs

Return ONLY this JSON (no markdown, no extra text):
{
  "record": "<realistic W-L record e.g. '18-4'>",
  "threatLevel": "<high|medium|low>",
  "style": "<e.g. 'Aggressive Leg Attack'>",
  "summary": "<2-3 sentence threat assessment>",
  "tendencies": [
    {"label": "Favorite Takedown", "value": "<specific move>", "usage": <integer 30-80>},
    {"label": "Setup", "value": "<specific setup>", "usage": <integer 40-80>},
    {"label": "Defensive", "value": "<defensive tendency>", "usage": <integer 50-85>},
    {"label": "Top Position", "value": "<top position style>", "usage": <integer 30-70>}
  ],
  "gamePlan": [
    "<specific tactical instruction 1>",
    "<specific tactical instruction 2>",
    "<specific tactical instruction 3>",
    "<specific tactical instruction 4>"
  ]
}

Make it realistic and specific to folkstyle wrestling. Usage values must be plain integers (not strings).`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    let text = (response.content[0] as { text: string }).text.trim();
    if (text.includes("```")) {
      text = text.split("```")[1].replace(/^json\n?/, "").trim();
    }

    const result = JSON.parse(text);
    return NextResponse.json({ ...result, id: crypto.randomUUID(), opponentName, school, weightClass, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Scout report failed" }, { status: 500 });
  }
}
