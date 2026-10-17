'use client';

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  KeyRound, 
  Plus, 
  ArrowRight, 
  Sun, 
  MapPin, 
  Zap, 
  Cpu, 
  Radio, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert,
  Sparkles,
  Loader2
} from 'lucide-react';
import { joinHousehold } from '@/app/configuracion/actions';

interface HouseholdOnboardingProps {
  userEmail?: string;
  notice?: string;
}

export function HouseholdOnboarding({ userEmail, notice }: HouseholdOnboardingProps) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join' | 'pairing'>('choose');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dismissedNotice, setDismissedNotice] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [hasSolarPanels, setHasSolarPanels] = useState(true);
  const [capacityKwp, setCapacityKwp] = useState('4.2');
  const [inviteCode, setInviteCode] = useState('');

  // Pairing Simulation States
  const [pairingStep, setPairingStep] = useState<1 | 2 | 3 | 4>(1);
  const [createdHouseholdId, setCreatedHouseholdId] = useState<string | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/household/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim() || 'Bogotá, Cundinamarca',
          capacity_kwp: hasSolarPanels ? (capacityKwp || '4.2') : '0'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Error al crear el hogar');
        setLoading(false);
      } else {
        setCreatedHouseholdId(data.household_id || null);
        setLoading(false);
        window.dispatchEvent(new CustomEvent('household-updated', { detail: { name: name } }));
        setMode('pairing');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  // Automated Hardware Pairing Sequence
  useEffect(() => {
    if (mode !== 'pairing') return;

    // Step 1 -> Step 2 after 1.8s
    const timer1 = setTimeout(() => {
      setPairingStep(2);
    }, 1800);

    // Step 2 -> Step 3 after 3.6s
    const timer2 = setTimeout(() => {
      setPairingStep(3);
      // Seed initial 1-day telemetry in background via REST API so graphs have data immediately without router refresh
      if (createdHouseholdId) {
        fetch('/api/simulate/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days: 1, householdId: createdHouseholdId })
        }).catch(err => console.warn('Sembrado inicial omitido o diferido:', err));
      }
    }, 3600);

    // Step 3 -> Step 4 (Complete) after 5.4s
    const timer3 = setTimeout(() => {
      setPairingStep(4);
    }, 5400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [mode, createdHouseholdId]);

  const handleCompletePairing = () => {
    window.location.href = '/';
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('invite_code', inviteCode);

    const res = await joinHousehold(formData);
    if (!res.success) {
      setErrorMsg(res.error || 'Código de invitación no válido');
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-10 px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4 shadow-sm">
            <Sun className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            ¡Bienvenido a Telar Monitor!
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {userEmail ? `Cuenta: ${userEmail}. ` : ''}
            Para visualizar las lecturas de energía solar y consumo, vincula tu cuenta a un hogar.
          </p>
        </div>

        {notice === 'sin_hogar' && !dismissedNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="text-left text-xs sm:text-sm">
                <p className="font-bold text-amber-900 dark:text-amber-100 mb-0.5">Sección no disponible aún</p>
                <p className="text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
                  Para poder acceder a las secciones del menú (Histórico, Ahorro, Alertas o Configuración), tu cuenta debe estar vinculada a un hogar. Por favor, crea un nuevo hogar o únete a uno existente usando el código de invitación.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setDismissedNotice(true)}
              className="text-amber-700/60 hover:text-amber-900 dark:text-amber-300/60 dark:hover:text-amber-100 p-1.5 rounded-lg transition-colors text-xs font-bold shrink-0 hover:bg-amber-500/10"
              title="Cerrar aviso"
            >
              ✕
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 text-center font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Mode Chooser */}
        {mode === 'choose' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Option 1: Create */}
            <button
              onClick={() => setMode('create')}
              className="flex flex-col text-left p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 transition-all shadow-sm hover:shadow-md group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Crear un Nuevo Hogar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Configura una nueva vivienda con paneles solares o solo con medición de consumo de red.
              </p>
              <div className="mt-auto flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <span>Configurar ahora</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Option 2: Join */}
            <button
              onClick={() => setMode('join')}
              className="flex flex-col text-left p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Unirse con Código PIN
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                ¿Tu familia o técnico ya crearon la instalación? Ingresa su código de invitación de 8 caracteres.
              </p>
              <div className="mt-auto flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                <span>Ingresar código</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {/* Mode: Create Form */}
        {mode === 'create' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Nuevo Hogar / Instalación</h3>
                  <p className="text-xs text-slate-500">Completa los datos iniciales de tu vivienda</p>
                </div>
              </div>
              <button 
                onClick={() => setMode('choose')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Volver
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre del Hogar o Instalación *
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Casa Acosta o Apartamento 402"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ubicación (Ciudad / Región)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Ej. Bogotá, Cundinamarca"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Solar Installation Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        ¿Cuenta con paneles solares?
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {hasSolarPanels ? 'Monitoreo combinado de consumo y autogeneración' : 'Monitoreo exclusivo de consumo de red eléctrica'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasSolarPanels}
                    onChange={(e) => setHasSolarPanels(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                {hasSolarPanels && (
                  <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Capacidad Solar Instalada (kWp)
                    </label>
                    <div className="relative">
                      <Zap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="4.2"
                        value={capacityKwp}
                        onChange={(e) => setCapacityKwp(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMode('choose')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                >
                  {loading ? 'Creando...' : 'Crear Hogar y Empezar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mode: Join Form */}
        {mode === 'join' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Unirse a Hogar con Código</h3>
                  <p className="text-xs text-slate-500">Ingresa el código alfanumérico de 8 caracteres</p>
                </div>
              </div>
              <button 
                onClick={() => setMode('choose')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Volver
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Código de Invitación (PIN) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder="Ej. 8B741183"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono text-lg font-black tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
                />
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  Pídele al propietario del hogar que copie su código desde el panel de Configuración &gt; Miembros.
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMode('choose')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                >
                  {loading ? 'Vinculando...' : 'Vincularme a este Hogar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mode: Pairing Simulation Wizard */}
        {mode === 'pairing' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <Cpu className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Vinculando Dispositivos IoT Telar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sincronizando telemetría y sensores para <span className="font-bold text-amber-600">{name}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Paso {pairingStep} de 4</span>
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-4 mb-8">
              {/* Step 1: Energy Meter (ESP32 CT Clamp) */}
              <div className={`p-4 rounded-2xl border transition-all ${
                pairingStep >= 1 
                  ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' 
                  : 'bg-slate-50/30 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      pairingStep > 1 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                    }`}>
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Medidor Telar IoT (ESP32 / Sensor CT)
                        <span className="text-[10px] font-mono font-normal text-slate-400">TELAR-MTR-8B</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Sensor de pinza amperimétrica CT para medir consumo total de la red eléctrica (60Hz, 120V/240V).
                      </p>
                    </div>
                  </div>
                  <div>
                    {pairingStep === 1 ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Conectando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4" /> Vinculado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Solar Inverter or Grid-Only Profile */}
              <div className={`p-4 rounded-2xl border transition-all ${
                pairingStep >= 2 
                  ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' 
                  : 'bg-slate-50/30 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      hasSolarPanels
                        ? pairingStep > 2
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                        : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    }`}>
                      {hasSolarPanels ? <Sun className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {hasSolarPanels ? `Inversor Solar Fotovoltaico (${capacityKwp} kWp)` : 'Modo Monitoreo Exclusivo de Red'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {hasSolarPanels 
                          ? 'Sincronizando bus de comunicación Modbus/RS485 para telemetría de generación solar e inyección.' 
                          : 'Configuración sin paneles solares. Las métricas fotovoltaicas permanecerán en cero kilowatt-hora.'}
                      </p>
                    </div>
                  </div>
                  <div>
                    {pairingStep < 2 ? (
                      <span className="text-xs text-slate-400 font-semibold">En espera</span>
                    ) : pairingStep === 2 ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> {hasSolarPanels ? 'Sincronizando...' : 'Configurando...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4" /> {hasSolarPanels ? 'Sincronizado' : 'Configurado'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Telemetry Initialization */}
              <div className={`p-4 rounded-2xl border transition-all ${
                pairingStep >= 3 
                  ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' 
                  : 'bg-slate-50/30 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      pairingStep === 4 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
                    }`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Calibración y Telemetría Inicial
                      </h4>
                      <p className="text-xs text-slate-500">
                        Inicializando lecturas de potencia activa, cálculo tarifario y primeros registros en tiempo real.
                      </p>
                    </div>
                  </div>
                  <div>
                    {pairingStep < 3 ? (
                      <span className="text-xs text-slate-400 font-semibold">En espera</span>
                    ) : pairingStep === 3 ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Calibrando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4" /> Listo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Final Action */}
            {pairingStep === 4 ? (
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      ¡Hogar configurado y vinculado exitosamente!
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Todos los sensores virtuales y parámetros de red están transmitiendo en vivo.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCompletePairing}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Entrar al Panel de Control</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>Estableciendo enlace seguro TLS con el gateway Telar...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
