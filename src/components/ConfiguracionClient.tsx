'use client';

import { useState } from 'react';
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
  Cpu
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
}

interface ConfiguracionClientProps {
  household: HouseholdData;
  user: UserData;
  members: MemberData[];
  lastTelemetryTimestamp: string | null;
  updateSettingsAction: (formData: FormData) => Promise<{ success: boolean }>;
  updatePasswordAction?: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  inviteMemberAction?: (formData: FormData) => Promise<{ success: boolean; message?: string; error?: string }>;
  joinHouseholdAction?: (formData: FormData) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export function ConfiguracionClient({ 
  household, 
  user, 
  members, 
  lastTelemetryTimestamp, 
  updateSettingsAction,
  updatePasswordAction,
  joinHouseholdAction
}: ConfiguracionClientProps) {
  const [activeTab, setActiveTab] = useState<'datos' | 'tarifa' | 'usuarios' | 'dispositivos'>('datos');
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

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
  const [mvpActive, setMvpActive] = useState(true);
  const [refreshRate, setRefreshRate] = useState(10);
  const [isSimulatingPulse, setIsSimulatingPulse] = useState(false);
  const [pulseFeedback, setPulseFeedback] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);

  // Join Household State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMsg, setJoinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Simulator Modal State
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);

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
      setTimeout(() => setJoinMsg(null), 4000);
    } else {
      setJoinMsg({ type: 'error', text: res.error || 'Código de invitación no válido o expirado' });
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatePasswordAction) return;
    setPasswordLoading(true);
    setPasswordMsg(null);

    const fd = new FormData();
    fd.append('new_password', newPassword);

    const res = await updatePasswordAction(fd);
    setPasswordLoading(false);
    if (res.success) {
      setPasswordMsg({ type: 'success', text: 'Contraseña actualizada con éxito' });
      setNewPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordMsg(null);
      }, 2000);
    } else {
      setPasswordMsg({ type: 'error', text: res.error || 'Error al cambiar contraseña' });
    }
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

        <div className="flex items-center gap-4">
          {saveSuccessMsg && (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> {saveSuccessMsg}
            </span>
          )}
          {isSaved && !saveSuccessMsg && (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" /> Sincronizado
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsSimulatorModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-all shadow-sm"
          >
            <Cpu className="w-4 h-4 text-amber-500" />
            Simulador IoT
          </button>

          <button 
            onClick={() => handleSubmit()}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
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
          { id: 'datos', label: 'Datos del Hogar e Instalación', icon: Sun },
          { id: 'tarifa', label: 'Tarifa Eléctrica y Facturación', icon: Banknote },
          { id: 'usuarios', label: 'Usuarios y Permisos', icon: Users },
          { id: 'dispositivos', label: 'Dispositivos y Medidores', icon: Activity },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'datos' | 'tarifa' | 'usuarios' | 'dispositivos')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 cols) - Dynamic Tab Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
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

                {/* Member List */}
                <div className="space-y-3 mb-6">
                  {/* Current Authenticated User */}
                  {(() => {
                    const myMembership = members.find(m => m.user_id === user.id);
                    const myRole = myMembership?.role || 'owner';
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
                    return otherMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-full bg-slate-400 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            MB
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">Miembro ({member.role})</h4>
                            <p className="text-xs text-slate-500 truncate">ID: {member.user_id.slice(0, 12)}...</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                          {member.role}
                        </span>
                      </div>
                    ));
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

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Simulacion MVP */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Beaker className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Simulación & Datos MVP</h3>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${mvpActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">Controla los parámetros de telemetría en vivo para pruebas del prototipo Telar.</p>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex justify-between items-center mb-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Datos en vivo MVP</h4>
                <p className="text-[10px] text-slate-500">{mvpActive ? 'Generador virtual activo' : 'Generador pausado'}</p>
              </div>
              <button 
                onClick={() => setMvpActive(!mvpActive)}
                className={`w-12 h-6 rounded-full flex p-1 shrink-0 transition-colors ${mvpActive ? 'justify-end bg-emerald-600' : 'justify-start bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Frecuencia de Actualización</label>
              <div className="flex gap-2">
                {[5, 10, 30].map(val => (
                  <button 
                    key={val}
                    onClick={() => setRefreshRate(val)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${refreshRate === val ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
                  >
                    {val} seg
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <button
                onClick={handleTriggerSimulatedPulse}
                disabled={isSimulatingPulse}
                className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                {isSimulatingPulse ? 'Sincronizando...' : 'Generar Pulso Manual'}
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 flex justify-between items-center text-xs">
              <span className="text-slate-500">Último pulso IoT sincronizado</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {lastTelemetryTimestamp ? new Date(lastTelemetryTimestamp).toLocaleTimeString('es-CO') : 'Hace 10 seg'}
              </span>
            </div>
          </div>

          {/* Gestion de Cuenta con Datos Reales */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gestión de Cuenta</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                Sesión Activa
              </span>
            </div>

            {/* Real User Profile */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center shadow-sm shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</h4>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* Change Password Button */}
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cambiar contraseña</span>
              </div>
              <span className="text-slate-400 text-xs font-bold">&gt;</span>
            </button>

            {/* Invite Household Member Button */}
            <button 
              onClick={() => setActiveTab('usuarios')}
              className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-left">
                <UserPlus className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Invitar miembro del hogar</span>
              </div>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold whitespace-nowrap">
                {members.length + 1} activos
              </span>
            </button>

            {/* Notifications Button */}
            <div className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6">
              <div className="flex items-center gap-3 text-left">
                <Bell className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notificaciones de red</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 text-right leading-tight">
                Push & Web
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4 mb-2">
              <span className="text-xs text-slate-500">ID Hogar Telar</span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                {household.id.slice(0, 15)}...
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Código de Invitación</span>
              <button
                type="button"
                onClick={handleCopyInviteCode}
                className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2 py-1 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1"
                title="Copiar código de invitación"
              >
                {household.invite_code || '8B741183'}
                {copiedInviteCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cambiar Contraseña</h3>
                <p className="text-xs text-slate-500">Actualiza tu clave de acceso a Telar Monitor</p>
              </div>
            </div>

            {passwordMsg && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {passwordMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nueva Contraseña</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                >
                  {passwordLoading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

    </div>
  );
}
