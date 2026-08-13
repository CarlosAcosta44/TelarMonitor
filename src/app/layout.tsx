import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Telar Monitor | Dashboard",
  description: "Monitor de consumo eléctrico y generación solar en tiempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased flex flex-col min-h-screen`}>
        <header className="w-full border-b border-[var(--card-border)] bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[var(--accent-consumption)] to-[var(--accent-solar)] flex items-center justify-center">
                <span className="text-white font-bold text-xs">TM</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">Telar Monitor</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
