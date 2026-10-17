'use client';

import * as React from 'react';
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  Sun, 
  Info, 
  ExternalLink,
  ShieldAlert,
  BellRing,
  Volume2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { 
  getHouseholdAlertsAction, 
  markAlertReadAction, 
  markAllAlertsReadAction, 
  evaluateTelemetryAlertsAction,
  SystemAlertRecord 
} from '@/app/alertas/actions';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [alerts, setAlerts] = React.useState<SystemAlertRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [evaluating, setEvaluating] = React.useState(false);
  const [pushPermission, setPushPermission] = React.useState<NotificationPermission>('default');
  const [testPushSent, setTestPushSent] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prevAlertsLengthRef = React.useRef<number>(0);

  // Check browser notification permission on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  // Fetch real alerts from Supabase
  const loadAlerts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHouseholdAlertsAction();
      if (res.success) {
        setAlerts(res.alerts);

        // If new critical alert arrived and permission granted, notify via browser
        if (
          pushPermission === 'granted' && 
          prevAlertsLengthRef.current > 0 && 
          res.alerts.length > prevAlertsLengthRef.current
        ) {
          const newest = res.alerts[0];
          if (newest && (newest.severity === 'critical' || newest.severity === 'warning')) {
            new Notification(`Telar Monitor: ${newest.title}`, {
              body: newest.description,
              icon: '/logo.png',
            });
          }
        }
        prevAlertsLengthRef.current = res.alerts.length;
      }
    } catch (err) {
      console.error('Error cargando alertas:', err);
    } finally {
      setLoading(false);
    }
  }, [pushPermission]);

  React.useEffect(() => {
    loadAlerts();
    // Poll alerts every 45s
    const interval = setInterval(loadAlerts, 45000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  // Click outside to close popover
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

  const unreadAlerts = alerts.filter(a => !a.is_read);
  const unreadCount = unreadAlerts.length;

  const handleMarkAllRead = async () => {
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    await markAllAlertsReadAction();
  };

  const handleMarkAsRead = async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    await markAlertReadAction(id);
  };

  // Request native browser notification permission
  const handleRequestPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones de escritorio.');
      return;
    }
    const perm = await Notification.requestPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      new Notification('🔔 Notificaciones Telar Monitor activas', {
        body: 'Recibirás avisos preventivos inmediatos si se detectan anomalías de consumo o fallos del inversor.',
        icon: '/logo.png',
      });
    }
  };

  // Trigger test push
  const handleTestPush = () => {
    if (pushPermission !== 'granted') {
      handleRequestPush();
      return;
    }
    new Notification('⚡ Telar Monitor: Prueba de Notificación Activa', {
      body: 'El canal de comunicación en tiempo real está 100% operativo.',
      icon: '/logo.png',
    });
    setTestPushSent(true);
    setTimeout(() => setTestPushSent(false), 3000);
  };

  // Run anomaly detector engine
  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      await evaluateTelemetryAlertsAction();
      await loadAlerts();
    } finally {
      setEvaluating(false);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
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
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Centro de Alertas</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunEvaluation}
                disabled={evaluating}
                title="Diagnosticar anomalías ahora"
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin text-amber-500' : ''}`} />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Marcar leídas
                </button>
              )}
            </div>
          </div>

          {/* Browser Push Banner */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-500/10 via-amber-500/10 to-transparent border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <BellRing className={`w-3.5 h-3.5 shrink-0 ${pushPermission === 'granted' ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                {pushPermission === 'granted' ? 'Notificaciones Push activadas' : 'Alertas push de escritorio'}
              </span>
            </div>
            {pushPermission !== 'granted' ? (
              <button
                onClick={handleRequestPush}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black shrink-0 transition-colors"
              >
                Activar
              </button>
            ) : (
              <button
                onClick={handleTestPush}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
              >
                {testPushSent ? '¡Enviada!' : 'Probar'}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 hide-scrollbar">
            {loading && alerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                Cargando notificaciones...
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No tienes notificaciones registradas
              </div>
            ) : (
              alerts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item.id)}
                  className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                    !item.is_read ? 'bg-amber-50/30 dark:bg-amber-950/15' : ''
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
                    {item.severity === 'critical' && (
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4" />
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
                      <h4 className={`text-xs font-bold leading-tight ${item.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatRelativeTime(item.created_at)}
                      </span>
                      {item.is_resolved && (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          Resuelta
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-center">
            <Link
              href="/alertas"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
            >
              Ver Centro de Diagnóstico y Alertas Completo <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
