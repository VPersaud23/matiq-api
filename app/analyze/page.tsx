"use client";
import { useState, useRef } from "react";

type Step = "upload" | "who" | "opponent" | "loading" | "result";

interface Issue { severity: "high" | "medium" | "low"; label: string; detail: string; timestamp: string; }
interface Drill { name: string; duration: string; reps: string; }
interface DayPlan { day: string; focus: string; drills: Drill[]; }
interface PracticePlan { focusArea: string; matchReadiness: number; weeklyPlan: DayPlan[]; liveWrestling: string; }
interface AnalysisResult { technique: string; overallScore: number; summary: string; issues: Issue[]; practicePlan: PracticePlan; focus: string; }

const SEV_COLOR: Record<string, string> = { high: "var(--red)", medium: "var(--orange)", low: "var(--blue)" };
const DAY_COLORS = ["var(--accent)", "var(--blue)", "var(--orange)", "var(--accent)", "var(--blue)", "var(--muted)"];

export default function AnalyzePage() {
  const [step, setStep] = useState<Step>("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [context, setContext] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [focus, setFocus] = useState<"me" | "opponent" | null>(null);
  const [oppName, setOppName] = useState("");
  const [oppSchool, setOppSchool] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"report" | "plan">("report");
  const fileRef = useRef<HTMLInputElement>(null);

  const runAnalysis = async (selectedFocus: "me" | "opponent", oppDetails?: { name: string; school: string }) => {
    setStep("loading");
    setProgress(10);
    setProgressLabel("Connecting to AI coach...");
    setError("");

    const contextParts: string[] = [];
    if (videoFile) contextParts.push(`Video uploaded: ${videoFile.name}`);
    if (context.trim()) contextParts.push(context.trim());
    if (oppDetails?.name) contextParts.push(`Opponent: ${oppDetails.name}${oppDetails.school ? ` from ${oppDetails.school}` : ""}`);
    if (!contextParts.length) contextParts.push(selectedFocus === "me" ? "Analyze my wrestling technique" : "Scout an opponent wrestler");

    try {
      setProgress(35);
      setProgressLabel("Analyzing technique...");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: contextParts.join(". "), focus: selectedFocus, weightClass }),
      });
      setProgress(75);
      setProgressLabel("Building practice plan...");
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`API error ${res.status}: ${errBody}`);
      }
      const data: AnalysisResult = await res.json();
      setProgress(100);
      setProgressLabel("Done!");
      setResult(data);
      setTimeout(() => { setStep("result"); setActiveTab("report"); }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Error: ${msg}`);
      setStep("upload");
    }
  };

  const handleWho = (who: "me" | "opponent") => {
    setFocus(who);
    if (who === "me") {
      runAnalysis("me");
    } else {
      setStep("opponent");
    }
  };

  const reset = () => {
    setStep("upload"); setFocus(null); setOppName(""); setOppSchool("");
    setVideoFile(null); setContext(""); setResult(null); setProgress(0);
  };

  // ── Loading ──────────────────────────────────────────────────
  if (step === "loading") return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="text-7xl mb-6">🤖</div>
      <h2 className="text-4xl font-black uppercase" style={{ color: "var(--text)" }}>ANALYZING</h2>
      <h2 className="text-4xl font-black uppercase mb-8" style={{ color: "var(--accent)" }}>
        {focus === "opponent" ? "OPPONENT" : "YOUR TECHNIQUE"}
      </h2>
      <div className="w-80 h-2 rounded-full mb-3" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: "var(--accent)" }} />
      </div>
      <p className="text-4xl font-black mb-2" style={{ color: "var(--accent)" }}>{progress}%</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{progressLabel}</p>
    </div>
  );

  // ── Results ──────────────────────────────────────────────────
  if (step === "result" && result) {
    const scoreColor = result.overallScore >= 80 ? "var(--accent)" : result.overallScore >= 65 ? "var(--orange)" : "var(--red)";
    const readinessColor = result.practicePlan.matchReadiness >= 75 ? "var(--accent)" : result.practicePlan.matchReadiness >= 55 ? "var(--orange)" : "var(--red)";
    const isOpp = result.focus === "opponent";

    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button onClick={reset} className="mb-4 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>← New Analysis</button>

        {/* Header */}
        <div className="rounded-2xl p-5 flex items-center gap-4 mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
              {isOpp ? "Scouting Report" : "Technique Report"}
            </p>
            <h2 className="text-xl font-black uppercase" style={{ color: "var(--text)" }}>{result.technique}</h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>{result.summary}</p>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-6xl font-black leading-none" style={{ color: scoreColor }}>{result.overallScore}</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>/ 100</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["report", "plan"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all"
              style={{
                background: activeTab === tab ? "rgba(232,255,58,0.12)" : "var(--card)",
                color: activeTab === tab ? "var(--accent)" : "var(--muted)",
                border: `1px solid ${activeTab === tab ? "var(--accent)" : "var(--border)"}`,
              }}>
              {tab === "report" ? "📋 Issues" : "📅 Practice Plan"}
            </button>
          ))}
        </div>

        {/* Report tab */}
        {activeTab === "report" && (
          <div className="flex flex-col gap-3">
            {result.issues.map((issue, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: SEV_COLOR[issue.severity] }} />
                    <span className="font-black text-sm uppercase" style={{ color: "var(--text)" }}>{issue.label}</span>
                  </div>
                  <span className="text-xs font-black uppercase px-2 py-1 rounded"
                    style={{ background: `${SEV_COLOR[issue.severity]}22`, color: SEV_COLOR[issue.severity] }}>
                    {issue.severity}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{issue.detail}</p>
                <p className="text-xs mt-2" style={{ color: "var(--blue)" }}>📍 Frame {issue.timestamp}</p>
              </div>
            ))}
          </div>
        )}

        {/* Practice plan tab */}
        {activeTab === "plan" && (
          <div>
            {/* Focus + readiness */}
            <div className="flex gap-3 mb-5">
              <div className="flex-1 rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Weekly Focus</p>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: "var(--text)" }}>{result.practicePlan.focusArea}</p>
              </div>
              <div className="rounded-xl p-4 text-center w-28" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Ready</p>
                <p className="text-3xl font-black" style={{ color: readinessColor }}>{result.practicePlan.matchReadiness}%</p>
              </div>
            </div>

            {/* Daily plan */}
            <div className="flex flex-col gap-3 mb-5">
              {result.practicePlan.weeklyPlan.map((day, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <div className="px-4 py-2 flex items-center justify-between"
                    style={{ background: `${DAY_COLORS[i]}18`, borderBottom: "1px solid var(--border)" }}>
                    <span className="font-black text-sm uppercase" style={{ color: DAY_COLORS[i] }}>{day.day}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{day.focus}</span>
                  </div>
                  <div className="p-3 flex flex-col gap-2" style={{ background: "var(--card)" }}>
                    {day.drills.map((drill, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{drill.name}</span>
                        <div className="flex gap-2 text-right">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted)" }}>{drill.duration}</span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${DAY_COLORS[i]}18`, color: DAY_COLORS[i] }}>{drill.reps}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Live wrestling note */}
            <div className="rounded-xl p-4" style={{ background: "rgba(232,255,58,0.06)", border: "1px solid rgba(232,255,58,0.2)" }}>
              <p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: "var(--accent)" }}>🤼 Live Wrestling Note</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{result.practicePlan.liveWrestling}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Who is the wrestler? ─────────────────────────────────────
  if (step === "who") return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <button onClick={() => setStep("upload")} className="mb-8 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>← Back</button>
      <h1 className="text-4xl font-black uppercase leading-tight mb-2" style={{ color: "var(--text)" }}>
        WHO IS THE<br /><span style={{ color: "var(--accent)" }}>FOCUS WRESTLER?</span>
      </h1>
      <p className="text-sm leading-relaxed mb-10" style={{ color: "var(--muted)" }}>
        This shapes the entire report — personal coaching vs. opponent scouting are completely different outputs.
      </p>
      <div className="flex flex-col gap-4">
        <button onClick={() => handleWho("me")}
          className="text-left rounded-2xl p-6 transition-all hover:opacity-90"
          style={{ background: "var(--accent)" }}>
          <p className="text-3xl mb-2">🙋</p>
          <p className="font-black text-lg uppercase" style={{ color: "#0a0a0f" }}>It&apos;s Me</p>
          <p className="text-sm mt-1" style={{ color: "rgba(0,0,0,0.55)" }}>Get coaching feedback + a personalized weekly practice plan</p>
        </button>
        <button onClick={() => handleWho("opponent")}
          className="text-left rounded-2xl p-6 transition-all hover:opacity-90"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-3xl mb-2">🎯</p>
          <p className="font-black text-lg uppercase" style={{ color: "var(--text)" }}>It&apos;s an Opponent</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Scout their weaknesses + get a prep plan to beat them</p>
        </button>
      </div>
    </div>
  );

  // ── Opponent details ─────────────────────────────────────────
  if (step === "opponent") return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <button onClick={() => setStep("who")} className="mb-8 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>← Back</button>
      <h1 className="text-4xl font-black uppercase leading-tight mb-2" style={{ color: "var(--text)" }}>
        OPPONENT<br /><span style={{ color: "var(--accent)" }}>DETAILS</span>
      </h1>
      <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--muted)" }}>Optional — more detail = sharper report.</p>
      <div className="flex flex-col gap-3 mb-8">
        {[
          { label: "Opponent Name", value: oppName, setter: setOppName, placeholder: "e.g. Jake Martinez" },
          { label: "School / Team", value: oppSchool, setter: setOppSchool, placeholder: "e.g. Lincoln High School" },
        ].map(f => (
          <div key={f.label} className="rounded-xl px-4 py-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <label className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>{f.label}</label>
            <input className="w-full bg-transparent text-base mt-1 outline-none py-2" style={{ color: "var(--text)" }}
              placeholder={f.placeholder} value={f.value} onChange={e => f.setter(e.target.value)} />
          </div>
        ))}
      </div>
      <button onClick={() => runAnalysis("opponent", { name: oppName, school: oppSchool })}
        className="w-full py-4 rounded-2xl font-black uppercase tracking-wide transition-all hover:opacity-90"
        style={{ background: "var(--accent)", color: "#0a0a0f" }}>
        Scout & Build Prep Plan →
      </button>
    </div>
  );

  // ── Upload (main form) ───────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-4xl font-black uppercase leading-tight mb-2" style={{ color: "var(--text)" }}>
        UPLOAD<br /><span style={{ color: "var(--accent)" }}>& ANALYZE</span>
      </h1>
      <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--muted)" }}>
        Upload any wrestling clip. Our AI coach will identify the technique, find issues, and build you a full practice plan.
      </p>

      {error && (
        <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: "rgba(255,58,58,0.1)", color: "var(--red)", border: "1px solid rgba(255,58,58,0.2)" }}>
          {error}
        </div>
      )}

      {/* Video upload */}
      <div className="rounded-2xl p-8 text-center mb-4 cursor-pointer transition-all hover:opacity-80"
        style={{ background: "var(--card)", border: `2px dashed ${videoFile ? "var(--accent)" : "var(--border)"}` }}
        onClick={() => fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept="video/*" className="hidden"
          onChange={e => setVideoFile(e.target.files?.[0] || null)} />
        <p className="text-4xl mb-3">{videoFile ? "✅" : "🎥"}</p>
        <p className="font-black text-base uppercase" style={{ color: videoFile ? "var(--accent)" : "var(--text)" }}>
          {videoFile ? videoFile.name : "Upload Wrestling Clip"}
        </p>
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          {videoFile ? "Tap to change" : "MP4, MOV, or any video format"}
        </p>
      </div>

      <p className="text-xs text-center mb-6" style={{ color: "var(--muted)" }}>— or describe the technique in words below —</p>

      {/* Optional context */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="rounded-xl px-4 py-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <label className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>What are you working on? (optional)</label>
          <input className="w-full bg-transparent text-sm mt-1 outline-none py-2" style={{ color: "var(--text)" }}
            placeholder="e.g. My double leg feels slow, I keep getting sprawled on"
            value={context} onChange={e => setContext(e.target.value)} />
        </div>
        <div className="rounded-xl px-4 py-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <label className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Weight Class (optional)</label>
          <input className="w-full bg-transparent text-sm mt-1 outline-none py-2" style={{ color: "var(--text)" }}
            placeholder="e.g. 152" value={weightClass} onChange={e => setWeightClass(e.target.value)} />
        </div>
      </div>

      <button onClick={() => setStep("who")}
        className="w-full py-4 rounded-2xl font-black uppercase tracking-wide text-base transition-all hover:opacity-90"
        style={{ background: "var(--accent)", color: "#0a0a0f" }}>
        Analyze →
      </button>
    </div>
  );
}
