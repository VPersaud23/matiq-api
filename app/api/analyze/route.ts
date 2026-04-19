import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { context, focus, weightClass } = await req.json();
    const isOpponent = focus === "opponent";

    const prompt = isOpponent
      ? `You are an elite folkstyle wrestling analyst.

Context: ${context || "Analyze a typical wrestler"}${weightClass ? ` | Weight class: ${weightClass} lbs` : ""}

Note: You will not receive actual video frames. Use the context above to generate a realistic, detailed scouting report. If minimal context is given, generate a plausible analysis for a typical wrestler at that weight class. Always return valid JSON — never decline or ask for more information.

Identify the technique being performed, then scout this wrestler's weaknesses and build a counter game plan.

Return ONLY this JSON (no markdown):
{
  "technique": "<identified or inferred technique name>",
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
      : `You are an elite folkstyle wrestling coach with 20+ years coaching state and national champions.

Context: ${context || "Analyze a wrestler's technique"}${weightClass ? ` | Weight class: ${weightClass} lbs` : ""}

Note: You will not receive actual video frames. Use the context above to generate a realistic, detailed coaching report. If minimal context is given, generate a plausible analysis for a wrestler working on fundamentals. Always return valid JSON — never decline or ask for more information.

Identify the technique being performed, assess it, and build a personalized practice plan to fix the issues found.

Return ONLY this JSON (no markdown):
{
  "technique": "<identified or inferred technique name>",
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

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    let text = (response.content[0] as { text: string }).text.trim();
    if (text.includes("```")) {
      text = text.split("```")[1].replace(/^json\n?/, "").trim();
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
