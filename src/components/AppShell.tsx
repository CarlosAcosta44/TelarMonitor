/* eslint-disable @next/next/no-img-element */
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { NotificationCenter } from '@/components/NotificationCenter';
import { Menu } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50 dark:bg-[#070E1A]">
      {/* Sidebar (Responsive drawer on mobile, fixed left on lg) */}
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onCloseMobile={() => setMobileSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col min-h-screen transition-colors duration-300 w-full min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#0B1628]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Abrir menú"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Telar Logo" className="w-6 h-6 object-contain" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Telar Monitor</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
          </div>
        </header>

        {/* Desktop Top Right Utility Bar (Quick Notification Access) */}
        <div className="hidden lg:flex justify-end items-center px-8 pt-4 pb-0 max-w-7xl w-full mx-auto">
          <NotificationCenter />
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
        
        {/* Global Footer (Status Bar) */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#060d1a]/50 backdrop-blur-md px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-center sm:justify-start">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Sistema Telar Monitor: Conectado
            </span>
            <span className="hidden sm:inline w-px h-4 bg-slate-200 dark:bg-slate-700"></span>
            <span className="text-[11px] sm:text-xs">Telemetría en tiempo real</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              3.2 kg CO₂ evitado hoy
            </span>
            <span>© 2026 Telar Monitor</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
