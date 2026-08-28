-- ═══════════════════════════════════════════════════════════════════
-- TelarMonitor · Setup Database Script
-- Ejecutar en: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Tabla principal de lecturas ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.energy_readings (
  id           UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  reading_type TEXT           NOT NULL CHECK (reading_type IN ('consumption', 'solar_generation')),
  value_kwh    DECIMAL(10, 4) NOT NULL CHECK (value_kwh >= 0),
  recorded_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Índices para las consultas más frecuentes del dashboard
CREATE INDEX IF NOT EXISTS idx_er_type
  ON public.energy_readings (reading_type);

CREATE INDEX IF NOT EXISTS idx_er_recorded_at
  ON public.energy_readings (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_er_type_recorded
  ON public.energy_readings (reading_type, recorded_at DESC);

-- Row Level Security
ALTER TABLE public.energy_readings ENABLE ROW LEVEL SECURITY;

-- Lectura pública (el dashboard es interno, sin auth en Sprint 1-2)
CREATE POLICY "anon_read_energy"
  ON public.energy_readings FOR SELECT
  TO anon USING (true);

-- Inserción pública (para el simulador y el futuro hardware)
CREATE POLICY "anon_insert_energy"
  ON public.energy_readings FOR INSERT
  TO anon WITH CHECK (true);


-- ── 2. Tabla de configuración ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_settings"
  ON public.settings FOR SELECT
  TO anon USING (true);


-- ── 3. Valores por defecto ───────────────────────────────────────────
-- Tarifa residencial Colombia (COP/kWh). Fuente: CREG 2024.
-- Ajusta 'value' si la instalación tiene una tarifa diferente.
INSERT INTO public.settings (key, value) VALUES
  ('energy_rate_cop_per_kwh', '950'),
  ('currency',                'COP'),
  ('installation_name',       'Mi Instalación Solar')
ON CONFLICT (key) DO NOTHING;


-- ── Verificación ─────────────────────────────────────────────────────
SELECT 'energy_readings' AS tabla, COUNT(*) AS filas FROM public.energy_readings
UNION ALL
SELECT 'settings',                 COUNT(*)           FROM public.settings;
