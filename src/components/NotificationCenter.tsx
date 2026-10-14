'use client';

import * as React from 'react';
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  Sun, 
  Info, 
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  severity: 'warning' | 'success' | 'info';
  time: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Pico solar récord registrado',
    description: 'Tus paneles alcanzaron 3.8 kW sostenidos hoy a la 1:15 PM.',
    severity: 'success',
    time: 'Hace 2 horas',
    isRead: false,
  },
  {
    id: '2',
    title: 'Consumo nocturno anómalo detectado',
    description: 'Se registró demanda inusual continua de 1.8 kW entre 2:00 AM y 4:00 AM.',
    severity: 'warning',
    time: 'Hace 6 horas',
    isRead: false,
  },
  {
    id: '3',
    title: 'Mantenimiento preventivo recomendado',
    description: 'Llevas 3 meses sin registrar limpieza superficial de los paneles.',
    severity: 'info',
    time: 'Ayer',
    isRead: true,
  },
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Centro de Notificaciones"
        className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-md shadow-amber-500/30">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Marcar leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 hide-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No tienes notificaciones
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                    !item.isRead ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.severity === 'success' && (
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Sun className="w-4 h-4" />
                      </div>
                    )}
                    {item.severity === 'warning' && (
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                    {item.severity === 'info' && (
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-xs font-bold leading-tight ${item.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal line-clamp-2">
                      {item.description}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center">
            <Link
              href="/alertas"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
            >
              Ver Centro de Alertas Completo <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
