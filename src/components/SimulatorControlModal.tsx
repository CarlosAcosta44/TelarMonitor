'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Cpu, 
  Database, 
  Trash2, 
  Zap, 
  Calendar, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldAlert,
  Server
} from 'lucide-react';
import { 
  getSimulatorStatusAction, 
  getReadingsCountAction, 
  seedHistoricalAction, 
  triggerPulseAction, 
  cleanAllReadingsAction 
} from '@/app/configuracion/simulatorActions';

interface SimulatorControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  household: {
    id: string;
    installation_name: string;
    capacity_kwp: string;
  };
}

export function SimulatorControlModal({ isOpen, onClose, household }: SimulatorControlModalProps) {
  const [simulatorStatus, setSimulatorStatus] = useState<{
    online: boolean;
    url: string;
    data?: any;
    error?: string;
  } | null>(null);

  const [rowCount, setRowCount] = useState<number | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [cleanBefore, setCleanBefore] = useState(true);

  // Action loaders
  const [seedingDays, setSeedingDays] = useState<number | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [confirmCleanOpen, setConfirmCleanOpen] = useState(false);

  // Feedback State
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
    sqlCommand?: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const hasSolar = (parseFloat(household.capacity_kwp) || 0) > 0;

  // Refresh status and row count
  const refreshData = async () => {
    setIsLoadingStatus(true);
    setFeedback(null);
    try {
      const [statusRes, countRes] = await Promise.all([
        getSimulatorStatusAction(),
        getReadingsCountAction(),
      ]);
      setSimulatorStatus(statusRes);
      setRowCount(countRes.count);
    } catch {
      // Ignored
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handler: Seed Historical Data
  const handleSeed = async (days: number) => {
    setSeedingDays(days);
    setFeedback(null);
    try {
      const res = await seedHistoricalAction({
        days,
        cleanBefore,
        householdId: household.id,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          text: `✅ ${res.message}. Las gráficas del sistema han sido actualizadas.`,
        });
        await refreshData();
      } else {
        setFeedback({
          type: 'error',
          text: `❌ Error al sembrar datos: ${res.error || 'Fallo desconocido'}`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: `❌ Error de ejecución: ${err.message || String(err)}`,
      });
    } finally {
      setSeedingDays(null);
    }
  };

  // Handler: Trigger Test Pulse
  const handlePulse = async () => {
    setIsPulsing(true);
    setFeedback(null);
    try {
      const res = await triggerPulseAction({ householdId: household.id });
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `⚡ ${res.message}`,
        });
        await refreshData();
      } else {
        setFeedback({
          type: 'error',
          text: `❌ ${res.error || 'Error al emitir pulso'}`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: `❌ Error: ${err.message || String(err)}`,
      });
    } finally {
      setIsPulsing(false);
    }
  };

  // Handler: Clean All Readings
  const handleCleanAll = async () => {
    setIsCleaning(true);
    setFeedback(null);
    try {
      const res = await cleanAllReadingsAction({ householdId: household.id });

      if (res.success) {
        setFeedback({
          type: 'success',
          text: `🧹 ${res.message}`,
        });
        setConfirmCleanOpen(false);
        await refreshData();
      } else {
        // Needs SQL Truncate due to RLS
        setFeedback({
          type: 'warning',
          text: res.message,
          sqlCommand: res.sqlCommand,
        });
        setRowCount(res.count);
        setConfirmCleanOpen(false);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: `❌ Error en limpieza: ${err.message || String(err)}`,
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const handleCopySql = () => {
    if (!feedback?.sqlCommand) return;
    navigator.clipboard.writeText(feedback.sqlCommand);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Centro de Control del Simulador
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  IoT Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestión de telemetría, sembrado histórico e inyección de datos para {household.installation_name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 py-4 flex flex-col gap-5">
          {/* Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Backend Service Status */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${simulatorStatus?.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Microservicio Backend
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {simulatorStatus?.online ? 'En Línea (Conectado)' : 'Desconectado'}
                  </span>
                </div>
              </div>
              <button 
                onClick={refreshData}
                disabled={isLoadingStatus}
                title="Refrescar estado"
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Current Rows Counter */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Lecturas en Base de Datos
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {rowCount !== null ? `${rowCount.toLocaleString('es-CO')} filas acumuladas` : 'Consultando...'}
                  </span>
                </div>
              </div>
              {rowCount && rowCount > 10000 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                  Volumen Alto
                </span>
              )}
            </div>
          </div>

          {/* Household Context Info */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
            <span className="text-indigo-900 dark:text-indigo-200 font-medium">
              Modo de Simulación: <strong className="font-bold">{hasSolar ? `Solar + Consumo (${household.capacity_kwp} kWp)` : 'Monitoreo Exclusivo de Red (Sin Solar)'}</strong>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              ID: {household.id.slice(0, 8)}...
            </span>
          </div>

          {/* Feedback Alert Box */}
          {feedback && (
            <div className={`p-4 rounded-2xl border text-xs flex flex-col gap-2.5 animate-fade-in ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                : feedback.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              <div className="flex items-start gap-2.5">
                {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
                {feedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
                {feedback.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />}
                <div className="flex-1 font-medium leading-relaxed">
                  {feedback.text}
                </div>
              </div>

              {/* SQL Truncate Helper Box */}
              {feedback.sqlCommand && (
                <div className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      Instrucción SQL para Supabase (1-Clic)
                    </span>
                    <button
                      onClick={handleCopySql}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedSql ? 'Copiado' : 'Copiar Sentencia'}
                    </button>
                  </div>
                  <pre className="font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre p-1">
                    {feedback.sqlCommand}
                  </pre>
                  <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Pégalo en el SQL Editor de tu proyecto en Supabase</span>
                    <a 
                      href="https://supabase.com/dashboard/project/lonuptruktezinruxwya" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1"
                    >
                      Abrir Supabase SQL <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Historical Seeding */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Sembrado Histórico Automatizado
                </h4>
                <p className="text-xs text-slate-500">
                  Genera lecturas sintéticas consistentes cada 15 minutos para pruebas de gráficas y reportes.
                </p>
              </div>

              {/* Clean Before Toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={cleanBefore}
                  onChange={(e) => setCleanBefore(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                />
                Limpiar antes de sembrar (evita duplicados)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleSeed(7)}
                disabled={seedingDays !== null || isCleaning || isPulsing}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-slate-800 dark:text-slate-200 font-bold text-xs flex flex-col gap-1 transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                    🌱 Sembrar 7 Días
                  </span>
                  {seedingDays === 7 && <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />}
                </div>
                <span className="text-[11px] text-slate-500 font-normal">
                  ~672 intervalos de 15 min. Ideal para probar curvas semanales.
                </span>
              </button>

              <button
                onClick={() => handleSeed(30)}
                disabled={seedingDays !== null || isCleaning || isPulsing}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-slate-800 dark:text-slate-200 font-bold text-xs flex flex-col gap-1 transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                    📅 Sembrar 30 Días
                  </span>
                  {seedingDays === 30 && <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />}
                </div>
                <span className="text-[11px] text-slate-500 font-normal">
                  ~2.880 intervalos de 15 min. Rellena el mes completo y activa ROI.
                </span>
              </button>
            </div>
          </div>

          {/* Section: Live Tick */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Pulso Instantáneo de Prueba
              </h4>
              <p className="text-xs text-slate-500">
                Inyecta una lectura individual en este minuto para validar receptores en tiempo real.
              </p>
            </div>

            <button
              onClick={handlePulse}
              disabled={isPulsing || seedingDays !== null || isCleaning}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center gap-2 transition-all shrink-0 disabled:opacity-50 shadow-sm"
            >
              {isPulsing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              )}
              Disparar Pulso de Prueba
            </button>
          </div>

          {/* Section: Danger Zone (Clean All) */}
          <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-sm flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Zona de Limpieza: Vaciar Telemetría
                </h4>
                <p className="text-xs text-rose-700/80 dark:text-rose-300/70">
                  Elimina todos los registros de <code>energy_readings</code> (útil para purgar los miles de registros acumulados por múltiples pruebas). Los usuarios y parámetros del hogar no se tocan.
                </p>
              </div>
            </div>

            {!confirmCleanOpen ? (
              <div className="flex justify-end">
                <button
                  onClick={() => setConfirmCleanOpen(true)}
                  disabled={isCleaning || seedingDays !== null}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vaciar Tabla de Lecturas ({rowCount ? rowCount.toLocaleString('es-CO') : '0'} filas)
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  ⚠️ ¿Confirmas eliminar {rowCount?.toLocaleString('es-CO') ?? ''} registros? Esta acción no se puede deshacer.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmCleanOpen(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCleanAll}
                    disabled={isCleaning}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    {isCleaning && <RefreshCw className="w-3 h-3 animate-spin" />}
                    Sí, Vaciar Ahora
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            Backend: <code className="font-mono text-[11px] text-slate-600 dark:text-slate-300">{simulatorStatus?.url || 'http://localhost:4000'}</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
