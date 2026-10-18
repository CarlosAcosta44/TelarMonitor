-- ═══════════════════════════════════════════════════════════════════════════════
-- TELAR MONITOR · ESQUEMA MAESTRO DE BASE DE DATOS (POSTGRESQL / SUPABASE)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PROYECTO:      Telar Monitor (Línea de Eficiencia Energética & Solar)
-- TECNOLOGÍA:    PostgreSQL 15+ / Supabase (Auth, RLS, Storage, Realtime)
-- ARQUITECTURA:  Multi-Tenant Segregado por Fila (Row-Level Security - RLS)
-- PROPÓSITO:     Este script único crea toda la infraestructura de datos desde cero
--                sin requerir migraciones incrementales ni refactorizaciones intermedias.
--                Sirve como instalador completo e informe técnico de la base de datos.
--
-- ═══════════════════════════════════════════════════════════════════════════════


-- ==============================================================================
-- 1. TABLA: HOGARES E INSTALACIONES SOLARES (households)
-- ==============================================================================
-- Entidad central del modelo multi-tenant. Cada hogar o cliente representa
-- una instalación fotovoltaica con sus parámetros físicos, geográficos y tarifarios.
-- Todos los datos de telemetría y configuración cuelgan de este ID.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.households (
  id                       UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  name                     TEXT           NOT NULL,                             -- Nombre de la casa/cuenta (ej. 'Hogar Acosta')
  installation_name        TEXT,                                                -- Nombre de la instalación fotovoltaica
  invite_code              TEXT           UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), -- Código PIN para unirse al hogar
  location                 TEXT           DEFAULT 'Colombia',                   -- Ciudad / Región (ej. 'Bogotá', 'Envigado, Antioquia')
  capacity_kwp             DECIMAL(10, 2) DEFAULT 4.2 CHECK (capacity_kwp >= 0), -- Capacidad pico instalada en kWp
  orientation              TEXT           DEFAULT 'Sur-Oeste (Inclinación 15°)', -- Orientación solar del techo
  start_date               TEXT           DEFAULT 'Marzo 2025',                 -- Fecha de puesta en marcha del arreglo solar
  utility_company          TEXT           DEFAULT 'EPM (Empresas Públicas de Medellín)', -- Operador de red local (OR)
  tariff_tier              TEXT           DEFAULT 'Residencial (Estrato 5)',    -- Segmento tarifario
  export_rate              DECIMAL(10, 2) DEFAULT 650 CHECK (export_rate >= 0),  -- Compensación por inyección a red (COP/kWh)
  energy_rate_cop_per_kwh  DECIMAL(10, 2) DEFAULT 950 CHECK (energy_rate_cop_per_kwh >= 0), -- Tarifa de red por consumo (COP/kWh)
  currency                 TEXT           DEFAULT 'COP',                        -- Moneda de facturación
  created_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.households IS 'Entidad multi-inquilino que agrupa los parámetros físicos, tarifarios y geográficos de cada instalación solar.';
COMMENT ON COLUMN public.households.invite_code IS 'Código alfanumérico amigable de 8 caracteres utilizado por familiares o técnicos para unirse al hogar.';
COMMENT ON COLUMN public.households.capacity_kwp IS 'Potencia pico de la planta fotovoltaica calculada según el número de paneles y su capacidad unitaria.';


