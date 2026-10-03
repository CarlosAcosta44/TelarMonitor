'use client';

import { useState } from 'react';
import { 
  Settings, 
  Save, 
  Check, 
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
  FileText, 
  Phone, 
  Beaker, 
  User, 
  Users, 
  Lock, 
  UserPlus, 
  Bell, 
  Activity,
  CheckCircle2
} from "lucide-react";

export function ConfiguracionClient({ initialSettings, updateSettingsAction }: any) {
  const [activeTab, setActiveTab] = useState('datos');
  const [isSaved, setIsSaved] = useState(true);
  const [mvpActive, setMvpActive] = useState(true);
  const [refreshRate, setRefreshRate] = useState(10);

  const [formData, setFormData] = useState({
    installation_name: initialSettings.installationName || 'Hogar Las Palmas',
    location: initialSettings.location || 'Envigado, Antioquia • Colombia',
    capacity_kwp: initialSettings.capacityKwp || '4.2',
    orientation: initialSettings.orientation || 'Sur-Oeste (Inclinación 15°)',
    start_date: initialSettings.startDate || 'Marzo 2025',
    utility_company: initialSettings.utilityCompany || 'EPM (Empresas Públicas de Medellín)',
    tariff_tier: initialSettings.tariffTier || 'Residencial (Estrato 5)',
    import_rate: '950',
    export_rate: initialSettings.exportRate || '650',
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setIsSaved(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => fd.append(key, value));
    
    // Call server action if available
    if (updateSettingsAction) {
      await updateSettingsAction(fd);
    }
    
    setIsSaved(true);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
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
          {isSaved && (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" /> Todos los cambios sincronizados
            </span>
          )}
          <button 
            onClick={handleSubmit}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm ${!isSaved ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-800 dark:bg-slate-700 text-white'}`}
          >
            <Save className="w-4 h-4" /> Guardar Cambios
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm overflow-x-auto hide-scrollbar">
        {[
          { id: 'datos', label: 'Datos del Hogar e Instalación' },
          { id: 'tarifa', label: 'Tarifa Eléctrica y Facturación', icon: Banknote },
          { id: 'usuarios', label: 'Usuarios y Permisos', icon: Users },
          { id: 'dispositivos', label: 'Dispositivos y Medidores', icon: Activity },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {!tab.icon && <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Detalles Instalacion */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Detalles de la Instalación Solar</h3>
                  <p className="text-[11px] text-slate-500">Especificaciones físicas de tu arreglo fotovoltaico</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold">8 Módulos Activos</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre de la Instalación</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Settings className="w-4 h-4 text-slate-400" />
                  </div>
                  <input name="installation_name" value={formData.installation_name} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ubicación Geográfica</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <input name="location" value={formData.location} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Capacidad Instalada de Paneles</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Zap className="w-4 h-4 text-orange-400" />
                  </div>
                  <input name="capacity_kwp" value={formData.capacity_kwp + ' kWp (8 Paneles solares de 5...)'} onChange={() => {}} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" readOnly />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Orientación & Inclinación del techo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Compass className="w-4 h-4 text-slate-400" />
                  </div>
                  <input name="orientation" value={formData.orientation} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha de puesta en marcha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  <input name="start_date" value={formData.start_date} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Inversor Monofásico Híbrido 5.0 kW</h4>
                  <p className="text-xs text-slate-500">Eficiencia de conversión promedio: 97.8%</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Óptima irradiación solar</span>
              </div>
            </div>
          </div>

          {/* Parametros de Tarifa */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Parámetros de Tarifa Eléctrica</h3>
                  <p className="text-[11px] text-slate-500">Estos valores permiten a Telar Monitor calcular con exactitud cuánto dinero ahorras en cada lectura.</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold whitespace-nowrap">Regulación CREG 174</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Empresa Distribuidora</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <input name="utility_company" value={formData.utility_company} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estrato / Segmento Tarifario</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Settings className="w-4 h-4 text-slate-400" />
                  </div>
                  <select name="tariff_tier" value={formData.tariff_tier} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="Residencial (Estrato 5)">Residencial (Estrato 5)</option>
                    <option value="Residencial (Estrato 4)">Residencial (Estrato 4)</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-5 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tarifa de consumo de red <span className="block font-normal text-xs text-slate-500">(Importación)</span></h4>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <input name="import_rate" type="number" value={formData.import_rate} onChange={handleChange} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-sm font-bold text-slate-500 mb-1">COP / kWh</span>
                </div>
                <p className="text-[11px] text-slate-500">Costo evitado por cada kWh autoconsumido</p>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Compensación por excedentes <span className="block font-normal text-xs text-blue-600/70 dark:text-blue-400/70">inyectados</span></h4>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <input name="export_rate" type="number" value={formData.export_rate} onChange={handleChange} className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-sm font-bold text-slate-500 mb-1">COP / kWh</span>
                </div>
                <p className="text-[11px] text-slate-500">Valor retribuido según costo horario de bolsa</p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Ahorro Mensual Proyectado</h4>
                  <p className="text-[11px] text-slate-500">Estimación basada en irradiación histórica de Envigado</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-amber-600 dark:text-amber-500 font-black">~$465.000</div>
                <div className="text-[10px] text-slate-400 font-bold">COP / mes</div>
              </div>
            </div>
          </div>

          {/* Help Box */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-center justify-between">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center shrink-0">
                <LifeBuoy className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">¿Necesitas ayuda para calibrar tu tarifa o medidor?</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">El equipo de ingeniería de Telar está disponible para validar tus registros de inyección a la red con EPM.</p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                Ver Documentación
              </button>
              <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-800 transition-colors">
                Contactar Asesor Telar
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Simulacion MVP */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Beaker className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Simulación & Datos MVP</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">Controla los parámetros de telemetría en vivo para pruebas del prototipo Telar.</p>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex justify-between items-center mb-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Datos en vivo MVP</h4>
                <p className="text-[10px] text-slate-500">Generador virtual activo</p>
              </div>
              <button 
                onClick={() => setMvpActive(!mvpActive)}
                className={`w-12 h-6 rounded-full flex p-1 shrink-0 transition-colors ${mvpActive ? 'justify-end bg-emerald-600' : 'justify-start bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Frecuencia de Actualización</label>
              <div className="flex gap-2">
                {[5, 10, 30].map(val => (
                  <button 
                    key={val}
                    onClick={() => setRefreshRate(val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${refreshRate === val ? 'bg-orange-700 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
                  >
                    {val} seg
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Escenario Demostrativo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Sun className="w-4 h-4 text-orange-500" />
                </div>
                <select className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 appearance-none">
                  <option>Día soleado típico (Pico 3.8kW)</option>
                  <option>Día nublado (Pico 1.2kW)</option>
                  <option>Noche (0kW)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-lg p-3 flex justify-between items-center text-xs">
              <span className="text-slate-500">Último pulso IoT sincronizado</span>
              <span className="font-bold text-slate-900 dark:text-white">Hace 4 seg</span>
            </div>
          </div>

          {/* Gestion de Cuenta */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gestión de Cuenta</h3>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline">Editar</button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-3">
              <img src="https://ui-avatars.com/api/?name=Familia+Restrepo&background=0D8ABC&color=fff&rounded=true" alt="Avatar" className="w-10 h-10 rounded-full shadow-sm" />
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">Familia Restrepo</h4>
                <p className="text-[11px] text-slate-500 truncate">restrepo.solar@palmas.com</p>
              </div>
            </div>

            <button className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-3 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cambiar contraseña</span>
              </div>
              <span className="text-slate-400">&gt;</span>
            </button>

            <button className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-3 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3 text-left">
                <UserPlus className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Invitar miembro del hogar</span>
              </div>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold whitespace-nowrap">2 activos</span>
            </button>

            <button className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-6 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3 text-left">
                <Bell className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notificaciones de red y batería</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 text-right leading-tight">WhatsApp<br/>& Push</span>
            </button>

            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4">
              <span className="text-[11px] text-slate-500">ID Instalación Telar</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">TLR-ENV-2025-09</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
