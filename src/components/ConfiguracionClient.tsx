'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Sun, 
  MapPin, 
  Zap, 
  Compass, 
  Calendar, 
  Banknote, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  LifeBuoy, 
  Beaker, 
  User, 
  Users, 
  Lock, 
  UserPlus, 
  Bell, 
  Activity,
  CheckCircle2,
  Copy,
  Check,
  Radio,
  ShieldCheck,
  X,
  AlertCircle,
  Cpu,
  Home,
  Trash2,
  LogOut,
  ArrowRightLeft,
  AlertTriangle,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { SimulatorControlModal } from "@/components/SimulatorControlModal";

interface HouseholdData {
  id: string;
  installation_name: string;
  location: string;
  capacity_kwp: string;
  orientation: string;
  start_date: string;
  utility_company: string;
  tariff_tier: string;
  import_rate: string;
  export_rate: string;
  currency: string;
  invite_code?: string;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface MemberData {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  name?: string | null;
  email?: string | null;
}

export interface MembershipData {
  id: string;
  household_id: string;
  role: string;
  household: {
    id: string;
    name: string;
    installation_name?: string;
    location?: string;
    capacity_kwp?: string;
    invite_code?: string;
  };
}

interface ConfiguracionClientProps {
  household: HouseholdData;
  user: UserData;
  members: MemberData[];
  userRole?: string;
  allMemberships?: MembershipData[];
  lastTelemetryTimestamp: string | null;
  updateSettingsAction: (formData: FormData) => Promise<{ success: boolean }>;
  updatePasswordAction?: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  inviteMemberAction?: (formData: FormData) => Promise<{ success: boolean; message?: string; error?: string }>;
  joinHouseholdAction?: (formData: FormData) => Promise<{ success: boolean; message?: string; error?: string }>;
  switchHouseholdAction?: (householdId: string) => Promise<{ success: boolean; error?: string }>;
  leaveHouseholdAction?: (householdId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  deleteHouseholdAction?: (householdId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  removeMemberAction?: (memberId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export function ConfiguracionClient({ 
  household, 
  user, 
  members, 
  userRole = 'viewer',
  allMemberships = [],
  lastTelemetryTimestamp, 
  updateSettingsAction,
  updatePasswordAction,
  joinHouseholdAction,
  switchHouseholdAction,
  leaveHouseholdAction,
  deleteHouseholdAction,
  removeMemberAction
}: ConfiguracionClientProps) {
  const [activeTab, setActiveTab] = useState<'hogares' | 'datos' | 'tarifa' | 'usuarios' | 'dispositivos'>('hogares');
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Household Management State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null);
  const [leaveConfirmId, setLeaveConfirmId] = useState<string | null>(null);
  const [leaveConfirmName, setLeaveConfirmName] = useState<string | null>(null);
  const [removeMemberConfirmId, setRemoveMemberConfirmId] = useState<string | null>(null);
  const [removeMemberConfirmName, setRemoveMemberConfirmName] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [householdActionMsg, setHouseholdActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [memberActionMsg, setMemberActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    installation_name: household.installation_name,
    location: household.location,
    capacity_kwp: household.capacity_kwp,
    orientation: household.orientation,
    start_date: household.start_date,
    utility_company: household.utility_company,
    tariff_tier: household.tariff_tier,
    import_rate: household.import_rate,
    export_rate: household.export_rate,
    currency: household.currency || 'COP',
  });

  // Simulation & Device State
  const [isSimulatingPulse, setIsSimulatingPulse] = useState(false);
  const [pulseFeedback, setPulseFeedback] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);

  // Join Household State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMsg, setJoinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Simulator Modal State
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);

  // Create Household Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalStage, setCreateModalStage] = useState<'form' | 'pairing'>('form');
  const [createPairingStep, setCreatePairingStep] = useState<1 | 2 | 3 | 4>(1);
  const [newlyCreatedHouseholdId, setNewlyCreatedHouseholdId] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [createLocation, setCreateLocation] = useState('');
  const [createCapacity, setCreateCapacity] = useState('4.2');
  const [createHasSolar, setCreateHasSolar] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Automated Hardware Pairing Sequence for Modal
  useEffect(() => {
    if (!isCreateModalOpen || createModalStage !== 'pairing') return;

    // Step 1 -> Step 2 after 1.8s
    const timer1 = setTimeout(() => {
      setCreatePairingStep(2);
    }, 1800);

    // Step 2 -> Step 3 after 3.6s
    const timer2 = setTimeout(() => {
      setCreatePairingStep(3);
      // Seed initial 1-day telemetry in background via REST API
      if (newlyCreatedHouseholdId) {
        fetch('/api/simulate/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days: 1, householdId: newlyCreatedHouseholdId })
        }).catch(err => console.warn('Sembrado diferido:', err));
      }
    }, 3600);

    // Step 3 -> Step 4 (Complete) after 5.4s
    const timer3 = setTimeout(() => {
      setCreatePairingStep(4);
    }, 5400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isCreateModalOpen, createModalStage, newlyCreatedHouseholdId]);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setCreateError('Por favor ingresa un nombre para el hogar.');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/household/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          location: createLocation.trim() || 'Bogotá, Cundinamarca',
          capacity_kwp: createHasSolar ? (createCapacity || '4.2') : '0'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreateError(data.error || 'Error al crear el hogar');
        setCreateLoading(false);
      } else {
        setNewlyCreatedHouseholdId(data.household_id || null);
        setCreateLoading(false);
        setCreatePairingStep(1);
        setCreateModalStage('pairing');
      }
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
      setCreateLoading(false);
    }
  };

  // Invite Member State (Preservado para cuando se integre proveedor SMTP)
  // const [inviteEmail, setInviteEmail] = useState('');
  // const [inviteRole, setInviteRole] = useState('viewer');
  // const [inviteLoading, setInviteLoading] = useState(false);
  // const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setIsSaved(false);
    setSaveSuccessMsg(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg(null);

    const fd = new FormData();
    fd.append('household_id', household.id);
    Object.entries(formData).forEach(([key, value]) => fd.append(key, value));
    
    try {
      if (updateSettingsAction) {
        await updateSettingsAction(fd);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('household-updated', {
            detail: { name: formData.installation_name }
          })
        );
      }
      setIsSaved(true);
      setSaveSuccessMsg('¡Parámetros guardados correctamente en la base de datos!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyInviteCode = () => {
    const code = household.invite_code || '8B741183';
    navigator.clipboard.writeText(code);
    setCopiedInviteCode(true);
    setTimeout(() => setCopiedInviteCode(false), 2500);
  };

  const handleJoinHouseholdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinHouseholdAction || !joinCodeInput.trim()) return;
    setJoinLoading(true);
    setJoinMsg(null);

    const fd = new FormData();
    fd.append('invite_code', joinCodeInput.trim().toUpperCase());

    const res = await joinHouseholdAction(fd);
    setJoinLoading(false);
    if (res.success) {
      setJoinMsg({ type: 'success', text: res.message || '¡Te has unido exitosamente al hogar!' });
      setJoinCodeInput('');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setJoinMsg({ type: 'error', text: res.error || 'Código de invitación no válido o expirado' });
    }
  };

  const handleSwitchHousehold = async (targetHouseholdId: string) => {
    if (targetHouseholdId === household.id) return;
    setIsSwitching(targetHouseholdId);
    setHouseholdActionMsg(null);
    try {
      if (switchHouseholdAction) {
        const res = await switchHouseholdAction(targetHouseholdId);
        if (res.success) {
          setTimeout(() => {
            window.location.href = '/configuracion';
          }, 100);
          return;
        } else {
          setHouseholdActionMsg({ type: 'error', text: res.error || 'Error al cambiar de hogar' });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar de hogar';
      setHouseholdActionMsg({ type: 'error', text: msg });
    } finally {
      setIsSwitching(null);
    }
  };

  const handleLeaveHousehold = async () => {
    if (!leaveConfirmId) return;
    setIsLeaving(leaveConfirmId);
    setHouseholdActionMsg(null);
    try {
      if (leaveHouseholdAction) {
        const res = await leaveHouseholdAction(leaveConfirmId);
        if (res.success) {
          setTimeout(() => {
            window.location.href = '/configuracion';
          }, 100);
          return;
        } else {
          setHouseholdActionMsg({ type: 'error', text: res.error || 'Error al salir del hogar' });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al salir del hogar';
      setHouseholdActionMsg({ type: 'error', text: msg });
    } finally {
      setIsLeaving(null);
      setLeaveConfirmId(null);
      setLeaveConfirmName(null);
    }
  };

  const handleDeleteHousehold = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(deleteConfirmId);
    setHouseholdActionMsg(null);
    try {
      if (deleteHouseholdAction) {
        const res = await deleteHouseholdAction(deleteConfirmId);
        if (res.success) {
          setTimeout(() => {
            window.location.href = '/configuracion';
          }, 100);
          return;
        } else {
          setHouseholdActionMsg({ type: 'error', text: res.error || 'Error al eliminar el hogar' });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar el hogar';
      setHouseholdActionMsg({ type: 'error', text: msg });
    } finally {
      setIsDeleting(null);
      setDeleteConfirmId(null);
      setDeleteConfirmName(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberConfirmId) return;
    setIsRemovingMember(removeMemberConfirmId);
    setMemberActionMsg(null);
    try {
      if (removeMemberAction) {
        const res = await removeMemberAction(removeMemberConfirmId);
        if (res.success) {
          setTimeout(() => {
            window.location.href = '/configuracion';
          }, 100);
          return;
        } else {
          setMemberActionMsg({ type: 'error', text: res.error || 'Error al remover miembro' });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al remover miembro';
      setMemberActionMsg({ type: 'error', text: msg });
    } finally {
      setIsRemovingMember(null);
      setRemoveMemberConfirmId(null);
      setRemoveMemberConfirmName(null);
    }
  };

  const handleTriggerSimulatedPulse = async () => {
    setIsSimulatingPulse(true);
    setPulseFeedback(null);
    try {
      const res = await fetch('/api/simulate/reading', { method: 'POST' });
      if (res.ok) {
        setPulseFeedback('Lectura IoT sincronizada en tiempo real');
      } else {
        setPulseFeedback('Error al emitir lectura de prueba');
      }
    } catch {
      setPulseFeedback('Error de comunicación con el endpoint');
    } finally {
      setIsSimulatingPulse(false);
      setTimeout(() => setPulseFeedback(null), 4000);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText('TELAR_HARDWARE_TOKEN_2026');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  /*
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteMemberAction) return;
    setInviteLoading(true);
    setInviteMsg(null);

    const fd = new FormData();
    fd.append('email', inviteEmail);
    fd.append('role', inviteRole);

    const res = await inviteMemberAction(fd);
    setInviteLoading(false);
    if (res.success) {
      setInviteMsg({ type: 'success', text: res.message || 'Invitación enviada' });
      setInviteEmail('');
      setTimeout(() => setInviteMsg(null), 4000);
    } else {
      setInviteMsg({ type: 'error', text: res.error || 'Error al enviar invitación' });
    }
  };
  */

  // Projected Monthly Savings Calculation
  const numericCapacity = parseFloat(formData.capacity_kwp) || 4.2;
  const numericImport = parseFloat(formData.import_rate) || 950;
  const projectedMonthlyKwh = Math.round(numericCapacity * 4.2 * 30);
  const projectedMonthlySavingsCop = Math.round(projectedMonthlyKwh * numericImport * 0.75);

  const panelCount = Math.max(1, Math.round(numericCapacity / 0.525));

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Configuración del Hogar e Instalación
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Administra los parámetros de tu vivienda, tarifas de energía y preferencias para calibrar tus métricas de ahorro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 w-full md:w-auto justify-start sm:justify-end">
          {saveSuccessMsg && (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> {saveSuccessMsg}
            </span>
          )}
          {isSaved && !saveSuccessMsg && (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" /> Sincronizado
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsSimulatorModalOpen(true)}
            className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-all shadow-sm"
          >
            <Cpu className="w-4 h-4 text-amber-500" />
            Simulador IoT
          </button>

          <button 
            onClick={() => handleSubmit()}
            disabled={isSaving}
            className={`flex-1 sm:flex-initial px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
              !isSaved 
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25 shadow-lg' 
                : 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white'
            }`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>


      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm overflow-x-auto hide-scrollbar">
        {[
          { id: 'hogares', label: 'Mis Hogares', icon: Home, count: allMemberships.length > 0 ? allMemberships.length : undefined },
          { id: 'datos', label: 'Datos del Hogar e Instalación', icon: Sun },
          { id: 'tarifa', label: 'Tarifa Eléctrica y Facturación', icon: Banknote },
          { id: 'usuarios', label: 'Usuarios y Permisos', icon: Users },
          { id: 'dispositivos', label: 'Dispositivos y Medidores', icon: Activity },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'hogares' | 'datos' | 'tarifa' | 'usuarios' | 'dispositivos')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="w-full flex flex-col gap-6">

          {/* ════════════ TAB 0: MIS HOGARES ════════════ */}
          {activeTab === 'hogares' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                      <Home className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Viviendas e Instalaciones Vinculadas
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Gestiona tus hogares, alterna de forma activa entre ellos o sal/elimina propiedades.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateError(null);
                        setCreateName('');
                        setCreateLocation('');
                        setCreateCapacity('4.2');
                        setCreateHasSolar(true);
                        setCreateModalStage('form');
                        setCreatePairingStep(1);
                        setNewlyCreatedHouseholdId(null);
                        setIsCreateModalOpen(true);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Crear Nuevo Hogar
                    </button>
                  </div>
                </div>

                {householdActionMsg && (
                  <div className={`p-4 rounded-2xl mb-6 text-xs font-semibold flex items-center gap-2 ${
                    householdActionMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}>
                    {householdActionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{householdActionMsg.text}</span>
                  </div>
                )}

                {/* List of User's Households */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {allMemberships?.map((m) => {
                    const isCurrent = m.household_id === household.id;
                    const isOwner = m.role === 'owner';
                    const cap = parseFloat(m.household.capacity_kwp || '0');

                    return (
                      <div 
                        key={m.id}
                        className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-500/40 shadow-sm ring-1 ring-amber-500/30'
                            : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isCurrent
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                              }`}>
                                <Home className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                  {m.household.installation_name || m.household.name}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  {m.household.location || 'Colombia'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isOwner
                                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                                  : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              }`}>
                                {isOwner ? '👑 Propietario' : 'Miembro'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 py-2 border-y border-slate-200/60 dark:border-slate-800/80 mb-4">
                            <span className="flex items-center gap-1">
                              <Sun className="w-3.5 h-3.5 text-amber-500" />
                              {cap > 0 ? `${cap} kWp Solar` : 'Solo Red'}
                            </span>
                            {m.household.invite_code && isOwner && (
                              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                                Código: {m.household.invite_code}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2">
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-4 h-4" /> Activo Actualmente
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSwitchHousehold(m.household_id)}
                              disabled={isSwitching === m.household_id}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                            >
                              {isSwitching === m.household_id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              )}
                              Cambiar a este Hogar
                            </button>
                          )}

                          <div>
                            {isOwner ? (
                              <button
                                onClick={() => {
                                  setDeleteConfirmId(m.household_id);
                                  setDeleteConfirmName(m.household.installation_name || m.household.name);
                                }}
                                title="Eliminar este hogar de forma permanente"
                                className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setLeaveConfirmId(m.household_id);
                                  setLeaveConfirmName(m.household.installation_name || m.household.name);
                                }}
                                title="Salir de este hogar"
                                className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors flex items-center gap-1.5"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Salir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Section to Join Another Household */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" /> Unirse a otra Vivienda con Código de Invitación
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    ¿Tienes el código de invitación de otra instalación o vivienda familiar? Ingrésalo aquí para vincular tu cuenta inmediatamente y alternar entre ellas cuando quieras.
                  </p>

                  <form onSubmit={handleJoinHouseholdSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                    <input
                      type="text"
                      placeholder="Ej. 8B741183"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                      type="submit"
                      disabled={joinLoading || !joinCodeInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
                    >
                      {joinLoading ? 'Vinculando...' : 'Unirme a este Hogar'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ TAB 1: DATOS DEL HOGAR ════════════ */}
          {activeTab === 'datos' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <Sun className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Detalles de la Instalación Solar</h3>
                    <p className="text-xs text-slate-500">Especificaciones físicas de tu vivienda y paneles solares</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold">
                  {panelCount} Módulos Activos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre de la Instalación</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Settings className="w-4 h-4 text-slate-400" />
                    </div>
                    <input 
                      name="installation_name" 
                      value={formData.installation_name} 
                      onChange={handleChange} 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ubicación Geográfica</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="w-4 h-4 text-slate-400" />
                    </div>
                    <input 
                      name="location" 
                      value={formData.location} 
                      onChange={handleChange} 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50" 
                    />
                  </div>
                </div>

                {/* Desglose de Módulos Solares (Retroalimentación Carlos) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Número de Módulos (Paneles)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Sun className="w-4 h-4 text-amber-500" />
                    </div>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      value={panelCount} 
                      onChange={(e) => {
                        const count = Math.max(0, parseInt(e.target.value) || 0);
                        const calculated = ((count * 525) / 1000).toFixed(2);
                        setFormData(prev => ({ ...prev, capacity_kwp: calculated }));
                        setIsSaved(false);
                      }}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Capacidad Pico Total (kWp)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Zap className="w-4 h-4 text-orange-400" />
                    </div>
                    <input 
                      name="capacity_kwp" 
                      type="number"
                      step="0.05"
                      min="0"
                      value={formData.capacity_kwp} 
                      onChange={handleChange} 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Orientación & Inclinación del Techo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Compass className="w-4 h-4 text-slate-400" />
                    </div>
                    <input 
                      name="orientation" 
                      value={formData.orientation} 
                      onChange={handleChange} 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha de Puesta en Marcha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <input 
                      name="start_date" 
                      type="date"
                      value={formData.start_date && formData.start_date.length === 10 ? formData.start_date : '2025-03-01'} 
                      onChange={handleChange} 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Especificación Física de Módulos
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Sun className="w-4 h-4 text-amber-500" />
                    </div>
                    <input 
                      readOnly
                      value={numericCapacity > 0 ? `${panelCount} Módulos Monocristalinos Tier 1 (525W c/u)` : 'Sin paneles solares (Monitoreo exclusivo de red)'} 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-default" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Potencia Unitaria por Panel
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <input 
                      readOnly
                      value="525 Watts pico (Wp) por módulo" 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-default" 
                    />
                  </div>
                </div>
              </div>


              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Inversor Monofásico Híbrido 5.0 kW</h4>
                    <p className="text-xs text-slate-500">Eficiencia de conversión promedio: 97.8% • Células Bifaciales</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Óptima irradiación</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ TAB 2: TARIFA ELÉCTRICA ════════════ */}
          {activeTab === 'tarifa' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Parámetros de Tarifa Eléctrica</h3>
                    <p className="text-xs text-slate-500">Estos valores calculan con exactitud cuánto dinero ahorras en cada lectura.</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold whitespace-nowrap">Regulación CREG 174</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Empresa Distribuidora</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="w-4 h-4 text-blue-500" />
                    </div>
                    <select 
                      name="utility_company" 
                      value={formData.utility_company} 
                      onChange={handleChange} 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                    >
                      <option value="EPM (Empresas Públicas de Medellín)">EPM (Empresas Públicas de Medellín)</option>
                      <option value="Enel Colombia (Bogotá / Cundinamarca)">Enel Colombia (Bogotá / Cundinamarca)</option>
                      <option value="Celsia Energía (Valle / Tolima)">Celsia Energía (Valle / Tolima)</option>
                      <option value="Air-e (Atlántico / Magdalena)">Air-e (Atlántico / Magdalena)</option>
                      <option value="Afinia (Grupo EPM - Caribe)">Afinia (Grupo EPM - Caribe)</option>
                      <option value="ESSA (Electrificadora Santander)">ESSA (Electrificadora Santander)</option>
                      <option value="CHEC (Central Hidroeléctrica Caldas)">CHEC (Central Hidroeléctrica Caldas)</option>
                      <option value="EMSA (Electrificadora del Meta)">EMSA (Electrificadora del Meta)</option>
                      <option value="Otra Distribuidora">Otra Distribuidora</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estrato / Segmento Tarifario</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Settings className="w-4 h-4 text-slate-400" />
                    </div>
                    <select 
                      name="tariff_tier" 
                      value={formData.tariff_tier} 
                      onChange={handleChange} 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                    >
                      <option value="Residencial (Estrato 6)">Residencial (Estrato 6)</option>
                      <option value="Residencial (Estrato 5)">Residencial (Estrato 5)</option>
                      <option value="Residencial (Estrato 4)">Residencial (Estrato 4)</option>
                      <option value="Residencial (Estrato 3)">Residencial (Estrato 3)</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Industrial">Industrial</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tarifa de consumo de red <span className="block font-normal text-xs text-slate-500">(Importación)</span></h4>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <input 
                      name="import_rate" 
                      type="number" 
                      value={formData.import_rate} 
                      onChange={handleChange} 
                      className="w-28 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    <span className="text-sm font-bold text-slate-500 mb-1">{formData.currency} / kWh</span>
                  </div>
                  <p className="text-xs text-slate-500">Costo evitado por cada kWh autoconsumido</p>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Compensación por excedentes <span className="block font-normal text-xs text-blue-600/70 dark:text-blue-400/70">inyectados</span></h4>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <input 
                      name="export_rate" 
                      type="number" 
                      value={formData.export_rate} 
                      onChange={handleChange} 
                      className="w-28 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    <span className="text-sm font-bold text-slate-500 mb-1">{formData.currency} / kWh</span>
                  </div>
                  <p className="text-xs text-slate-500">Valor retribuido según costo horario de bolsa</p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Ahorro Mensual Proyectado</h4>
                    <p className="text-xs text-slate-500">Estimación basada en {formData.capacity_kwp} kWp y tarifa de red actual</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-600 dark:text-amber-500 font-black text-lg">
                    ${projectedMonthlySavingsCop.toLocaleString('es-CO')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">{formData.currency} / mes</div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ TAB 3: USUARIOS Y PERMISOS ════════════ */}
          {activeTab === 'usuarios' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Miembros del Hogar</h3>
                      <p className="text-xs text-slate-500">Controla quién tiene acceso a las métricas y configuración de tu vivienda</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-bold">
                    {(() => {
                      const otherMembers = members.filter(m => m.user_id !== user.id);
                      return otherMembers.length === 0 ? '1 Usuario Activo' : `${otherMembers.length + 1} Usuarios`;
                    })()}
                  </span>
                </div>

                {memberActionMsg && (
                  <div className={`p-4 rounded-2xl mb-6 text-xs font-semibold flex items-center gap-2 ${
                    memberActionMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}>
                    {memberActionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{memberActionMsg.text}</span>
                  </div>
                )}

                {/* Member List */}
                <div className="space-y-3 mb-6">
                  {/* Current Authenticated User */}
                  {(() => {
                    const myMembership = members.find(m => m.user_id === user.id);
                    const myRole = myMembership?.role || userRole || 'owner';
                    const roleLabel = myRole === 'owner' ? 'Propietario (Owner)' : myRole === 'admin' ? 'Administrador' : 'Observador (Viewer)';
                    return (
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</h4>
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">Tú</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                            {roleLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Other members */}
                  {(() => {
                    const otherMembers = members.filter(m => m.user_id !== user.id);
                    if (otherMembers.length === 0) {
                      return (
                        <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                          <p className="text-xs text-slate-400">
                            No hay otros miembros en este hogar todavía. Comparte el código de invitación para vincular a tu familia o equipo técnico.
                          </p>
                        </div>
                      );
                    }

                    const isCallerOwner = userRole === 'owner' || members.find(m => m.user_id === user.id)?.role === 'owner';
                    const isCallerAdmin = userRole === 'admin' || members.find(m => m.user_id === user.id)?.role === 'admin';
                    const canManage = isCallerOwner || isCallerAdmin;

                    return otherMembers.map(member => {
                      const displayName = member.name || (member.email ? member.email.split('@')[0] : `Usuario ${member.user_id.slice(0, 6)}`);
                      const initials = displayName.slice(0, 2).toUpperCase();
                      const roleDisplay = member.role === 'owner' ? 'Propietario' : member.role === 'admin' ? 'Administrador' : 'Observador (Viewer)';

                      return (
                        <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/60">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {displayName}
                              </h4>
                              <p className="text-xs text-slate-500 truncate">
                                {member.email || `ID: ${member.user_id.slice(0, 12)}...`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {roleDisplay}
                            </span>

                            {canManage && member.role !== 'owner' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRemoveMemberConfirmId(member.id);
                                  setRemoveMemberConfirmName(displayName);
                                }}
                                disabled={isRemovingMember !== null}
                                title="Remover miembro del hogar"
                                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Household Invite Code Card */}
                <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 rounded-2xl p-5 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Código de Invitación de Este Hogar</h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Comparte este código para que otros usuarios se unan a este hogar desde sus cuentas sin crear una instalación vacía.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="font-mono text-base font-black tracking-widest text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700/60 px-3 py-1.5 rounded-xl shadow-sm">
                        {household.invite_code || '8B741183'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyInviteCode}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        {copiedInviteCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedInviteCode ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 
                  Opción de Invitar por Correo:
                  Ocultada visualmente mientras se integra un proveedor SMTP transaccional (Resend / SendGrid).
                  El código y handlers se conservan intactos para reactivarlo cuando sea necesario.
                */}
                {/* 
                  Opción de Invitar por Correo:
                  Ocultada visualmente mientras se integra un proveedor SMTP transaccional (Resend / SendGrid).
                  El código se conserva intacto aquí para reactivarlo cuando sea necesario:
                  
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-purple-500" /> Invitar a un Nuevo Miembro por Correo
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Ingresa el correo electrónico para otorgar acceso a este hogar en Telar Monitor.
                    </p>
                    ...
                  </div>
                */}

                {/* Join Another Household Form */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" /> Unirse a otro Hogar con Código
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    ¿Tienes el código de invitación de otra instalación o vivienda familiar? Ingrésalo aquí para vincular tu cuenta inmediatamente.
                  </p>

                  {joinMsg && (
                    <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                      joinMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {joinMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {joinMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleJoinHouseholdSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text"
                      value={joinCodeInput}
                      onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="Ej. 8B741183"
                      maxLength={12}
                      required
                      className="w-full sm:w-56 font-mono uppercase tracking-widest px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button 
                      type="submit"
                      disabled={joinLoading}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      {joinLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Vincular a Hogar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ TAB 4: DISPOSITIVOS Y MEDIDORES ════════════ */}
          {activeTab === 'dispositivos' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                      <Radio className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Medidor & Hardware IoT Conectado</h3>
                      <p className="text-xs text-slate-500">Microcontrolador ESP32 y sensores ópticos de pulsos Telar</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    En Línea
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Identificador de Dispositivo</span>
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">TLR-ESP32-{household.id.slice(0, 8).toUpperCase()}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Última Telemetría Recibida</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {lastTelemetryTimestamp ? new Date(lastTelemetryTimestamp).toLocaleTimeString('es-CO') : 'Recibiendo pulsos en vivo'}
                    </span>
                  </div>
                </div>

                {/* Simulator Integration Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Microservicio Backend Simulator & IoT
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                          Control Total
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Siembra datos de 7 o 30 días, emite pulsos de prueba o vacía registros duplicados de la base de datos.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSimulatorModalOpen(true)}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-amber-600/20 shrink-0"
                  >
                    <Beaker className="w-4 h-4" />
                    Abrir Panel del Simulador
                  </button>
                </div>

                {/* API Bearer Token */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Bearer Token de Hardware (ESP32)
                    </span>
                    <button 
                      onClick={handleCopyToken}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedToken ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-emerald-400 break-all select-all">
                    Bearer TELAR_HARDWARE_TOKEN_2026
                  </code>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Incluye este header en la petición POST a <code>/api/telemetry</code> desde el firmware Arduino/ESP32.
                  </p>
                </div>

                {/* Manual Pulse Trigger */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Prueba de Conectividad IoT</h4>
                    <p className="text-xs text-slate-500">Envía un pulso sintético para verificar la cadena completa de ingestión.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {pulseFeedback && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                        {pulseFeedback}
                      </span>
                    )}
                    <button
                      onClick={handleTriggerSimulatedPulse}
                      disabled={isSimulatingPulse}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                    >
                      {isSimulatingPulse ? <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                      Disparar Pulso de Prueba
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help Box */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-5 flex flex-col sm:flex-row gap-5 items-center justify-between">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center shrink-0">
                <LifeBuoy className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">¿Necesitas ayuda para calibrar tu tarifa o medidor?</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">El equipo de ingeniería de Telar está disponible para validar tus registros de inyección a la red con EPM.</p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <a 
                href="/.docs/guides/real-hardware-integration.md" 
                target="_blank"
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
              >
                Ver Documentación
              </a>
              <button 
                onClick={() => alert('Soporte Telar: Puedes escribir a soporte@telar.co o contactar al instalador')}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-800 transition-colors"
              >
                Contactar Asesor
              </button>
            </div>
          </div>

      </div>

      {/* Simulator & Telemetry Modal */}
      <SimulatorControlModal
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        household={{
          id: household.id,
          installation_name: household.installation_name,
          capacity_kwp: household.capacity_kwp,
        }}
      />

      {/* Delete Household Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">¿Eliminar este hogar?</h3>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Acción destructiva e irreversible</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Estás a punto de eliminar permanentemente <span className="font-bold text-slate-900 dark:text-white">{deleteConfirmName}</span>. Se borrarán todas las lecturas de telemetría de energía, alertas del sistema y miembros vinculados a esta instalación.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting !== null}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteHousehold}
                disabled={isDeleting !== null}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-sm transition-colors"
              >
                {isDeleting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar Hogar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Household Confirmation Modal */}
      {leaveConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">¿Salir de este hogar?</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Desvinculación de cuenta</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              ¿Deseas desvincular tu cuenta de <span className="font-bold text-slate-900 dark:text-white">{leaveConfirmName}</span>? Ya no podrás ver sus mediciones de consumo ni alertas a menos que el propietario te vuelva a compartir el código de invitación.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setLeaveConfirmId(null)}
                disabled={isLeaving !== null}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLeaveHousehold}
                disabled={isLeaving !== null}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2 shadow-sm transition-colors"
              >
                {isLeaving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                {isLeaving ? 'Saliendo...' : 'Sí, Salir del Hogar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Household Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full shadow-2xl relative transition-all ${
            createModalStage === 'pairing' ? 'max-w-xl' : 'max-w-md'
          }`}>
            
            {createModalStage === 'form' ? (
              <>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Crear Nuevo Hogar</h3>
                      <p className="text-xs text-slate-500">Configura una nueva vivienda o instalación</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {createError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateHousehold} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nombre del Hogar o Instalación *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Casa Campestre, Apto 502"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-900 dark:text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ubicación (Ciudad / Región)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Bogotá, Cundinamarca"
                        value={createLocation}
                        onChange={(e) => setCreateLocation(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-900 dark:text-white transition-all"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={createHasSolar}
                        onChange={(e) => setCreateHasSolar(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 dark:text-white">Tiene paneles solares fotovoltaicos</p>
                        <p className="text-slate-500">Habilita medición y telemetría solar</p>
                      </div>
                    </label>
                  </div>

                  {createHasSolar && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Capacidad Pico Instalada (kWp)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          value={createCapacity}
                          onChange={(e) => setCreateCapacity(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-900 dark:text-white transition-all"
                        />
                        <Sun className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Promedio residencial: entre 3.0 kWp y 6.0 kWp
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      disabled={createLoading}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2 shadow-sm transition-colors"
                    >
                      {createLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      {createLoading ? 'Creando Hogar...' : 'Crear Hogar'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Pairing Stage with Sensor Simulation & Telemetry Seeding */
              <div className="animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                      <Cpu className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        Vinculando Dispositivos IoT Telar
                      </h3>
                      <p className="text-xs text-slate-500">
                        Sincronizando sensores para <span className="font-bold text-amber-600">{createName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Paso {createPairingStep} de 4</span>
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-3 mb-6">
                  {/* Step 1: Energy Meter (ESP32 CT Clamp) */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    createPairingStep >= 1 
                      ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' 
                      : 'bg-slate-50/30 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          createPairingStep > 1 
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                        }`}>
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Medidor Telar IoT (ESP32 / Sensor CT)
                            <span className="text-[10px] font-mono font-normal text-slate-400">TELAR-MTR-8B</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Sensor de pinza CT para consumo total de la red eléctrica (60Hz, 120V/240V).
                          </p>
                        </div>
                      </div>
                      <div>
                        {createPairingStep === 1 ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Conectando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Vinculado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Solar Inverter or Grid Profile */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    createPairingStep >= 2 
                      ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' 
                      : 'bg-slate-50/30 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          createHasSolar
                            ? createPairingStep > 2
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        }`}>
                          {createHasSolar ? <Sun className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {createHasSolar ? `Inversor Solar Fotovoltaico (${createCapacity} kWp)` : 'Modo Monitoreo Exclusivo de Red'}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {createHasSolar 
                              ? 'Sincronizando bus Modbus/RS485 para generación solar e inyección.' 
                              : 'Instalación configurada para medición de red eléctrica sin paneles.'}
                          </p>
                        </div>
                      </div>
                      <div>
                        {createPairingStep < 2 ? (
                          <span className="text-[11px] text-slate-400 font-semibold shrink-0">En espera</span>
                        ) : createPairingStep === 2 ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {createHasSolar ? 'Sincronizando...' : 'Configurando...'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {createHasSolar ? 'Sincronizado' : 'Configurado'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Telemetry Calibration and Seeding */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    createPairingStep >= 3 
                      ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' 
                      : 'bg-slate-50/30 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          createPairingStep === 4 
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
                        }`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Calibración y Telemetría Inicial
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Generando historial de 24 horas para visualización inmediata en gráficos.
                          </p>
                        </div>
                      </div>
                      <div>
                        {createPairingStep < 3 ? (
                          <span className="text-[11px] text-slate-400 font-semibold shrink-0">En espera</span>
                        ) : createPairingStep === 3 ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 shrink-0">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calibrando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Listo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Action */}
                {createPairingStep === 4 ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col gap-3.5 animate-fade-in">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                          ¡Hogar configurado y vinculado exitosamente!
                        </h4>
                        <p className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                          Telemetría inicial generada. Ya puedes ver sus mediciones en tiempo real.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60">
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors text-center"
                      >
                        Ver en Mis Hogares
                      </button>
                      <button
                        type="button"
                        onClick={() => { window.location.href = '/'; }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ir al Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Estableciendo enlace seguro TLS y calibrando sensores...</span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {removeMemberConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">¿Remover a este miembro?</h3>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Desvinculación de usuario</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              ¿Estás seguro de que deseas desvincular a <span className="font-bold text-slate-900 dark:text-white">{removeMemberConfirmName}</span> de este hogar? Esta persona perderá el acceso a las mediciones y telemetría de esta instalación.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRemoveMemberConfirmId(null);
                  setRemoveMemberConfirmName(null);
                }}
                disabled={isRemovingMember !== null}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRemoveMember}
                disabled={isRemovingMember !== null}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-sm transition-colors"
              >
                {isRemovingMember ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {isRemovingMember ? 'Removiendo...' : 'Sí, Remover'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
