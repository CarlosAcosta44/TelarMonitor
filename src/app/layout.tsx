import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";

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
          <AppShell>
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

