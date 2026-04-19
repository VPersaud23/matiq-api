import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { context, focus, weightClass, frames } = await req.json();
    const isOpponent = focus === "opponent";
    const hasFrames = Array.isArray(frames) && frames.length > 0;

    const systemPrompt = isOpponent
      ? `You are an elite folkstyle wrestling analyst.`
      : `You are an elite folkstyle wrestling coach with 20+ years coaching state and national champions.`;

    const userPrompt = isOpponent
      ? `Context: ${context || "Analyze a typical wrestler"}${weightClass ? ` | Weight class: ${weightClass} lbs` : ""}

${hasFrames ? `You have been given ${frames.length} frames sampled evenly across the video. Use what you actually observe in the frames to inform your analysis. Reference specific visual details (body position, stance, hand fighting, etc.) when describing issues.` : "No video provided — generate a plausible analysis based on context alone."}

Identify the technique being performed, scout this wrestler's weaknesses, and build a counter game plan.

Return ONLY this JSON (no markdown):
{
  "technique": "<identified technique name>",
  "overallScore": <integer 0-100, their skill level>,
  "summary": "<2-sentence scouting assessment — threat level and where they're beatable>",
  "issues": [
    {"severity": "<high|medium|low>", "label": "<exploitable weakness>", "detail": "<how to exploit this in a match, specific counters, 2-3 sentences>", "timestamp": "<e.g. '0:03'>"}
  ],
  "practicePlan": {
    "focusArea": "<1 sentence: what to train to beat this opponent>",
    "matchReadiness": <integer 0-100>,
    "weeklyPlan": [
      {"day": "Monday", "focus": "<theme>", "drills": [{"name": "<drill>", "duration": "<e.g. 10 min>", "reps": "<e.g. 3x10>"}]},
      {"day": "Tuesday", "focus": "<theme>", "drills": [{"name": "<drill>", "duration": "<e.g. 8 min>", "reps": "<e.g. 5 min>"}]},
      {"day": "Wednesday", "focus": "<theme>", "drills": [{"name": "<drill>", "duration": "<e.g. 10 min>", "reps": "<e.g. 3x8>"}]},
      {"day": "Thursday", "focus": "<theme>", "drills": [{"name": "<drill>", "duration": "<e.g. 6 min>", "reps": "<e.g. 4x5>"}]},
      {"day": "Friday", "focus": "<theme>", "drills": [{"name": "<drill>", "duration": "<e.g. 10 min>", "reps": "<e.g. 5 min>"}]},
      {"day": "Saturday", "focus": "Live Wrestling", "drills": [{"name": "Situational drilling", "duration": "20 min", "reps": "Focus on countering their attacks"}]}
    ],
    "liveWrestling": "<specific live wrestling instruction tailored to beating this opponent>"
  }
}`
      : `Context: ${context || "Analyze a wrestler's technique"}${weightClass ? ` | Weight class: ${weightClass} lbs` : ""}

${hasFrames ? `You have been given ${frames.length} frames sampled evenly across the video. Use what you actually observe in the frames to inform your analysis. Reference specific visual details (body position, stance, level changes, hand position, footwork, etc.) when describing issues and corrections.` : "No video provided — generate a plausible analysis based on context alone."}

Identify the technique being performed, assess it, and build a personalized practice plan to fix the issues found.

Return ONLY this JSON (no markdown):
{
  "technique": "<identified technique name>",
  "overallScore": <integer 0-100>,
  "summary": "<2-sentence assessment speaking directly to the wrestler>",
  "issues": [
    {"severity": "<high|medium|low>", "label": "<short label>", "detail": "<specific correction with coaching cue, speak to the wrestler directly, 2-3 sentences>", "timestamp": "<e.g. '0:03'>"}
  ],
  "practicePlan": {
    "focusArea": "<1 sentence: the #1 thing this wrestler needs to work on>",
    "matchReadiness": <integer 0-100>,
    "weeklyPlan": [
      {"day": "Monday", "focus": "<training theme>", "drills": [{"name": "<drill name>", "duration": "<e.g. 10 min>", "reps": "<e.g. 3x10 each side>"}]},
      {"day": "Tuesday", "focus": "<training theme>", "drills": [{"name": "<drill name>", "duration": "<e.g. 8 min>", "reps": "<e.g. 5 min continuous>"}]},
      {"day": "Wednesday", "focus": "<training theme>", "drills": [{"name": "<drill name>", "duration": "<e.g. 10 min>", "reps": "<e.g. 3x8>"}]},
      {"day": "Thursday", "focus": "<training theme>", "drills": [{"name": "<drill name>", "duration": "<e.g. 6 min>", "reps": "<e.g. 4x5>"}]},
      {"day": "Friday", "focus": "<training theme>", "drills": [{"name": "<drill name>", "duration": "<e.g. 10 min>", "reps": "<e.g. 3x10>"}]},
      {"day": "Saturday", "focus": "Live Wrestling", "drills": [{"name": "Situational drilling", "duration": "20 min", "reps": "Focus on the identified issues in live reps"}]}
    ],
    "liveWrestling": "<specific live wrestling instruction to reinforce what was practiced this week>"
  }
}

Score honestly: 85-100=elite, 70-84=advanced, 55-69=intermediate, 40-54=beginner. List 3-4 issues, high severity first.`;

    type ImageBlock = {
      type: "image";
      source: { type: "base64"; media_type: "image/jpeg"; data: string };
    };
    type TextBlock = { type: "text"; text: string };
    type ContentBlock = ImageBlock | TextBlock;

    const content: ContentBlock[] = [];

    if (hasFrames) {
      content.push({ type: "text", text: `Here are ${frames.length} frames sampled evenly from the wrestling video:` });
      for (const frame of frames as string[]) {
        content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: frame } });
      }
    }

    content.push({ type: "text", text: userPrompt });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    });

    let text = (response.content[0] as { text: string }).text.trim();
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      text = fenceMatch[1].trim();
    } else {
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) text = text.slice(firstBrace, lastBrace + 1);
    }

    const result = JSON.parse(text);
    return NextResponse.json({
      ...result,
      id: crypto.randomUUID(),
      focus,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Analyze error:", msg);
    return NextResponse.json({ error: "Analysis failed", detail: msg }, { status: 500 });
  }
}
