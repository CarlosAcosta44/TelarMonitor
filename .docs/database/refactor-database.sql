-- ═══════════════════════════════════════════════════════════════════
-- TelarMonitor · Refactor Database Script (Sprint 2 - 5 Screens)
-- Ejecutar en: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Extensión de la tabla Settings (Configuración del Hogar) ─────
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS installation_name TEXT DEFAULT 'Hogar Las Palmas',
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Envigado, Antioquia',
ADD COLUMN IF NOT EXISTS capacity_kwp DECIMAL(10, 2) DEFAULT 4.2,
ADD COLUMN IF NOT EXISTS orientation TEXT DEFAULT 'Sur-Oeste (Inclinación 15°)',
ADD COLUMN IF NOT EXISTS start_date TEXT DEFAULT 'Marzo 2025',
ADD COLUMN IF NOT EXISTS utility_company TEXT DEFAULT 'EPM',
ADD COLUMN IF NOT EXISTS tariff_tier TEXT DEFAULT 'Residencial (Estrato 5)',
ADD COLUMN IF NOT EXISTS export_rate DECIMAL(10, 2) DEFAULT 650; -- Compensación por inyección

-- ── 2. Nueva tabla para el Centro de Diagnóstico (Alertas) ──────────
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'success')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at
  ON public.system_alerts (created_at DESC);

-- ── 3. Nueva tabla/vista (Opcional) para Resúmenes Diarios ──────────
-- Para que el Histórico y la Comparativa (Mes a Mes) carguen rápido.
-- En vez de sumar millones de lecturas cada vez que se carga la página.
CREATE OR REPLACE VIEW daily_energy_summary AS
SELECT 
    date_trunc('day', recorded_at) as summary_date,
    SUM(CASE WHEN reading_type = 'consumption' THEN value_kwh ELSE 0 END) as total_consumption,
    SUM(CASE WHEN reading_type = 'solar_generation' THEN value_kwh ELSE 0 END) as total_generation,
    SUM(CASE WHEN reading_type = 'solar_generation' THEN value_kwh ELSE -value_kwh END) as net_balance
FROM public.energy_readings
GROUP BY date_trunc('day', recorded_at);
