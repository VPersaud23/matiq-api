import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DAY_NAMES = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];

function buildWeeklyPlanSchema(days: number, isOpponent: boolean): string {
  return DAY_NAMES.slice(0, days).map((day, i) => {
    const isLast = i === days - 1;
    if (isLast && days > 1) {
      return `      {"day": "${day}", "focus": "<'Rest & Recovery' OR 'Live Wrestling & Match Simulation' — choose based on competition proximity>", "drills": [{"name": "<drill or 'Light stretching or foam rolling'>", "duration": "<e.g. 20 min>", "reps": "<e.g. '${isOpponent ? "Focus on countering their attacks" : "Focus on identified issues"}' or 'Optional'>"}]}`;
    }
    return `      {"day": "${day}", "focus": "<training theme or 'Rest & Recovery'>", "drills": [{"name": "<drill name or 'Light stretching or foam rolling'>", "duration": "<e.g. 10 min>", "reps": "<e.g. 3x10 or 'Optional'>"}]}`;
  }).join(",\n");
}

export async function POST(req: NextRequest) {
  try {
    const { context, focus, weightClass, frames, wrestlerDescription, practiceDays } = await req.json();
    const isOpponent = focus === "opponent";
    const isGeneralPlan = practiceDays === null || practiceDays === undefined;
    const days = isGeneralPlan ? 6 : Math.min(Math.max(parseInt(practiceDays) || 5, 1), 7);
    type VideoFrame = { timestamp: string; data: string };
    const typedFrames: VideoFrame[] = Array.isArray(frames) ? frames : [];
    const hasFrames = typedFrames.length > 0;

    const wrestlerRule = wrestlerDescription
      ? `The video contains two wrestlers. You must analyze ONLY the wrestler matching this description: "${wrestlerDescription}". ` +
        `Identify that wrestler in the first frame by their appearance (singlet color, position, side of mat) and track them through every frame. ` +
        `Every position call — on top, on bottom, shooting, defending — refers exclusively to that wrestler. Never switch to the other wrestler.`
      : `The video may contain two wrestlers. Focus on the wrestler who is the primary performer of the technique being analyzed.`;

    // Structured visual position-reading protocol
    const positionProtocol = `When reading wrestling positions from video frames, follow this exact sequence for each frame before drawing any conclusions:

STEP 1 — Body orientation: For each wrestler, determine their posture independently.
  - Standing upright | Bent at the waist | Sprawled (chest toward mat, hips driving down) | On all fours (referee's position) | On their side | On their back | Turtled (curled, protecting hips)

STEP 2 — Spatial relationship: Determine who is above/behind/in front of whom.
  - Neutral (both standing, tied up) | Top/bottom (one wrestler above the other on the mat) | Behind (chest-to-back) | Attacking through legs | Front headlock position

STEP 3 — Head position: The most important single indicator of who controls a position.
  - Inside head (head between opponent's arms, dominant) | Outside head (head to the outside, exposed) | Head-to-head (forehead contact) | Head buried in chest | Head to the outside of the hip

STEP 4 — Hand and arm control:
  - Inside position (elbows tight, forearms inside) | Outside (elbows flared) | Underhook | Overhook (whizzer) | Collar tie | Wrist control | 2-on-1 (Russian tie) | Double underhooks | Double overhooks | Locked hands | Crossface grip | Tight waist

STEP 5 — Hips and level:
  - Who has lower level (knee past the toe = good penetration) | Hips in (driving through) vs hips back (stalling) | Hip-to-hip contact | Hips away (broken position)

STEP 6 — Name the position using these exact folkstyle terms:
  Neutral: square stance, staggered stance, collar-and-elbow, over-under, double underhooks, 2-on-1, front headlock, single leg (high, low, or on the mat), double leg (level change and drive or sweep single), high crotch
  Top: tight waist, crossface-near-arm, near-arm-far-leg, legs in (hook), running the pipe, turk, leg ride, reverse-half, guillotine
  Bottom: base, flat on belly (broken down), referee's position, stand-up attempt, hip heist, granby roll, switch, inside trip from bottom

Only name a position after completing all 6 steps visually. Never guess a position name — if unclear, describe what you literally see. Be specific: say "lost inside hand control, opponent has right underhook and is driving head to the outside" not "bad position".`;

    const systemPrompt = isOpponent
      ? `You are an elite folkstyle wrestling analyst with deep knowledge of position, tie-ups, attacks, counters, and defense. ${wrestlerRule}\n\n${positionProtocol}`
      : `You are an elite folkstyle wrestling coach with 20+ years coaching state and national champions. ${wrestlerRule}\n\n${positionProtocol}`;

    const frameInstruction = hasFrames
      ? `You have been given ${typedFrames.length} frames sampled evenly across the video, each labeled with its exact timestamp. ` +
        `Use what you actually observe in the frames to inform your analysis. ` +
        `Describe positions precisely using the positional vocabulary from your instructions. ` +
        `Always use the labeled timestamps — do not invent timestamps. ` +
        `Each strength and each issue must reference a different timestamp — never reuse the same timestamp across strengths and issues.`
      : `No video provided — generate a plausible analysis based on context alone.`;

    const weeklyPlanSchema = buildWeeklyPlanSchema(days, isOpponent);
    const restRules = days >= 6
      ? `Include at least 2 rest days spread through the plan (not back-to-back training days more than 2 in a row). Mark rest days as {"day": "Day X", "focus": "Rest & Recovery", "drills": [{"name": "Light stretching or foam rolling", "duration": "15 min", "reps": "Optional"}]}.`
      : days >= 4
      ? `Include 1 rest day placed after the heaviest training day. Mark it as {"day": "Day X", "focus": "Rest & Recovery", "drills": [{"name": "Light stretching or foam rolling", "duration": "15 min", "reps": "Optional"}]}.`
      : days >= 2
      ? `If any day is heavy drilling or live wrestling, the following day should be lighter (technique walk-through or rest). No two max-effort days back to back.`
      : ``;

    const daysNote = isGeneralPlan
      ? `This is a general ongoing training plan — no match is imminent. Build volume, introduce new techniques, and develop long-term habits across ${days} days. ${restRules}`
      : days === 1
      ? `This is a 1-day plan — make it a focused pre-match sharpening session, not heavy drilling. No live wrestling.`
      : days <= 3
      ? `This is a ${days}-day competition-prep plan — the athlete is close to match day. Keep volume low, sharpen execution. The final day should be complete rest or very light movement only. ${restRules}`
      : `This is a ${days}-day plan — balance drilling, technique work, and live wrestling. ${restRules}`;

    const userPrompt = isOpponent
      ? `Context: ${context || "Analyze a typical wrestler"}${weightClass ? ` | Weight class: ${weightClass} lbs` : ""}

${frameInstruction}

Identify the technique being performed, scout this wrestler's weaknesses using precise positional language, and build a counter game plan.

${daysNote}

Return ONLY this JSON (no markdown):
{
  "technique": "<identified technique name>",
  "wrestlerIdentified": "<describe the specific wrestler you are analyzing, e.g. 'wrestler in blue singlet on the left'>",
  "overallScore": <integer 0-100, their skill level>,
  "summary": "<2-sentence scouting assessment — threat level and where they're beatable>",
  "strengths": [
    {"label": "<short label>", "detail": "<what they do well — use precise positional terms, 2 sentences>", "timestamp": "<e.g. '0:05'>"},
    {"label": "<short label>", "detail": "<what they do well — use precise positional terms, 2 sentences>", "timestamp": "<e.g. '0:20'>"}
  ],
  "issues": [
    {"severity": "<high|medium|low>", "label": "<exploitable weakness>", "detail": "<how to exploit this — name the specific counter or tie-up, 2-3 sentences>", "timestamp": "<e.g. '0:03'>"}
  ],
  "practicePlan": {
    "focusArea": "<1 sentence: what to train to beat this opponent>",
    "matchReadiness": <integer 0-100>,
    "weeklyPlan": [
${weeklyPlanSchema}
    ],
    "liveWrestling": "<specific live wrestling instruction tailored to beating this opponent>"
  }
}`
      : `Context: ${context || "Analyze a wrestler's technique"}${weightClass ? ` | Weight class: ${weightClass} lbs` : ""}

${frameInstruction}

Identify the technique being performed, assess it using precise positional language, and build a personalized practice plan to fix the issues found.

${daysNote}

Return ONLY this JSON (no markdown):
{
  "technique": "<identified technique name>",
  "wrestlerIdentified": "<describe the specific wrestler you are analyzing, e.g. 'wrestler in red singlet on the right'>",
  "overallScore": <integer 0-100>,
  "summary": "<2-sentence assessment speaking directly to the wrestler>",
  "strengths": [
    {"label": "<short label>", "detail": "<what they did well — use precise positional terms, speak to the wrestler directly, 2 sentences>", "timestamp": "<e.g. '0:05'>"},
    {"label": "<short label>", "detail": "<what they did well — use precise positional terms, speak to the wrestler directly, 2 sentences>", "timestamp": "<e.g. '0:20'>"}
  ],
  "issues": [
    {"severity": "<high|medium|low>", "label": "<short label>", "detail": "<specific correction with coaching cue — name the exact position or tie-up to fix, speak to the wrestler directly, 2-3 sentences>", "timestamp": "<e.g. '0:03'>"}
  ],
  "practicePlan": {
    "focusArea": "<1 sentence: the #1 positional or technical thing this wrestler needs to work on>",
    "matchReadiness": <integer 0-100>,
    "weeklyPlan": [
${weeklyPlanSchema}
    ],
    "liveWrestling": "<specific live wrestling instruction to reinforce what was practiced>"
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
      if (wrestlerDescription) {
        content.push({ type: "text", text:
          `WRESTLER TO ANALYZE: "${wrestlerDescription}"\n` +
          `Identify this wrestler in the FIRST frame by their singlet color, side of the mat, or position. ` +
          `Lock in that identification before viewing any other frame and track that same wrestler consistently through every frame that follows. ` +
          `Do not switch to the other wrestler at any point.`
        });
      }
      content.push({ type: "text", text: `Here are ${typedFrames.length} frames sampled evenly from the wrestling video. Each frame is labeled with its exact timestamp — use these timestamps when referencing issues or strengths:` });
      for (const frame of typedFrames) {
        content.push({ type: "text", text: `Frame at ${frame.timestamp}:` });
        content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: frame.data } });
      }
      content.push({ type: "text", text:
        `Before writing the JSON, silently work through the 6-step position-reading protocol for each frame above. ` +
        `Identify body orientation, spatial relationship, head position, hand control, hip/level, then name the position. ` +
        `Use those readings to drive every position call, timestamp, and coaching cue in the JSON. ` +
        `Do not produce the JSON until you have read every frame this way.`
      });
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