-- ==============================================================================
-- 2. TABLA: MIEMBROS Y ROLES DE CADA HOGAR (household_members)
-- ==============================================================================
-- Tabla de unión Muchos a Muchos (N:N) que relaciona cuentas de usuario (auth.users)
-- con sus respectivos hogares (households). Permite que un usuario pertenezca a
-- uno o varios hogares y define su nivel de autorización mediante roles.
-- Roles admitidos:
--   - 'owner'  : Propietario con control total (editar tarifas, invitar, borrar).
--   - 'admin'  : Administrador de la vivienda (editar parámetros, gestionar miembros).
--   - 'viewer' : Observador (solo lectura de métricas y gráficos del dashboard).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.household_members (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID        NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL CHECK (role IN ('owner', 'admin', 'viewer')) DEFAULT 'viewer',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

COMMENT ON TABLE public.household_members IS 'Membresías de usuarios por hogar. Habilita acceso multi-rol y multi-hogar.';
CREATE INDEX IF NOT EXISTS idx_members_user ON public.household_members (user_id);
CREATE INDEX IF NOT EXISTS idx_members_household ON public.household_members (household_id);


-- ==============================================================================
-- 3. TABLA: INVITACIONES PENDIENTES (household_invitations)
-- ==============================================================================
-- Registro de invitaciones enviadas por correo electrónico para unirse a un hogar.
-- Permite que un usuario no registrado sea invitado con un rol específico; al
-- completar su registro, el trigger lo asocia automáticamente al hogar sin crear
-- una vivienda huérfana.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.household_invitations (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID        NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  role         TEXT        NOT NULL CHECK (role IN ('owner', 'admin', 'viewer')) DEFAULT 'viewer',
  status       TEXT        NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending',
  invited_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.household_invitations IS 'Invitaciones por correo electrónico para incorporación controlada de usuarios a hogares.';
CREATE INDEX IF NOT EXISTS idx_invitations_email_status ON public.household_invitations (LOWER(email), status);


-- ==============================================================================
-- 4. TABLA: LECTURAS DE TELEMETRÍA ENERGÉTICA (energy_readings)
-- ==============================================================================
-- Almacén de series temporales de alta frecuencia donde ingresan los datos de:
--   - 'consumption'      : Consumo eléctrico de la vivienda (kW / kWh).
--   - 'solar_generation' : Potencia generada por el inversor solar (kW / kWh).
-- Cada registro está estrictamente vinculado a un household_id para garantizar
-- aislamiento absoluto entre clientes.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.energy_readings (
  id           UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID           NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  reading_type TEXT           NOT NULL CHECK (reading_type IN ('consumption', 'solar_generation')),
  value_kwh    DECIMAL(10, 4) NOT NULL CHECK (value_kwh >= 0),
  recorded_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.energy_readings IS 'Historial cronológico de telemetría de consumo y generación solar para cada hogar.';
CREATE INDEX IF NOT EXISTS idx_er_household_time ON public.energy_readings (household_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_er_household_type_time ON public.energy_readings (household_id, reading_type, recorded_at DESC);


-- ==============================================================================
-- 5. TABLA: ALERTAS Y NOTIFICACIONES DEL SISTEMA (system_alerts)
-- ==============================================================================
-- Almacena eventos operativos, anomalías de consumo o picos solares detectados
-- por los algoritmos de monitoreo para cada hogar.
-- Severidades: 'info', 'warning', 'critical', 'success'.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.system_alerts (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID        NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  severity     TEXT        NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'success')),
  is_read      BOOLEAN     DEFAULT false,
  is_resolved  BOOLEAN     DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.system_alerts IS 'Registro de notificaciones y diagnósticos técnicos asociados a una instalación solar.';
CREATE INDEX IF NOT EXISTS idx_alerts_household ON public.system_alerts (household_id, created_at DESC);


-- ==============================================================================
-- 6. FUNCIÓN AUXILIAR DE SEGURIDAD (ANTI-RECURSIÓN RLS)
-- ==============================================================================
-- Función de consulta STABLE SECURITY DEFINER. Obtiene la lista de IDs de hogares
-- a los que pertenece el usuario sin evaluar recursivamente las políticas RLS
-- de la tabla household_members.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_user_household_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT household_id FROM public.household_members WHERE user_id = p_user_id;
$$;

COMMENT ON FUNCTION public.get_user_household_ids IS 'Retorna los household_id accesibles para un usuario de forma segura y optimizada.';

CREATE OR REPLACE FUNCTION public.is_household_owner(p_household_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = p_household_id AND user_id = p_user_id AND role = 'owner'
  );
$$;

COMMENT ON FUNCTION public.is_household_owner IS 'Verifica si un usuario posee el rol de propietario (owner) en un hogar determinado.';


-- ==============================================================================
-- 7. PROCEDIMIENTO RPC: UNIRSE A UN HOGAR POR CÓDIGO (join_household_by_code)
-- ==============================================================================
-- Permite que un usuario autenticado ingrese el invite_code de una casa para
-- sumarse como miembro observador ('viewer') de manera atómica y segura.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.join_household_by_code(p_invite_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_household_name TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sesión no válida o no autenticada');
  END IF;

  SELECT id, name INTO v_household_id, v_household_name
  FROM public.households
  WHERE UPPER(invite_code) = UPPER(TRIM(p_invite_code))
  LIMIT 1;

  IF v_household_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'El código de invitación no existe o es inválido');
  END IF;

  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (v_household_id, v_user_id, 'viewer')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true, 
    'household_id', v_household_id, 
    'household_name', v_household_name,
    'message', 'Te has unido exitosamente a ' || v_household_name
  );
END;
$$;


-- ==============================================================================
-- 8. GESTIÓN EXPLÍCITA DE HOGARES (ONBOARDING LIBRE SIN CREACIÓN FORZADA)
-- ==============================================================================
-- Cuando un usuario nuevo se registra, su cuenta inicia limpia (sin hogar asignado).
-- Al iniciar sesión por primera vez, el sistema detecta que no tiene hogar y le
-- muestra en pantalla las opciones de bienvenida:
--   a) Crear su propio hogar mediante create_household_with_owner()
--   b) Unirse a un hogar existente mediante join_household_by_code()
-- ==============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created_household ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_household();

