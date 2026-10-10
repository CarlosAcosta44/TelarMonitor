/* eslint-disable @next/next/no-img-element */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { createClient } from '@/infrastructure/supabase/browser';
import { 
  LayoutDashboard, 
  TrendingUp, 
  PiggyBank, 
  BellRing, 
  Settings,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard Principal', href: '/', icon: LayoutDashboard },
  { name: 'Histórico y Tendencias', href: '/historico', icon: TrendingUp },
  { name: 'Comparativa y Ahorro', href: '/ahorro', icon: PiggyBank },
  { name: 'Alertas del Sistema', href: '/alertas', icon: BellRing, badge: 1 },
  { name: 'Configuración Hogar', href: '/configuracion', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [householdName, setHouseholdName] = React.useState<string>('Hogar Las Palmas');

  React.useEffect(() => {
    const supabase = createClient();
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
      // Also fetch household name for this user if available
      const { data: household } = await supabase.from('households').select('name').limit(1).single();
      if (household?.name) {
        setHouseholdName(household.name);
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };


  return (
    <aside className="w-64 h-screen bg-white dark:bg-[#0B1628] border-r border-slate-200/80 dark:border-slate-800 flex flex-col fixed left-0 top-0 transition-colors duration-300">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/logo.png" alt="Telar Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-slate-100 leading-tight transition-colors duration-300">Telar Monitor</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">Energía en tiempo real</p>
          </div>
        </div>
      </div>

      {/* Simulator Status (MVP only) */}
      <div className="px-4 py-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-3 py-1.5 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">En Vivo (Simulación MVP)</span>
          </div>
          <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-500">10s</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          NAVEGACIÓN
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border border-amber-200/80 dark:border-amber-700/50' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400 dark:text-slate-500'}`} />
                {item.name}
              </div>
              {item.badge && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 space-y-4 transition-colors duration-300">
        {/* Theme Toggle */}
        <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl flex items-center transition-colors duration-300">
          <button 
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              theme === 'light' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" /> Claro
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              theme === 'dark' 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" /> Oscuro
          </button>
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User avatar" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{householdName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{userEmail || 'usuario@telar.co'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
}
