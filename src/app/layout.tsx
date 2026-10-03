import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased min-h-screen text-slate-900 dark:text-slate-100 flex transition-colors duration-300`}>
        <ThemeProvider>
          {/* Sidebar (Fixed width) */}
          <Sidebar />

          {/* Main Content Area (Flexible, offset by Sidebar width) */}
          <div className="flex-1 ml-64 flex flex-col min-h-screen transition-colors duration-300">
            <main className="flex-1 px-8 py-8 w-full max-w-7xl mx-auto">
              {children}
            </main>
            
            {/* Global Footer (Status Bar) */}
            <footer className="h-12 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#060d1a]/50 backdrop-blur-md px-8 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0 transition-colors duration-300">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Sistema Telar Monitor: Conectado
                </span>
                <span className="w-px h-4 bg-slate-200 dark:bg-slate-700"></span>
                <span>Actualización automática cada 10 s</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  3.2 kg CO₂ evitado hoy
                </span>
                <span>© 2026 Telar Monitor</span>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
