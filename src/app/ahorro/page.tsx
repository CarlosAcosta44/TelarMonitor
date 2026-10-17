import { SupabaseEnergyReadingRepository } from "@/infrastructure/supabase/SupabaseEnergyReadingRepository";
import { AhorroChart } from "@/components/AhorroChart";
import { Leaf, Calendar, TrendingUp, Sun, Banknote, CloudLightning } from "lucide-react";
import { createClient } from "@/infrastructure/supabase/server";

export const revalidate = 60;

export default async function AhorroPage() {
  const supabase = await createClient();
  const energyRepo = new SupabaseEnergyReadingRepository(supabase);

  // Fetch active household details
  const { data: { user } } = await supabase.auth.getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let household: any = null;
  if (user) {
    const { data: memberRows } = await supabase
      .from('household_members')
      .select('household_id, households (*)')
      .eq('user_id', user.id)
      .limit(1);

    if (memberRows && memberRows.length > 0 && memberRows[0].households) {
      household = memberRows[0].households;
    }
  }

  if (!household) {
    const { data: households } = await supabase
      .from('households')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    household = households?.[0] || null;
  }

  const installationName = household?.installation_name || household?.name || 'Tu Instalación Solar';
  const TARIFA = Number(household?.energy_rate_cop_per_kwh) || 950;
  const EXPORT_RATE = Number(household?.export_rate) || 650;

  // Fetch exactly the daily summaries for 2026
  const summaries = await energyRepo.getDailySummaries(2026).catch(() => []);

  let totalConsumido = 0;
  let totalSolarGenerado = 0;

  const monthlyData = Array(12).fill(null).map(() => ({
    facturaSinSistema: 0,
    facturaConSistema: 0
  }));

  summaries.forEach(day => {
    totalConsumido += day.total_consumption;
    totalSolarGenerado += day.total_generation;
    
    const month = new Date(day.summary_date).getMonth();
    
    const dailyFacturaSinSistema = day.total_consumption * TARIFA;
    const gridConsumption = Math.max(0, day.total_consumption - day.total_generation);
    const exportedEnergy = Math.max(0, day.total_generation - day.total_consumption);
    
    const dailyFacturaConSistema = (gridConsumption * TARIFA) - (exportedEnergy * EXPORT_RATE);
    
    monthlyData[month].facturaSinSistema += dailyFacturaSinSistema;
    monthlyData[month].facturaConSistema += dailyFacturaConSistema;
  });

  // Calculate global stats
  const totalSinSistema = monthlyData.reduce((acc, m) => acc + m.facturaSinSistema, 0);
  const totalConSistema = monthlyData.reduce((acc, m) => acc + Math.max(0, m.facturaConSistema), 0);
  const ahorroTotal = totalSinSistema - totalConSistema;
  const ahorroPercent = totalSinSistema ? (ahorroTotal / totalSinSistema) * 100 : 0;
  
  const autonomia = totalConsumido ? (totalSolarGenerado / totalConsumido) * 100 : 0;
  const autonomiaCap = Math.min(autonomia, 100);

  // Environmental impact
  // 1 kWh = ~0.38 kg CO2
  const co2AvoidedKg = totalSolarGenerado * 0.38;
  const co2AvoidedTon = co2AvoidedKg / 1000;
  const treesEquivalent = Math.round(co2AvoidedKg / 20); // ~20kg per tree/year
  
  // Electric car km: ~0.15 kWh/km
  const kmClean = totalSolarGenerado / 0.15;

  // Chart Data (first 10 months to match design Ene-Oct)
  const chartData = monthlyData.slice(0, 10).map((m, i) => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct"];
    const percent = m.facturaSinSistema ? ((m.facturaSinSistema - Math.max(0, m.facturaConSistema)) / m.facturaSinSistema) * 100 : 0;
    return {
      label: monthNames[i],
      estimada: Math.round(m.facturaSinSistema),
      real: Math.round(Math.max(0, m.facturaConSistema)),
      ahorroPercent: Math.round(percent),
    };
  });

  const capacityKwp = Number(household?.capacity_kwp) || 0;
  const hasSolar = capacityKwp > 0;

  return (
    <>
      <div className="flex flex-col gap-6 max-w-[1200px] mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Leaf className="w-5 h-5" />
              </div>
              <h2 className="text-[13px] font-bold tracking-widest text-emerald-700 dark:text-emerald-400 uppercase">
                {hasSolar ? 'EFICIENCIA ENERGÉTICA & RETORNO' : 'GESTIÓN DE COSTOS & EFICIENCIA'}
              </h2>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {hasSolar ? 'Comparativa y Ahorro' : 'Costos de Energía y Proyección'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {hasSolar
                ? 'Descubre cuánto dinero has ahorrado en tu factura eléctrica y el impacto ambiental tangible que genera tu hogar día tras día.'
                : 'Analiza el costo acumulado de tu consumo eléctrico de red y descubre el potencial de ahorro si incorporas autogeneración solar.'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            {/* Currency Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button className="px-4 py-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-xs font-bold text-slate-900 dark:text-white">
                COP ($)
              </button>
              <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                USD ($)
              </button>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Año 2026 (Acumulado)
              </span>
            </div>
          </div>
        </div>

        {/* Bloque 1: Ahorro Neto Consolidado o Costo Acumulado */}
        <div className={`glass-card p-8 border-l-[6px] ${hasSolar ? 'border-l-emerald-400' : 'border-l-blue-500'} relative overflow-hidden`}>
          <div className={`absolute right-0 top-0 w-64 h-full bg-gradient-to-l ${hasSolar ? 'from-emerald-50 to-transparent dark:from-emerald-900/10' : 'from-blue-50 to-transparent dark:from-blue-900/10'} opacity-60`}></div>
          
          <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">
            {/* Left side */}
            <div className="flex-1 max-w-lg">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${hasSolar ? 'bg-emerald-200 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'} mb-4`}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-xs font-bold tracking-wide uppercase">
                  {hasSolar ? 'Ahorro Neto Consolidado' : 'Costo Acumulado de Red'}
                </span>
              </div>
              
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  ${Math.round(hasSolar ? ahorroTotal : totalSinSistema).toLocaleString('es-CO')}
                </span>
                <span className="text-xl font-bold text-slate-500">COP</span>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                {hasSolar ? (
                  <>Has evitado pagar el <strong className="text-emerald-600 dark:text-emerald-400">{Math.round(ahorroPercent)}%</strong> de la tarifa eléctrica tradicional gracias a la captación directa de tus paneles solares.</>
                ) : (
                  <>Total acumulado facturado a tarifa de <strong className="text-blue-600 dark:text-blue-400">${TARIFA} COP/kWh</strong>. Un sistema solar fotovoltaico podría reducir hasta un 70% de este valor.</>
                )}
              </p>

              {/* Progress Bar */}
              <div className="mb-2 flex justify-between items-end">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {hasSolar ? 'Autonomía Solar del Hogar' : 'Suministro Eléctrico'}
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {hasSolar ? `${autonomia.toFixed(2)}% Autosuficiente` : '100% Red Eléctrica'}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2 flex">
                <div className={`h-full ${hasSolar ? 'bg-emerald-500 rounded-l-full' : 'bg-blue-500 rounded-full'}`} style={{ width: `${hasSolar ? autonomiaCap : 0}%` }}></div>
                <div className={`h-full ${hasSolar ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ width: `${hasSolar ? 100 - autonomiaCap : 100}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-500"/> {hasSolar ? 'Solar (Generación pura)' : 'Sin generación solar'}</div>
                <div className="flex items-center gap-1.5"><CloudLightning className="w-3.5 h-3.5 text-blue-500"/> Red convencional</div>
              </div>
            </div>

            {/* Right side: 3 mini cards */}
            <div className="w-full lg:w-[480px] flex flex-col justify-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 mb-1 leading-tight">{hasSolar ? 'Sin paneles (Est.)' : 'Factura 2026'}</p>
                  <p className={`text-sm font-black ${hasSolar ? 'text-red-600 line-through decoration-red-600/30 decoration-2' : 'text-slate-900 dark:text-white'}`}>
                    ${Math.round(totalSinSistema / 1000).toLocaleString('es-CO')}k
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Acumulado</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 mb-1 leading-tight">{hasSolar ? 'Pago real red' : 'Promedio Mes'}</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white">
                    ${Math.round((hasSolar ? totalConSistema : totalSinSistema / 10) / 1000).toLocaleString('es-CO')}k
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium text-blue-500">{hasSolar ? 'Noche / lluvia' : 'Gasto mensual'}</p>
                </div>
                <div className="bg-emerald-300 dark:bg-emerald-600 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1.5 bg-emerald-400 dark:bg-emerald-700 rounded-bl-lg">
                    <span className="text-[9px] font-black text-emerald-900 dark:text-emerald-50">
                      {hasSolar ? `+${Math.round(ahorroPercent)}%` : 'Potencial'}
                    </span>
                  </div>
                  <p className="text-xs font-black text-emerald-900 dark:text-emerald-50 mb-1 leading-tight">{hasSolar ? 'AHORRO' : 'AHORRO POTENCIAL'}</p>
                  <p className="text-sm font-black text-emerald-900 dark:text-white">
                    ${Math.round((hasSolar ? ahorroTotal : totalSinSistema * 0.7) / 1000).toLocaleString('es-CO')}k
                  </p>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-200 mt-2 font-medium">{hasSolar ? 'Retenido' : 'Estimado 70%'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                    {hasSolar ? '28% Recuperado del Costo Total' : 'ROI Solar Estimado en Medellín'}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500">
                    Punto de equilibrio: <strong>3.4 años (Retorno acelerado)</strong>
                  </p>
                </div>
                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${hasSolar ? 'bg-amber-600 w-[28%]' : 'bg-emerald-500 w-[100%]'} rounded-full`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque 2: Histórico Comparativo Mes a Mes */}
        <div className="glass-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Histórico Comparativo Mes a Mes</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Contraste directo entre el costo tradicional sin sistema vs. tu factura real con Telar</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800"></div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Factura estimada tradicional</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-emerald-600"></div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Factura real pagada</span>
              </div>
            </div>
          </div>
          <AhorroChart data={chartData} />
        </div>

        {/* Bloque 3: Impacto & Simulador */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Impacto Ambiental */}
          <div className="glass-card p-6 lg:col-span-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Leaf className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-900 dark:text-white">Impacto Ambiental & Sostenibilidad</h3>
                <p className="text-xs text-slate-500">Aportes reales a la reducción de huella de carbono</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-black text-slate-500 tracking-wider mb-4 uppercase">CO₂ EVITADO</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mb-2">{co2AvoidedTon.toFixed(1)} Toneladas</p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 leading-snug">
                  Equivalente a plantar <strong className="font-bold">{treesEquivalent} árboles</strong> maduros.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-black text-slate-500 tracking-wider mb-4 uppercase">KM LIMPIOS</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mb-2">{Math.round(kmClean).toLocaleString('es-CO')} km</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-snug">
                  Recorridos en coche eléctrico con <strong className="font-bold text-slate-900 dark:text-white">cero emisiones.</strong>
                </p>
              </div>

              <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <p className="text-xs font-black text-slate-500 tracking-wider mb-4 uppercase">GENERACIÓN NETA</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mb-2">{Math.round(totalSolarGenerado).toLocaleString('es-CO')} kWh</p>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-500 leading-snug">
                  <strong className="font-bold">100% fotovoltaica</strong> captada en techo propio.
                </p>
              </div>
            </div>

            <div className="mt-auto flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <div className="p-1 bg-emerald-100 dark:bg-emerald-800 rounded-full">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              </div>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                Tu instalación en <strong className="font-bold">{installationName}</strong> ha superado el <strong className="font-bold">92%</strong> de eficiencia de absorción proyectada para el ciclo meteorológico 2026.
              </p>
            </div>
          </div>

          {/* Simulador & Consejos */}
          <div className="glass-card p-6 lg:col-span-4 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-900 dark:text-white">Simulador & Consejos</h3>
                <p className="text-xs text-slate-500">Recomendaciones para maximizar retorno</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white max-w-[60%]">Optimiza el aire acondicionado</p>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 text-right">+$45.000<br/><span className="text-[10px] uppercase font-bold tracking-widest">COP/mes</span></span>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  Programar el encendido a las <strong className="font-bold text-slate-900 dark:text-white">13:00 hrs</strong> aprovecha el pico de radiación solar directa sin usar energía de la red ni desgastar baterías.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white max-w-[60%]">Venta de excedentes a la red</p>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400 text-right">+$39.900<br/><span className="text-[10px] uppercase font-bold tracking-widest">COP</span></span>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  Este mes inyectaste <strong className="font-bold text-slate-900 dark:text-white">42 kWh</strong> de excedentes a la red, reconocidos como crédito directo aplicable a tu factura.
                </p>
              </div>
            </div>

            <button className="mt-auto w-full py-3.5 rounded-xl bg-[#0f172a] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              Ajustar Reglas de Automatización
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
