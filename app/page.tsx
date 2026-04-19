import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>AI Wrestling Coach</p>
        <h1 className="text-5xl font-black uppercase mb-3" style={{ color: "var(--text)" }}>
          MAT<span style={{ color: "var(--accent)" }}>IQ</span>
        </h1>
        <p className="text-base leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: "var(--muted)" }}>
          Upload a wrestling clip. Get instant technique feedback and a personalized weekly practice plan.
        </p>
        <Link href="/analyze"
          className="inline-block px-10 py-4 rounded-2xl font-black text-base uppercase tracking-wide transition-all hover:opacity-90"
          style={{ background: "var(--accent)", color: "#0a0a0f" }}>
          Start Analysis →
        </Link>
      </div>

      {/* How it works */}
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-4 text-center" style={{ color: "var(--muted)" }}>How It Works</p>
        <div className="flex flex-col gap-3">
          {[
            { step: "1", icon: "🎥", title: "Upload Your Clip", desc: "Any wrestling video — practice, competition, drills. Or just describe what you're working on." },
            { step: "2", icon: "🤖", title: "AI Identifies & Analyzes", desc: "Claude AI detects the technique, scores your execution, and finds specific issues to fix." },
            { step: "3", icon: "📅", title: "Get Your Practice Plan", desc: "Receive a full week of targeted drills, daily focus areas, and live wrestling notes." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5" style={{ background: "var(--accent)", color: "#0a0a0f" }}>
                {item.step}
              </div>
              <div>
                <p className="font-black text-sm uppercase mb-1" style={{ color: "var(--text)" }}>{item.icon} {item.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/analyze" className="rounded-2xl p-5 transition-all hover:opacity-80" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-3xl mb-3">🎥</p>
          <p className="font-black text-sm uppercase mb-1" style={{ color: "var(--text)" }}>Analyze Technique</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>Upload video → full AI coaching report + practice plan</p>
        </Link>
        <Link href="/drills" className="rounded-2xl p-5 transition-all hover:opacity-80" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-3xl mb-3">📚</p>
          <p className="font-black text-sm uppercase mb-1" style={{ color: "var(--text)" }}>Drill Library</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>AI drills for every area — takedowns, top, bottom, defense</p>
        </Link>
        <Link href="/history" className="rounded-2xl p-5 col-span-2 transition-all hover:opacity-80" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-3xl mb-3">📋</p>
          <p className="font-black text-sm uppercase mb-1" style={{ color: "var(--text)" }}>Match History</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>Log matches, track your record, and get AI pattern analysis across your season</p>
        </Link>
      </div>
    </div>
  );
}
