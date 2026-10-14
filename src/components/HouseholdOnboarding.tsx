'use client';

import React, { useState } from 'react';
import { Home, KeyRound, Plus, ArrowRight, Sun, MapPin, Zap } from 'lucide-react';
import { createHouseholdAction, joinHousehold } from '@/app/configuracion/actions';

interface HouseholdOnboardingProps {
  userEmail?: string;
}

export function HouseholdOnboarding({ userEmail }: HouseholdOnboardingProps) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Envigado, Antioquia');
  const [capacityKwp, setCapacityKwp] = useState('4.2');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('location', location);
    formData.append('capacity_kwp', capacityKwp);

    const res = await createHouseholdAction(formData);
    if (!res.success) {
      setErrorMsg(res.error || 'Error al crear el hogar');
      setLoading(false);
    } else {
      window.location.reload();
    }
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
                Configura una nueva vivienda o instalación fotovoltaica desde cero y sé el propietario principal.
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
                    placeholder="Ej. Hogar Las Palmas o Mi Casa Solar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ubicación (Ciudad / Región)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Ej. Envigado, Antioquia"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Capacidad Solar (kWp)
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>
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
      </div>
    </div>
  );
}
