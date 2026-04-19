"use client";
import { useState } from "react";

interface Drill {
  name: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  reps: string;
  description: string;
  coachingCue: string;
}

const CATEGORIES = [
  { label: "Takedowns", icon: "🥋" },
  { label: "Takedown Setups", icon: "🎯" },
  { label: "Top", icon: "⬆️" },
  { label: "Bottom", icon: "⬇️" },
  { label: "Defense", icon: "🛡️" },
  { label: "Hand Fighting", icon: "🤜" },
  { label: "Conditioning", icon: "🔥" },
  { label: "Mental Training", icon: "🧠" },
];

const DIFF_COLOR: Record<string, string> = {
  beginner: "var(--accent)",
  intermediate: "var(--orange)",
  advanced: "var(--red)",
};

export default function DrillsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [weightClass, setWeightClass] = useState("");
  const [drillsByCategory, setDrillsByCategory] = useState<Record<string, Drill[]>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadDrills = async (category: string) => {
    if (drillsByCategory[category]) {
      setActiveCategory(category);
      return;
    }
    setLoading(category);
    setError("");
    try {
      const res = await fetch("/api/drills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, weightClass }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setDrillsByCategory(prev => ({ ...prev, [category]: data.drills }));
      setActiveCategory(category);
    } catch (err) {
      setError(`Failed to load ${category} drills. Try again.`);
    } finally {
      setLoading(null);
    }
  };

  const regenerate = async (category: string) => {
    setDrillsByCategory(prev => { const n = { ...prev }; delete n[category]; return n; });
    await loadDrills(category);
  };

  const activeDrills = activeCategory ? drillsByCategory[activeCategory] : [];

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-4xl font-black uppercase leading-tight mb-2" style={{ color: "var(--text)" }}>
        DRILL<br /><span style={{ color: "var(--accent)" }}>LIBRARY</span>
      </h1>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted)" }}>
        AI-generated drills tailored to each area of your game.
      </p>

      {/* Weight class input */}
      <div className="rounded-xl px-4 py-2 mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Weight Class (optional)</label>
        <input className="w-full bg-transparent text-sm mt-1 outline-none py-1" style={{ color: "var(--text)" }}
          placeholder="e.g. 152" value={weightClass} onChange={e => setWeightClass(e.target.value)} />
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button key={cat.label} onClick={() => loadDrills(cat.label)}
            className="rounded-xl py-4 flex flex-col items-center gap-1 transition-all hover:opacity-90"
            style={{
              background: activeCategory === cat.label ? "rgba(232,255,58,0.12)" : "var(--card)",
              border: `1px solid ${activeCategory === cat.label ? "var(--accent)" : "var(--border)"}`,
              color: activeCategory === cat.label ? "var(--accent)" : "var(--muted)",
            }}>
            <span className="text-2xl">{loading === cat.label ? "⏳" : cat.icon}</span>
            <span className="text-xs font-black uppercase tracking-wide">{cat.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: "rgba(255,58,58,0.1)", color: "var(--red)", border: "1px solid rgba(255,58,58,0.2)" }}>
          {error}
        </div>
      )}

      {/* Drills list */}
      {!activeCategory && !loading && (
        <div className="text-center py-16" style={{ color: "var(--muted)" }}>
          <p className="text-4xl mb-3">📚</p>
          <p className="text-sm font-bold uppercase tracking-wide">Pick a category to load drills</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-16" style={{ color: "var(--muted)" }}>
          <p className="text-4xl mb-3">🤖</p>
          <p className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>Generating {loading} drills...</p>
        </div>
      )}

      {activeCategory && activeDrills && activeDrills.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-sm uppercase tracking-wide" style={{ color: "var(--text)" }}>
              {CATEGORIES.find(c => c.label === activeCategory)?.icon} {activeCategory} Drills
            </p>
            <button onClick={() => regenerate(activeCategory)}
              className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
              ↻ Regenerate
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {activeDrills.map((drill, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-black text-sm uppercase" style={{ color: "var(--text)" }}>{drill.name}</p>
                  <span className="text-xs font-black uppercase px-2 py-0.5 rounded flex-shrink-0"
                    style={{ background: `${DIFF_COLOR[drill.difficulty]}22`, color: DIFF_COLOR[drill.difficulty] }}>
                    {drill.difficulty}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>{drill.description}</p>
                <div className="flex gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted)" }}>
                    ⏱ {drill.duration}
                  </span>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(232,255,58,0.08)", color: "var(--accent)" }}>
                    🔁 {drill.reps}
                  </span>
                </div>
                <div className="rounded-lg px-3 py-2" style={{ background: "rgba(58,143,255,0.08)", border: "1px solid rgba(58,143,255,0.15)" }}>
                  <p className="text-xs font-black uppercase tracking-wide mb-1" style={{ color: "var(--blue)" }}>Coach Cue</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{drill.coachingCue}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
