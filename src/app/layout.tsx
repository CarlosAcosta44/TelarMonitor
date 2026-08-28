import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const outfit = localFont({
  src: [
    { path: "../../public/fonts/outfit-400.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/outfit-500.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/outfit-600.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/outfit-700.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/outfit-800.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Telar Monitor | Dashboard de Energía",
  description: "Monitor de consumo eléctrico y generación solar en tiempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${outfit.variable} antialiased flex flex-col min-h-screen`}>
        {/* ── Header ───────────────────────────────────────────── */}
        <header
          className="w-full sticky top-0 z-50"
          style={{
            backgroundColor: "var(--header-bg)",
            borderBottom: "1px solid var(--card-border)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              {/* Logo Icon */}
              <div
                className="relative w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--accent-solar) 0%, var(--accent-consumption) 100%)",
                  boxShadow: "0 4px 12px var(--accent-solar-glow)",
                }}
              >
                {/* Lightning bolt SVG */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 2L4.5 13.5H11.5L11 22L19.5 10.5H12.5L13 2Z"
                    fill="white"
                    strokeLinejoin="round"
                  />
                </svg>
                {/* Shine overlay */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: "linear-gradient(135deg, white 0%, transparent 60%)",
                  }}
                />
              </div>

              <div>
                <h1
                  className="text-xl font-bold tracking-tight leading-none"
                  style={{ color: "var(--foreground)" }}
                >
                  Telar Monitor
                </h1>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  Energía en tiempo real
                </p>
              </div>
            </div>

            {/* Right side — LIVE badge */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide"
                style={{
                  background: "var(--accent-solar-light)",
                  border: "1px solid var(--accent-solar-glow)",
                  color: "var(--accent-solar)",
                }}
              >
                <span className="live-dot" />
                EN VIVO
              </div>
            </div>
          </div>
        </header>

        {/* ── Main ─────────────────────────────────────────────── */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
          {children}
        </main>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer
          className="w-full py-4 mt-4"
          style={{
            borderTop: "1px solid var(--card-border)",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <span
              className="text-xs"
              style={{ color: "var(--foreground-muted)" }}
            >
              © 2026 Telar Monitor · Dashboard de Energía Solar
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--foreground-muted)" }}
            >
              Actualización automática cada 10 s
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
