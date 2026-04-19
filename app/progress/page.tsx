export default function ProgressPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-4xl font-black uppercase leading-tight mb-2" style={{ color: "var(--text)" }}>
        YOUR<br /><span style={{ color: "var(--accent)" }}>PROGRESS</span>
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>Track your improvement over time.</p>

      <div className="rounded-2xl p-10 text-center mb-6" style={{ background: "var(--card)", border: "1px solid rgba(232,255,58,0.15)" }}>
        <p className="text-5xl mb-4">📊</p>
        <h2 className="text-xl font-black uppercase mb-3" style={{ color: "var(--text)" }}>Coming Soon</h2>
        <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: "var(--muted)" }}>
          Your progress dashboard will show technique score trends, session history, and improvement highlights as you complete more analyses.
        </p>
      </div>

      <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-black uppercase tracking-wide mb-4" style={{ color: "var(--text)" }}>What You&apos;ll Track</h3>
        {[
          { icon: "📈", label: "Technique score over time" },
          { icon: "🏆", label: "Win/loss record" },
          { icon: "🎯", label: "Most improved techniques" },
          { icon: "⚡", label: "Total AI coaching sessions" },
        ].map((item, i, arr) => (
          <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm" style={{ color: "var(--muted)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
