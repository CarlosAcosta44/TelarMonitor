-- ═══════════════════════════════════════════════════════════════════
-- TelarMonitor · Multi-Tenant & Auth Migration Script
-- Ejecutar en: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Create Households (Hogares) Table ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  capacity_kwp DECIMAL(10, 2),
  orientation TEXT,
  start_date TEXT,
  utility_company TEXT,
  tariff_tier TEXT,
  export_rate DECIMAL(10, 2),
  energy_rate_cop_per_kwh DECIMAL(10, 2) DEFAULT 950,
  currency TEXT DEFAULT 'COP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for households
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- ── 2. Create Household Members Table (Users <-> Households) ─────────
-- Links Supabase Auth users to households.
CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'viewer')) DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Enable RLS for household members
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Members (A user can read their own memberships)
CREATE POLICY "Users can read their memberships" 
  ON public.household_members FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- RLS Policies for Households (A user can read households they belong to)
CREATE POLICY "Users can read their households"
  ON public.households FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = public.households.id 
      AND user_id = auth.uid()
    )
  );


-- ── 3. Migrate & Alter Energy Readings ───────────────────────────────
-- Add household_id to energy_readings
ALTER TABLE public.energy_readings 
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- For existing data, we might want to create a default household and assign it.
DO $$ 
DECLARE
  default_household_id UUID;
BEGIN
  -- Create a default household if it doesn't exist
  INSERT INTO public.households (name, location, capacity_kwp) 
  VALUES ('Hogar Las Palmas', 'Envigado, Antioquia', 4.2)
  RETURNING id INTO default_household_id;
  
  -- Update existing energy readings that don't have a household_id
  UPDATE public.energy_readings 
  SET household_id = default_household_id 
  WHERE household_id IS NULL;
END $$;

-- Now make household_id required
ALTER TABLE public.energy_readings 
ALTER COLUMN household_id SET NOT NULL;

-- Update RLS for energy readings
-- Users can only read readings from households they belong to
DROP POLICY IF EXISTS "anon_read_energy" ON public.energy_readings;
CREATE POLICY "Users can read their household energy readings"
  ON public.energy_readings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = public.energy_readings.household_id 
      AND user_id = auth.uid()
    )
  );

-- For hardware/telemetry insertion, we can allow authenticated service role, 
-- or a specific API key if needed. For now, authenticated users or anon with specific checks.
-- We'll keep anon insert open for the endpoint until we implement API keys for devices.


-- ── 4. Migrate & Alter System Alerts ─────────────────────────────────
-- Add household_id to system_alerts
ALTER TABLE public.system_alerts 
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

DO $$ 
DECLARE
  default_household_id UUID;
BEGIN
  SELECT id INTO default_household_id FROM public.households WHERE name = 'Hogar Las Palmas' LIMIT 1;
  
  UPDATE public.system_alerts 
  SET household_id = default_household_id 
  WHERE household_id IS NULL;
END $$;

ALTER TABLE public.system_alerts 
ALTER COLUMN household_id SET NOT NULL;

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their household alerts"
  ON public.system_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = public.system_alerts.household_id 
      AND user_id = auth.uid()
    )
  );


-- ── 5. Drop deprecated settings table ────────────────────────────────
-- The `settings` table was a key-value store without household context.
-- Settings are now moved to columns in the `households` table.
-- We can drop it or keep it for global app settings, but we should drop it to enforce multi-tenancy.
DROP TABLE IF EXISTS public.settings;


-- ── 6. Recreate daily_energy_summary View ────────────────────────────
-- The view must now group by household_id as well
DROP VIEW IF EXISTS daily_energy_summary;

CREATE OR REPLACE VIEW daily_energy_summary AS
SELECT 
    household_id,
    date_trunc('day', recorded_at) as summary_date,
    SUM(CASE WHEN reading_type = 'consumption' THEN value_kwh ELSE 0 END) as total_consumption,
    SUM(CASE WHEN reading_type = 'solar_generation' THEN value_kwh ELSE 0 END) as total_generation,
    SUM(CASE WHEN reading_type = 'solar_generation' THEN value_kwh ELSE -value_kwh END) as net_balance
FROM public.energy_readings
GROUP BY household_id, date_trunc('day', recorded_at);
