'use client';

import { useState } from 'react';
import { 
  Check, 
  Lightbulb, 
  Sun, 
  Activity, 
  Zap, 
  LifeBuoy, 
  Mail, 
  BellRing,
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { AlertChart } from "@/components/AlertChart";
import { 
  SystemAlertRecord, 
  resolveAlertAction, 
  markAllAlertsReadAction, 
  evaluateTelemetryAlertsAction,
  getHouseholdAlertsAction 
} from "@/app/alertas/actions";

interface AlertasClientProps {
  initialAlerts: SystemAlertRecord[];
  household: {
    id: string;
    name: string;
    capacityKwp: number;
    hasSolar: boolean;
  };
  maxSolarKw: string;
  maxSolarDate: string;
  peakKw: string;
  anomalyDate: string;
  anomalyNightData: { time: string; value: number }[];
  baselineKw: number;
  deviation: string;
}

export function AlertasClient({ 
  initialAlerts,
  household,
  maxSolarKw, 
  maxSolarDate, 
  peakKw, 
  anomalyDate, 
  anomalyNightData, 
  baselineKw, 
  deviation 
}: AlertasClientProps) {
  const [alerts, setAlerts] = useState<SystemAlertRecord[]>(initialAlerts);
  const [filter, setFilter] = useState<'todas' | 'pendientes' | 'resueltas'>('todas');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [evalMsg, setEvalMsg] = useState<string | null>(null);

  // Notification Preferences State (Persisted locally)
  const [prefs, setPrefs] = useState({
    alto: true,
    resumen: true,
    caida: true,
    excedente: household.hasSolar,
  });

  const pendingAlerts = alerts.filter(a => !a.is_resolved);
  const resolvedAlerts = alerts.filter(a => a.is_resolved);

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'pendientes') return !a.is_resolved;
    if (filter === 'resueltas') return a.is_resolved;
    return true;
  });

  // Toggle Resolution of an alert in Supabase
  const handleToggleResolve = async (alertId: string, currentResolved: boolean) => {
    setResolvingId(alertId);
    try {
      const nextResolved = !currentResolved;
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_resolved: nextResolved, is_read: true } : a));
      await resolveAlertAction(alertId, nextResolved);
    } catch (err) {
      console.error('Error al resolver alerta:', err);
    } finally {
      setResolvingId(null);
    }
  };

  // Mark all alerts as read
  const handleMarkAllRead = async () => {
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    await markAllAlertsReadAction(household.id);
  };

  // Run anomaly detection evaluation
  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setEvalMsg(null);
    try {
      const res = await evaluateTelemetryAlertsAction(household.id);
      const refreshed = await getHouseholdAlertsAction(household.id);
      if (refreshed.success) {
        setAlerts(refreshed.alerts);
      }
      setEvalMsg(res.message || 'Evaluación de telemetría completada');
      setTimeout(() => setEvalMsg(null), 4000);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Request browser push permission
  const handleRequestPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones de escritorio.');
      return;
    }
    const perm = await Notification.requestPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      new Notification('🔔 Alertas Telar Monitor Habilitadas', {
        body: 'El sistema te notificará anomalías de consumo o fallas de generación en tiempo real.',
        icon: '/logo.png',
      });
    }
  };

  const getSeverityBadge = (severity: SystemAlertRecord['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: ShieldAlert,
          label: 'Crítica',
        };
      case 'warning':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: AlertTriangle,
          label: 'Atención Requerida',
        };
      case 'success':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: Sun,
          label: 'Récord / Éxito',
        };
      default:
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: Info,
          label: 'Diagnóstico',
        };
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1240px] mx-auto animate-fade-in">
        
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-[11px] font-black tracking-widest uppercase">
              Centro de Diagnóstico Inteligente
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {household.name} • {household.hasSolar ? `${household.capacityKwp} kWp Solar` : 'Solo Consumo de Red'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">
            Alertas y Notificaciones Activas
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitoreo preventivo continuo para asegurar que tu instalación opere al máximo rendimiento y sin sobrecostos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Diagnostic Action Button */}
          <button
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            {isEvaluating ? 'Analizando...' : 'Ejecutar Diagnóstico Ahora'}
          </button>

          {/* Browser Push Button */}
          {pushPermission !== 'granted' ? (
            <button
              onClick={handleRequestPush}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <BellRing className="w-3.5 h-3.5" />
              Habilitar Notificaciones Push
            </button>
          ) : (
            <span className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Push Activado
            </span>
          )}
        </div>
      </div>

      {/* Evaluation Feedback Alert */}
      {evalMsg && (
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          {evalMsg}
        </div>
      )}

      {/* Global Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Red de Diagnóstico Telemétrico: 100% Operativa
              </h3>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> En Vivo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Algoritmo de detección de anomalías conectado con Supabase RLS y el microservicio backend.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 self-stretch sm:self-auto">
          <button 
            onClick={() => setFilter('todas')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === 'todas' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Todas ({alerts.length})
          </button>
          <button 
            onClick={() => setFilter('pendientes')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === 'pendientes' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Pendientes ({pendingAlerts.length})
          </button>
          <button 
            onClick={() => setFilter('resueltas')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === 'resueltas' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Resueltas ({resolvedAlerts.length})
          </button>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Feed (Left 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                {filter === 'pendientes' ? '¡Excelente! No tienes alertas pendientes' : 'No hay alertas en esta categoría'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tu instalación opera con normalidad dentro de los parámetros esperados de consumo y generación.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const badge = getSeverityBadge(alert.severity);
              const BadgeIcon = badge.icon;
              const isNightAnomaly = alert.title.toLowerCase().includes('nocturno');

              return (
                <div 
                  key={alert.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 md:p-6 shadow-sm relative overflow-hidden transition-all ${
                    alert.is_resolved 
                      ? 'border-slate-200 dark:border-slate-800 opacity-80' 
                      : alert.severity === 'critical'
                      ? 'border-rose-300 dark:border-rose-900/60'
                      : alert.severity === 'warning'
                      ? 'border-amber-300 dark:border-amber-900/60'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Left accent bar */}
                  {!alert.is_resolved && (
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${
                      alert.severity === 'critical' ? 'bg-rose-500' :
                      alert.severity === 'warning' ? 'bg-amber-500' :
                      alert.severity === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`} />
                  )}

                  <div className="flex flex-col gap-4">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg}`}>
                          <BadgeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">
                              {alert.title}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            {alert.is_resolved && (
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold">
                                Resuelta
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.created_at).toLocaleString('es-CO', { 
                              day: 'numeric', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} • Diagnóstico automático
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleResolve(alert.id, alert.is_resolved)}
                        disabled={resolvingId === alert.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
                          alert.is_resolved 
                            ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {resolvingId === alert.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : alert.is_resolved ? (
                          'Reabrir Alerta'
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Marcar Resuelta
                          </>
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-0 md:pl-13">
                      {alert.description}
                    </p>

                    {/* Night Anomaly Chart Embed */}
                    {isNightAnomaly && !alert.is_resolved && anomalyNightData.length > 0 && (
                      <div className="pl-0 md:pl-13">
                        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                              Ventana de registro de madrugada (00:00 - 06:00)
                            </span>
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                              +{deviation} kW sobre línea base ({baselineKw} kW)
                            </span>
                          </div>
                          <div className="h-[80px]">
                            <AlertChart data={anomalyNightData} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Sidebar (Settings & Channels, 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Notification Channels Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Canales de Alerta Activa
                </h3>
                <p className="text-xs text-slate-500">
                  Configura cómo deseas recibir avisos en tiempo real
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Picos de Consumo Crítico</span>
                  <span className="text-slate-400 text-[11px]">Aviso si el consumo supera los 4.5 kW</span>
                </div>
                <input 
                  type="checkbox"
                  checked={prefs.alto}
                  onChange={(e) => setPrefs(p => ({ ...p, alto: e.target.checked }))}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300"
                />
              </div>

              <div className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Resumen Diario de Ahorro</span>
                  <span className="text-slate-400 text-[11px]">Notificación vespertina con kWh ahorrados</span>
                </div>
                <input 
                  type="checkbox"
                  checked={prefs.resumen}
                  onChange={(e) => setPrefs(p => ({ ...p, resumen: e.target.checked }))}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300"
                />
              </div>

              <div className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Falla o Caída de Inversor</span>
                  <span className="text-slate-400 text-[11px]">Aviso inmediato si cae la generación a mediodía</span>
                </div>
                <input 
                  type="checkbox"
                  checked={prefs.caida}
                  onChange={(e) => setPrefs(p => ({ ...p, caida: e.target.checked }))}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300"
                />
              </div>

              {household.hasSolar && (
                <div className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Excedentes a la Red</span>
                    <span className="text-slate-400 text-[11px]">Alerta cuando inyectas energía comercial</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={prefs.excedente}
                    onChange={(e) => setPrefs(p => ({ ...p, excedente: e.target.checked }))}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Canal Push de Escritorio:</span>
              <strong className={pushPermission === 'granted' ? 'text-emerald-500' : 'text-amber-500'}>
                {pushPermission === 'granted' ? 'Habilitado' : 'Pendiente'}
              </strong>
            </div>
          </div>

          {/* Quick Help Box */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                ¿Necesitas soporte técnico?
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Si una alerta crítica persiste tras verificar tus breakers o conexiones físicas, puedes contactar al equipo de ingeniería Telar.
            </p>
            <a 
              href="mailto:soporte@telar.co"
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 mt-1"
            >
              Contactar a soporte@telar.co <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
