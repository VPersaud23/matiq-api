"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "🏠 Home" },
  { href: "/analyze", label: "🎥 Analyze" },
  { href: "/drills", label: "📚 Drills" },
  { href: "/history", label: "📋 History" },
  { href: "/progress", label: "📊 Progress" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
      className="flex items-center justify-between px-6 py-3 sticky top-0 z-50">
      <Link href="/" className="font-black text-2xl tracking-widest" style={{ color: "var(--accent)" }}>
        MAT<span style={{ color: "var(--text)" }}>IQ</span>
      </Link>
      <div className="flex gap-1">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className="px-3 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: path === l.href ? "rgba(232,255,58,0.12)" : "transparent",
              color: path === l.href ? "var(--accent)" : "var(--muted)",
              border: path === l.href ? "1px solid var(--accent)" : "1px solid transparent",
            }}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
