"use client";
import { useState } from "react";

interface Tendency { label: string; value: string; usage: number; }
interface ScoutReport { opponentName: string; school: string; weightClass: string; record: string; threatLevel: string; style: string; summary: string; tendencies: Tendency[]; gamePlan: string[]; }

const THREAT_COLOR: Record<string, string> = { high: "var(--red)", medium: "var(--orange)", low: "var(--blue)" };

export default function ScoutPage() {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ScoutReport | null>(null);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!name.trim()) { setError("Please enter the opponent's name."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponentName: name.trim(), school: school.trim() || "Unknown School", weightClass: weight.trim() || "152" }),
      });
      if (!res.ok) throw new Error();
      setReport(await res.json());
    } catch {
      setError("Could not generate report. Please try again.");
    }
    setLoading(false);
  };

  if (report) {
    const tc = THREAT_COLOR[report.threatLevel] || "var(--orange)";
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button onClick={() => setReport(null)} className="mb-6 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>← New Scout</button>
        <h1 className="text-4xl font-black uppercase leading-tight mb-2" style={{ color: "var(--text)" }}>
          {report.opponentName.split(" ")[0].toUpperCase()}<br />
          <span style={{ color: "var(--accent)" }}>{report.opponentName.split(" ").slice(1).join(" ").toUpperCase()}</span>
        </h1>
        <div className="flex flex-wrap gap-2 mb-6">
          {[report.school, `${report.weightClass} lbs`, report.record, report.style].map((t, i) => (
            <span key={i} className="px-3 py-1 rounded text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text)" }}>{t}</span>
          ))}
        </div>

        <div className="rounded-2xl p-5 mb-6" style={{ background: `${tc}14`, border: `1px solid ${tc}33` }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: tc }}>Threat Level</p>
          <p className="text-2xl font-black uppercase mb-2" style={{ color: tc }}>{report.threatLevel.toUpperCase()}</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{report.summary}</p>
        </div>

        <h3 className="text-sm font-black uppercase tracking-wide mb-3" style={{ color: "var(--text)" }}>Tendencies</h3>
        <div className="flex flex-col gap-3 mb-8">
          {report.tendencies.map((t, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex justify-between mb-1">
                <span className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>{t.label}</span>
                <span className="text-sm font-black" style={{ color: "var(--accent)" }}>{t.usage}%</span>
              </div>
              <p className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>{t.value}</p>
              <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(t.usage, 100)}%`, background: "var(--accent)" }} />
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-black uppercase tracking-wide mb-3" style={{ color: "var(--text)" }}>AI Game Plan</h3>
        <div className="flex flex-col gap-3">
          {report.gamePlan.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black" style={{ background: "var(--accent)", color: "#0a0a0f" }}>{i + 1}</div>
              <div className="flex-1 rounded-xl p-3 text-sm leading-relaxed" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-4xl font-black uppercase leading-tight mb-2" style={{ color: "var(--text)" }}>
        SCOUT<br /><span style={{ color: "var(--accent)" }}>OPPONENTS</span>
      </h1>
      <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--muted)" }}>
        Enter your opponent&apos;s details and get an AI-generated scouting report with tendencies and a game plan.
      </p>

      {error && <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: "rgba(255,58,58,0.1)", color: "var(--red)", border: "1px solid rgba(255,58,58,0.2)" }}>{error}</div>}

      <div className="flex flex-col gap-3 mb-8">
        {[
          { label: "Opponent Name *", value: name, setter: setName, placeholder: "e.g. Jake Martinez", type: "text" },
          { label: "School / Team", value: school, setter: setSchool, placeholder: "e.g. Lincoln High School", type: "text" },
          { label: "Weight Class (lbs)", value: weight, setter: setWeight, placeholder: "e.g. 152", type: "number" },
        ].map(f => (
          <div key={f.label} className="rounded-xl px-4 py-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <label className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>{f.label}</label>
            <input className="w-full bg-transparent text-base mt-1 outline-none py-2" style={{ color: "var(--text)" }}
              type={f.type} placeholder={f.placeholder} value={f.value} onChange={e => f.setter(e.target.value)} />
          </div>
        ))}
      </div>

      <button onClick={generate} disabled={loading}
        className="w-full py-4 rounded-2xl font-black uppercase tracking-wide text-base transition-all hover:opacity-90 flex items-center justify-center gap-2"
        style={{ background: loading ? "var(--border)" : "var(--accent)", color: loading ? "var(--muted)" : "#0a0a0f" }}>
        {loading ? <><span className="animate-spin">⚙️</span> Generating Report...</> : "Generate AI Scout Report →"}
      </button>
    </div>
  );
}
