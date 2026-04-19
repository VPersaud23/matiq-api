"use client";
import { useState, useEffect } from "react";

interface Match {
  id: string;
  opponent: string;
  school: string;
  result: "W" | "L" | "T";
  score: string;
  weightClass: string;
  notes: string;
  date: string;
}

interface Pattern {
  label: string;
  detail: string;
  type: "strength" | "weakness" | "trend";
}

interface Analysis {
  headline: string;
  patterns: Pattern[];
  topFocus: string;
  nextMatchTip: string;
}

const PATTERN_COLOR: Record<string, string> = {
  strength: "var(--accent)",
  weakness: "var(--red)",
  trend: "var(--blue)",
};

const RESULT_STYLE: Record<string, { bg: string; color: string }> = {
  W: { bg: "rgba(232,255,58,0.12)", color: "var(--accent)" },
  L: { bg: "rgba(255,58,58,0.12)", color: "var(--red)" },
  T: { bg: "rgba(58,143,255,0.12)", color: "var(--blue)" },
};

const STORAGE_KEY = "matiq_matches";

function loadMatches(): Match[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function HistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [opponent, setOpponent] = useState("");
  const [school, setSchool] = useState("");
  const [result, setResult] = useState<"W" | "L" | "T">("W");
  const [score, setScore] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => { setMatches(loadMatches()); }, []);

  const saveMatch = () => {
    if (!opponent.trim()) return;
    const newMatch: Match = {
      id: crypto.randomUUID(),
      opponent: opponent.trim(),
      school: school.trim(),
      result,
      score: score.trim(),
      weightClass: weightClass.trim(),
      notes: notes.trim(),
      date,
    };
    const updated = [newMatch, ...matches];
    setMatches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setOpponent(""); setSchool(""); setScore(""); setNotes(""); setResult("W");
    setDate(new Date().toISOString().split("T")[0]);
    setShowForm(false);
    setAnalysis(null);
  };

  const deleteMatch = (id: string) => {
    const updated = matches.filter(m => m.id !== id);
    setMatches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setAnalysis(null);
  };

  const analyzePatterns = async () => {
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setAnalysis(await res.json());
    } catch {
      setAnalysisError("Analysis failed. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const wins = matches.filter(m => m.result === "W").length;
  const losses = matches.filter(m => m.result === "L").length;
  const ties = matches.filter(m => m.result === "T").length;
  const winPct = matches.length ? Math.round((wins / matches.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-4xl font-black uppercase leading-tight" style={{ color: "var(--text)" }}>
          MATCH<br /><span style={{ color: "var(--accent)" }}>HISTORY</span>
        </h1>
        <button onClick={() => setShowForm(v => !v)}
          className="mt-1 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wide transition-all hover:opacity-90"
          style={{ background: "var(--accent)", color: "#0a0a0f" }}>
          {showForm ? "Cancel" : "+ Log Match"}
        </button>
      </div>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted)" }}>
        Track every match. AI identifies patterns across your season.
      </p>

      {/* Log form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--card)", border: "1px solid var(--accent)" }}>
          <p className="font-black text-sm uppercase tracking-wide mb-4" style={{ color: "var(--accent)" }}>New Match</p>
          <div className="flex flex-col gap-3">
            {/* Result buttons */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Result</p>
              <div className="flex gap-2">
                {(["W", "L", "T"] as const).map(r => (
                  <button key={r} onClick={() => setResult(r)}
                    className="flex-1 py-2 rounded-xl font-black text-sm uppercase transition-all"
                    style={{
                      background: result === r ? RESULT_STYLE[r].bg : "transparent",
                      color: result === r ? RESULT_STYLE[r].color : "var(--muted)",
                      border: `1px solid ${result === r ? RESULT_STYLE[r].color : "var(--border)"}`,
                    }}>
                    {r === "W" ? "Win" : r === "L" ? "Loss" : "Tie"}
                  </button>
                ))}
              </div>
            </div>
            {[
              { label: "Opponent Name *", value: opponent, set: setOpponent, placeholder: "e.g. Jake Martinez" },
              { label: "School / Team", value: school, set: setSchool, placeholder: "e.g. Lincoln High" },
              { label: "Score", value: score, set: setScore, placeholder: "e.g. 8-3" },
              { label: "Weight Class", value: weightClass, set: setWeightClass, placeholder: "e.g. 152" },
            ].map(f => (
              <div key={f.label} className="rounded-xl px-4 py-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <label className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>{f.label}</label>
                <input className="w-full bg-transparent text-sm mt-1 outline-none py-1" style={{ color: "var(--text)" }}
                  placeholder={f.placeholder} value={f.value} onChange={e => f.set(e.target.value)} />
              </div>
            ))}
            <div className="rounded-xl px-4 py-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Date</label>
              <input type="date" className="w-full bg-transparent text-sm mt-1 outline-none py-1" style={{ color: "var(--text)", colorScheme: "dark" }}
                value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="rounded-xl px-4 py-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Notes (optional)</label>
              <input className="w-full bg-transparent text-sm mt-1 outline-none py-1" style={{ color: "var(--text)" }}
                placeholder="e.g. Gave up two legs in first period" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <button onClick={saveMatch} disabled={!opponent.trim()}
              className="w-full py-3 rounded-xl font-black uppercase tracking-wide transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#0a0a0f" }}>
              Save Match
            </button>
          </div>
        </div>
      )}

      {/* Stats bar */}
      {matches.length > 0 && (
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex gap-4 flex-1">
            {[
              { label: "Wins", value: wins, color: "var(--accent)" },
              { label: "Losses", value: losses, color: "var(--red)" },
              { label: "Ties", value: ties, color: "var(--blue)" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center px-4 border-l" style={{ borderColor: "var(--border)" }}>
            <p className="text-2xl font-black" style={{ color: winPct >= 60 ? "var(--accent)" : winPct >= 40 ? "var(--orange)" : "var(--red)" }}>{winPct}%</p>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Win Rate</p>
          </div>
          {matches.length >= 3 && (
            <button onClick={analyzePatterns} disabled={analyzing}
              className="px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
              style={{ background: "rgba(232,255,58,0.12)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
              {analyzing ? "..." : "🤖 Analyze"}
            </button>
          )}
        </div>
      )}

      {/* AI Analysis */}
      {analysisError && (
        <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: "rgba(255,58,58,0.1)", color: "var(--red)", border: "1px solid rgba(255,58,58,0.2)" }}>
          {analysisError}
        </div>
      )}

      {analysis && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--card)", border: "1px solid rgba(232,255,58,0.3)" }}>
          <p className="text-xs font-black uppercase tracking-wide mb-1" style={{ color: "var(--accent)" }}>🤖 AI Season Analysis</p>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>{analysis.headline}</p>

          <div className="flex flex-col gap-3 mb-4">
            {analysis.patterns.map((p, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: "var(--bg)", border: `1px solid ${PATTERN_COLOR[p.type]}33` }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: PATTERN_COLOR[p.type] }} />
                  <span className="text-xs font-black uppercase" style={{ color: PATTERN_COLOR[p.type] }}>{p.type}</span>
                  <span className="text-xs font-bold" style={{ color: "var(--text)" }}>{p.label}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{p.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(232,255,58,0.06)", border: "1px solid rgba(232,255,58,0.2)" }}>
            <p className="text-xs font-black uppercase tracking-wide mb-1" style={{ color: "var(--accent)" }}>Top Focus Area</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{analysis.topFocus}</p>
          </div>

          <div className="rounded-xl p-3" style={{ background: "rgba(58,143,255,0.06)", border: "1px solid rgba(58,143,255,0.2)" }}>
            <p className="text-xs font-black uppercase tracking-wide mb-1" style={{ color: "var(--blue)" }}>Next Match Tip</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{analysis.nextMatchTip}</p>
          </div>
        </div>
      )}

      {/* Match list */}
      {matches.length === 0 && !showForm && (
        <div className="text-center py-16" style={{ color: "var(--muted)" }}>
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-bold uppercase tracking-wide">No matches logged yet</p>
          <p className="text-xs mt-1">Hit &quot;+ Log Match&quot; to get started</p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="flex flex-col gap-3">
          {matches.map(m => (
            <div key={m.id} className="rounded-xl p-4 flex items-start gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: RESULT_STYLE[m.result].bg, color: RESULT_STYLE[m.result].color }}>
                {m.result}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-sm uppercase" style={{ color: "var(--text)" }}>{m.opponent}</p>
                  {m.school && <p className="text-xs" style={{ color: "var(--muted)" }}>{m.school}</p>}
                  {m.score && (
                    <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted)" }}>
                      {m.score}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-1">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.date}</p>
                  {m.weightClass && <p className="text-xs" style={{ color: "var(--muted)" }}>{m.weightClass} lbs</p>}
                </div>
                {m.notes && <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{m.notes}</p>}
              </div>
              <button onClick={() => deleteMatch(m.id)} className="text-xs flex-shrink-0 transition-all hover:opacity-100 opacity-30"
                style={{ color: "var(--red)" }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