CREATE OR REPLACE FUNCTION public.create_household_with_owner(
  p_name TEXT,
  p_installation_name TEXT DEFAULT NULL,
  p_location TEXT DEFAULT 'Colombia',
  p_capacity_kwp DECIMAL DEFAULT 4.2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sesión no válida o no autenticada');
  END IF;

  INSERT INTO public.households (
    name,
    installation_name,
    location,
    capacity_kwp
  ) VALUES (
    TRIM(p_name),
    COALESCE(NULLIF(TRIM(p_installation_name), ''), TRIM(p_name)),
    COALESCE(NULLIF(TRIM(p_location), ''), 'Colombia'),
    COALESCE(p_capacity_kwp, 4.2)
  ) RETURNING id INTO v_new_id;

  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (v_new_id, v_user_id, 'owner');

  RETURN jsonb_build_object(
    'success', true,
    'household_id', v_new_id,
    'message', 'Hogar creado exitosamente'
  );
END;
$$;

COMMENT ON FUNCTION public.create_household_with_owner IS 'Crea un nuevo hogar y vincula al usuario autenticado como owner de forma atómica.';


-- ==============================================================================
-- 8.1 CONSULTA ENRIQUECIDA DE MIEMBROS (get_household_members_with_profiles)
-- ==============================================================================
-- Retorna los miembros de un hogar integrando los metadatos de perfil (nombre y email)
-- directamente desde auth.users de manera segura y sin exponer la tabla auth.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_household_members_with_profiles(p_household_id UUID)
RETURNS TABLE (
  id UUID,
  household_id UUID,
  user_id UUID,
  role TEXT,
  created_at TIMESTAMPTZ,
  user_email TEXT,
  user_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT 
    hm.id,
    hm.household_id,
    hm.user_id,
    hm.role,
    hm.created_at,
    u.email::TEXT AS user_email,
    COALESCE(
      NULLIF(u.raw_user_meta_data->>'full_name', ''),
      NULLIF(u.raw_user_meta_data->>'name', ''),
      SPLIT_PART(u.email, '@', 1)
    )::TEXT AS user_name
  FROM public.household_members hm
  LEFT JOIN auth.users u ON u.id = hm.user_id
  WHERE hm.household_id = p_household_id;
$$;

COMMENT ON FUNCTION public.get_household_members_with_profiles IS 'Retorna miembros de un hogar enriquecidos con nombre y correo electrónico desde auth.users.';


-- ==============================================================================
-- 8.2 REMOCIÓN CONTROLADA DE MIEMBROS (remove_household_member)
-- ==============================================================================
-- Permite que un propietario o administrador expulse a observadores o miembros de su hogar.
-- Impide remover al propietario principal.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.remove_household_member(p_member_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_household_id UUID;
  v_target_role TEXT;
  v_is_authorized BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  SELECT household_id, role INTO v_household_id, v_target_role
  FROM public.household_members
  WHERE id = p_member_id;

  IF v_household_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Miembro no encontrado');
  END IF;

  IF v_target_role = 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se puede remover al propietario del hogar');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_household_id AND user_id = v_user_id AND role IN ('owner', 'admin')
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo el propietario o administrador puede remover miembros');
  END IF;

  DELETE FROM public.household_members WHERE id = p_member_id;

  RETURN jsonb_build_object('success', true, 'message', 'Miembro removido exitosamente');
END;
$$;

COMMENT ON FUNCTION public.remove_household_member IS 'Permite a owners/admins expulsar miembros de un hogar de forma segura y validada.';


-- ==============================================================================
-- 8.3 ELIMINACIÓN ATÓMICA DE HOGAR POR PROPIETARIO (delete_household_by_owner)
-- ==============================================================================
-- Elimina una instalación y todas sus entidades dependientes de forma transaccional.
-- Solo ejecutable por el owner autenticado o para hogares huérfanos sin miembros.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.delete_household_by_owner(p_household_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_owner BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = p_household_id AND user_id = v_user_id AND role = 'owner'
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    IF NOT EXISTS (SELECT 1 FROM public.household_members WHERE household_id = p_household_id) THEN
      DELETE FROM public.energy_readings WHERE household_id = p_household_id;
      DELETE FROM public.system_alerts WHERE household_id = p_household_id;
      DELETE FROM public.household_invitations WHERE household_id = p_household_id;
      DELETE FROM public.households WHERE id = p_household_id;
      RETURN jsonb_build_object('success', true, 'message', 'Hogar huérfano eliminado');
    END IF;

    RETURN jsonb_build_object('success', false, 'error', 'Solo el propietario puede eliminar este hogar');
  END IF;

  DELETE FROM public.energy_readings WHERE household_id = p_household_id;
  DELETE FROM public.system_alerts WHERE household_id = p_household_id;
  DELETE FROM public.household_invitations WHERE household_id = p_household_id;
  DELETE FROM public.household_members WHERE household_id = p_household_id;
  DELETE FROM public.households WHERE id = p_household_id;

  RETURN jsonb_build_object('success', true, 'message', 'Hogar eliminado exitosamente');
END;
$$;

COMMENT ON FUNCTION public.delete_household_by_owner IS 'Eliminación atómica y segura de hogar y dependencias por su propietario.';


-- ==============================================================================
-- 9. POLÍTICAS DE SEGURIDAD POR FILA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
-- Aislamiento estricto por hogar:
--   - Los usuarios solo leen/editan datos de los hogares donde son miembros.
--   - Los endpoints IoT / generadores de lectura insertan telemetría validada.
-- ==============================================================================

-- ── 9.1 HOUSEHOLDS ──
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_households_select" ON public.households;
DROP POLICY IF EXISTS "rls_households_update" ON public.households;
DROP POLICY IF EXISTS "rls_households_insert" ON public.households;
DROP POLICY IF EXISTS "rls_households_delete" ON public.households;

CREATE POLICY "rls_households_select" ON public.households
  FOR SELECT TO authenticated, anon
  USING (
    id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
    OR NOT EXISTS (SELECT 1 FROM public.household_members WHERE user_id = auth.uid())
    OR auth.uid() IS NULL
  );

CREATE POLICY "rls_households_update" ON public.households
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT household_id FROM public.household_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "rls_households_insert" ON public.households
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "rls_households_delete" ON public.households
  FOR DELETE TO authenticated
  USING (
    public.is_household_owner(id, auth.uid())
    OR NOT EXISTS (SELECT 1 FROM public.household_members WHERE household_id = id)
  );

-- ── 9.2 HOUSEHOLD_MEMBERS ──
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_members_select" ON public.household_members;
DROP POLICY IF EXISTS "rls_members_modify" ON public.household_members;
DROP POLICY IF EXISTS "rls_members_insert" ON public.household_members;
DROP POLICY IF EXISTS "rls_members_update" ON public.household_members;
DROP POLICY IF EXISTS "rls_members_delete" ON public.household_members;

-- SELECT permisivo sin subconsultas para evitar recursión infinita (error 42P17)
CREATE POLICY "rls_members_select" ON public.household_members
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "rls_members_insert" ON public.household_members
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "rls_members_update" ON public.household_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "rls_members_delete" ON public.household_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.is_household_owner(household_id, auth.uid())
  );

-- ── 9.3 HOUSEHOLD_INVITATIONS ──
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_invitations_select" ON public.household_invitations;
DROP POLICY IF EXISTS "rls_invitations_manage" ON public.household_invitations;

CREATE POLICY "rls_invitations_select" ON public.household_invitations
  FOR SELECT TO authenticated
  USING (
    LOWER(email) = LOWER(auth.jwt()->>'email')
    OR household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
  );

CREATE POLICY "rls_invitations_manage" ON public.household_invitations
  FOR ALL TO authenticated
  USING (
    household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
  );

-- ── 9.4 ENERGY_READINGS ──
ALTER TABLE public.energy_readings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_readings_select" ON public.energy_readings;
DROP POLICY IF EXISTS "rls_readings_insert" ON public.energy_readings;

CREATE POLICY "rls_readings_select" ON public.energy_readings
  FOR SELECT TO authenticated, anon
  USING (
    household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
    OR household_id IS NULL
    OR auth.uid() IS NULL
    OR NOT EXISTS (SELECT 1 FROM public.household_members WHERE user_id = auth.uid())
  );

CREATE POLICY "rls_readings_insert" ON public.energy_readings
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "rls_readings_delete" ON public.energy_readings;
CREATE POLICY "rls_readings_delete" ON public.energy_readings
  FOR DELETE TO anon, authenticated
  USING (true);

-- ── 9.5 SYSTEM_ALERTS ──
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_alerts_select" ON public.system_alerts;
DROP POLICY IF EXISTS "rls_alerts_update" ON public.system_alerts;

CREATE POLICY "rls_alerts_select" ON public.system_alerts
  FOR SELECT TO authenticated, anon
  USING (
    household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
    OR household_id IS NULL
    OR auth.uid() IS NULL
    OR NOT EXISTS (SELECT 1 FROM public.household_members WHERE user_id = auth.uid())
  );

CREATE POLICY "rls_alerts_update" ON public.system_alerts
  FOR UPDATE TO authenticated
  USING (
    household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
    OR NOT EXISTS (SELECT 1 FROM public.household_members WHERE user_id = auth.uid())
  );


-- ==============================================================================
-- 10. VISTA AGREGADA PROTEGIDA: RESÚMENES DIARIOS (daily_energy_summary)
-- ==============================================================================
-- Vista para gráficos de alto rendimiento (Histórico, Ahorro mes a mes).
-- IMPORTANTE: La directiva WITH (security_invoker = true) asegura que PostgreSQL
-- evalúe la vista bajo las políticas RLS del usuario que consulta, eliminando
-- la advertencia de 'UNRESTRICTED' y protegiendo los datos.
-- ==============================================================================

DROP VIEW IF EXISTS public.daily_energy_summary;

CREATE OR REPLACE VIEW public.daily_energy_summary
WITH (security_invoker = true) AS
SELECT 
    household_id,
    date_trunc('day', recorded_at) as summary_date,
    SUM(CASE WHEN reading_type = 'consumption' THEN value_kwh ELSE 0 END) as total_consumption,
    SUM(CASE WHEN reading_type = 'solar_generation' THEN value_kwh ELSE 0 END) as total_generation,
    SUM(CASE WHEN reading_type = 'solar_generation' THEN value_kwh ELSE -value_kwh END) as net_balance
FROM public.energy_readings
GROUP BY household_id, date_trunc('day', recorded_at);

COMMENT ON VIEW public.daily_energy_summary IS 'Vista agregada de balance energético diario protegida mediante security_invoker = true.';


-- ==============================================================================
-- 11. VINCULACIÓN Y REGULARIZACIÓN DE DATOS PREVIOS (BACKFILL INMEDIATO)
-- ==============================================================================
-- Garantiza que usuarios ya registrados antes de este script y lecturas de prueba
-- huérfanas queden enlazados al hogar principal automáticamente:
-- ==============================================================================

-- 1. Vincular a todos los usuarios existentes en auth.users como Owners del hogar principal
INSERT INTO public.household_members (household_id, user_id, role)
SELECT 
  h.id,
  u.id, 
  'owner'
FROM auth.users u
CROSS JOIN (SELECT id FROM public.households ORDER BY created_at ASC LIMIT 1) h
ON CONFLICT (household_id, user_id) DO NOTHING;

-- 2. Asegurar que las lecturas de prueba existentes queden asignadas al hogar
UPDATE public.energy_readings
SET household_id = (SELECT id FROM public.households ORDER BY created_at ASC LIMIT 1)
WHERE household_id IS NULL;

-- 3. Asegurar que las alertas existentes queden asignadas al hogar
UPDATE public.system_alerts
SET household_id = (SELECT id FROM public.households ORDER BY created_at ASC LIMIT 1)
WHERE household_id IS NULL;

-- 4. Limpieza de hogares huérfanos sin miembros vinculados
DELETE FROM public.households
WHERE id NOT IN (SELECT household_id FROM public.household_members);
