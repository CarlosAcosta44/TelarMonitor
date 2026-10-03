'use client';

import { useState } from 'react';
import { 
  Check, 
  Lightbulb, 
  Sun, 
  Settings2, 
  Activity, 
  Zap, 
  LifeBuoy, 
  Smartphone, 
  Mail, 
  BellRing,
  X,
  ShieldCheck
} from "lucide-react";
import { AlertChart } from "@/components/AlertChart";

export function AlertasClient({ 
  maxSolarKw, 
  maxSolarDate, 
  peakKw, 
  anomalyDate, 
  anomalyNightData, 
  baselineKw, 
  deviation 
}: any) {
  const [filter, setFilter] = useState<'todas' | 'pendientes' | 'resueltas'>('todas');
  
  const [alertsState, setAlertsState] = useState({
    anomaly: 'pendiente',
    record: 'resuelta',
    maintenance: 'pendiente',
    connection: 'resuelta'
  });

  const [toggles, setToggles] = useState({
    alto: true,
    resumen: true,
    caida: true,
    excedente: false
  });

  const handleDismissAnomaly = () => {
    setAlertsState(prev => ({ ...prev, anomaly: 'resuelta' }));
  };

  const handleMarkAllRead = () => {
    setAlertsState({
      anomaly: 'resuelta',
      record: 'resuelta',
      maintenance: 'resuelta',
      connection: 'resuelta'
    });
  };

  const counts = {
    todas: 4,
    pendientes: Object.values(alertsState).filter(s => s === 'pendiente').length,
    resueltas: Object.values(alertsState).filter(s => s === 'resuelta').length,
  };

  const showAnomaly = filter === 'todas' || filter === alertsState.anomaly + 's';
  const showRecord = filter === 'todas' || filter === alertsState.record + 's';
  const showMaint = filter === 'todas' || filter === alertsState.maintenance + 's';
  const showConn = filter === 'todas' || filter === alertsState.connection + 's';

  return (
    <div className="flex flex-col gap-5 max-w-[1200px] mx-auto animate-fade-in">
        
      {/* Top Navigation / Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-[11px] font-black tracking-widest uppercase">
              Centro de Diagnóstico
            </span>
            <span className="text-sm font-medium text-slate-400">ID Instalación: TELAR-LP-402</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
            Alertas y Notificaciones del Sistema
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitoreo preventivo automático para que tu instalación funcione siempre al máximo rendimiento.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setFilter('todas')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'todas' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              Todas ({counts.todas})
            </button>
            <button 
              onClick={() => setFilter('pendientes')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'pendientes' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              Pendientes ({counts.pendientes})
            </button>
            <button 
              onClick={() => setFilter('resueltas')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'resueltas' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              Resueltas ({counts.resueltas})
            </button>
          </div>
          <button onClick={handleMarkAllRead} className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center gap-1.5 px-2">
            <Check className="w-3.5 h-3.5" /> Marcar todas como leídas
          </button>
        </div>
      </div>

      {/* Global Status Bar */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-700 dark:bg-emerald-600 rounded-xl shadow-inner flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Estado de Sensores: 100% Operativo y Conectado</h3>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> En Línea
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Monitoreo en tiempo real sin interrupciones. Inversor fotovoltaico, pinzas de corriente y telemetría de red sincronizados.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-3.5 h-3.5" /> Latencia: 24 ms
          </div>
          <span>·</span>
          <span>Último sync: hace 8s</span>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Feed (Left 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Active Alert (Yellow Box) */}
          {showAnomaly && (
            <div className={`bg-white dark:bg-slate-900 border ${alertsState.anomaly === 'pendiente' ? 'border-orange-200 dark:border-orange-900/50' : 'border-slate-200 dark:border-slate-800'} rounded-2xl shadow-sm overflow-hidden relative transition-colors`}>
              {alertsState.anomaly === 'pendiente' && <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>}
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 ${alertsState.anomaly === 'pendiente' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-slate-100 dark:bg-slate-800'} rounded-full flex items-center justify-center shrink-0`}>
                      <Lightbulb className={`w-5 h-5 ${alertsState.anomaly === 'pendiente' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">Consumo inusual detectado en horario nocturno</h3>
                      <div className="flex items-center gap-2 mb-2">
                        {alertsState.anomaly === 'pendiente' ? (
                          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 rounded text-xs font-bold">Atención Requerida</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">Resuelta</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Hoy, {new Date(anomalyDate).toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'})} • Detectado automáticamente por algoritmo Telar</p>
                    </div>
                  </div>
                  {alertsState.anomaly === 'pendiente' && (
                    <button onClick={handleDismissAnomaly} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="ml-14">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                    Se registró un <strong className="font-bold">consumo continuo de {peakKw} kW</strong> entre la 01:00 AM y las 04:00 AM, notablemente superior al promedio nocturno habitual de tu hogar (<strong className="font-bold">{baselineKw} kW</strong>).
                  </p>
                  
                  <div className="flex items-start gap-2 mb-5">
                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full border-2 ${alertsState.anomaly === 'pendiente' ? 'border-orange-400' : 'border-slate-400'}`}></div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Causa probable:</span> Un electrodoméstico de alta demanda, calentador o climatización central quedó encendido por descuido.
                    </p>
                  </div>

                  {/* Dynamic Area Chart */}
                  <div className={`${alertsState.anomaly === 'pendiente' ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'} rounded-xl p-4 border mb-5 relative transition-colors`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-500">Ventana de registro (00:00 - 06:00)</span>
                      <span className={`text-xs font-black ${alertsState.anomaly === 'pendiente' ? 'text-orange-700 dark:text-orange-400' : 'text-slate-500'}`}>+{deviation} kW desviación sobre la base</span>
                    </div>
                    <div className="h-[80px]">
                      <AlertChart data={anomalyNightData} />
                    </div>
                    {/* Fake baseline overlay */}
                    <div className="absolute bottom-[24px] left-4 right-4 border-t border-dashed border-slate-300 dark:border-slate-600 z-10 pointer-events-none"></div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-slate-400">-- Línea base habitual ({baselineKw} kW)</span>
                      <span className={`text-[10px] font-medium ${alertsState.anomaly === 'pendiente' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`}>Pico registrado: {peakKw} kW ({new Date(anomalyDate).toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'})})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
                      Ver consumo de esa hora
                    </button>
                    {alertsState.anomaly === 'pendiente' && (
                      <button onClick={handleDismissAnomaly} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors">
                        Descartar aviso
                      </button>
                    )}
                    <span className="ml-auto text-xs font-medium text-slate-500">Impacto est.: ~{(Number(deviation) * 850 * 3).toLocaleString('es-CO')} COP</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Feed */}
          {(showRecord || showMaint || showConn) && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Historial Reciente y Consejos</h3>
                </div>
                <span className="text-xs font-medium text-slate-400">Últimos 7 días</span>
              </div>

              {/* Record Mensual */}
              {showRecord && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex gap-4">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                    <Sun className="w-5 h-5 text-emerald-100" />
                    <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-300 rounded-bl-sm"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Pico de generación solar alcanzado</h4>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">Récord Mensual</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 max-w-xl">
                      El {new Date(maxSolarDate).toLocaleDateString('es-CO')} a las {new Date(maxSolarDate).toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'})} tus paneles alcanzaron <strong className="font-bold text-slate-900 dark:text-white">{maxSolarKw} kW</strong> sostenidos.
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">{new Date(maxSolarDate).toLocaleDateString('es-CO')} • Resuelta automáticamente</span>
                      <button className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <Check className="w-3 h-3" /> Anotado
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance */}
              {showMaint && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <LifeBuoy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Mantenimiento preventivo de paneles recomendado</h4>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">Consejo Preventivo</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 max-w-xl">
                      Llevas <strong className="font-bold text-slate-900 dark:text-white">4 meses</strong> sin registrar limpieza en los paneles solares. En zonas secas, una capa ligera de cal o polvo puede reducir entre un <strong className="font-bold">5% y un 8%</strong> la captación energética diaria.
                    </p>
                    <button className="inline-block text-xs font-bold text-blue-600 hover:underline mb-3">Ver guía rápida de limpieza suave &rarr;</button>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Hace 2 días • Recomendación periódica</span>
                      <button 
                        onClick={() => setAlertsState(p => ({ ...p, maintenance: p.maintenance === 'pendiente' ? 'resuelta' : 'pendiente' }))}
                        className={`flex items-center gap-1.5 px-3 py-1 border rounded-md text-xs font-semibold transition-colors ${alertsState.maintenance === 'pendiente' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                      >
                        {alertsState.maintenance === 'pendiente' ? <span className="flex items-center gap-1">En espera</span> : <><Check className="w-3 h-3" /> Resuelto</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Connection */}
              {showConn && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Conexión restablecida con el medidor</h4>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold">Sistema Auto-recuperado</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 max-w-xl">
                      Breve desconexión de señal Wi-Fi de 4 minutos superada. La memoria interna volcó las lecturas sin pérdida de registros acumulados.
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Hace 4 días (18:22) • Telemetría intacta</span>
                      <button className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <Check className="w-3 h-3" /> Resuelto
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Canales de Alerta */}
          <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">Canales de Alerta</h3>
                  <p className="text-[11px] text-slate-500">Personaliza cuándo molestarte</p>
                </div>
              </div>
              <BellRing className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex flex-col gap-4 mb-6">
              {[
                { id: 'alto', title: 'Consumo inusualmente alto', desc: 'Avisar si se supera el umbral diario por más de 60 minutos seguidos.' },
                { id: 'resumen', title: 'Resumen semanal de ahorro', desc: 'Email los lunes con kWh autoconsumidos y dinero evitado.' },
                { id: 'caida', title: 'Caída solar en día despejado', desc: 'Detecta sombras repentinas, suciedad crítica o fallos de string.' },
                { id: 'excedente', title: 'Excedente inyectado en vivo', desc: 'Aviso móvil cada vez que viertes más de 2 kWh a la red eléctrica.' },
              ].map(toggle => (
                <div key={toggle.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-0.5">{toggle.title}</p>
                    <p className="text-[11px] text-slate-500 leading-snug">{toggle.desc}</p>
                  </div>
                  <button 
                    onClick={() => setToggles(p => ({ ...p, [toggle.id]: !p[toggle.id as keyof typeof p] }))}
                    className={`w-10 h-5 rounded-full flex ${toggles[toggle.id as keyof typeof toggles] ? 'justify-end bg-slate-800 dark:bg-slate-200' : 'justify-start bg-slate-200 dark:bg-slate-700'} p-0.5 shrink-0 transition-colors`}
                  >
                    <div className={`w-4 h-4 rounded-full shadow-sm ${toggles[toggle.id as keyof typeof toggles] ? 'bg-white dark:bg-slate-900' : 'bg-white'}`}></div>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-[11px] text-slate-500 mb-0.5">Destino: app móvil + correo</p>
              </div>
              <button className="text-xs font-bold text-amber-600 dark:text-amber-500 hover:underline">
                Gestionar contactos
              </button>
            </div>
          </div>

          {/* Ayuda */}
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-5">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-200 dark:bg-orange-800 rounded-xl flex items-center justify-center shrink-0">
                <LifeBuoy className="w-5 h-5 text-orange-700 dark:text-orange-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">¿Dudas con una lectura?</h3>
                <p className="text-[11px] text-slate-500">Técnicos especialistas Telar</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Si sospechas que un consumo reflejado no coincide con tus aparatos reales, podemos calibrar remotamente la pinza toroidal de tu cuadro eléctrico.
            </p>
            <button className="w-full py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors flex justify-center items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Solicitar revisión remota
            </button>
          </div>

          {/* Salud */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Salud de Componentes</h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Inversor Híbrido 5 kW</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">Normal (41°C)</span>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Pinza CT Cuadro General</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">Calibrada</span>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Módulo Wi-Fi / Nube Telar</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">-58 dBm (Fuerte)</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
