'use client';

import { Download } from 'lucide-react';

export function ExportButton() {
  const handleExport = () => {
    // A simple window.print() leverages the browser's native PDF generation.
    // CSS print media queries will handle the layout cleanups.
    window.print();
  };

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm ml-auto print:hidden"
    >
      <Download className="w-4 h-4 text-slate-400" />
      Exportar Resumen
    </button>
  );
}
