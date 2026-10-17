# ⚠️ Reglas, Restricciones y Lecciones Aprendidas (Guía Antierrores) — Telar Monitor

> **DOCUMENTO OBLIGATORIO PARA CUALQUIER AGENTE O DESARROLLADOR QUE TRABAJE EN ESTE REPOSITORIO.**  
> Este compendio documenta las reglas arquitectónicas, los errores ya cometidos en el pasado, sus soluciones definitivas y las advertencias críticas para mantener la estabilidad del sistema.

---

## 📑 Tabla de Contenidos
1. [Base de Datos, Supabase y Seguridad RLS](#1-base-de-datos-supabase-y-seguridad-rls)
2. [Soporte Dual: Hogares Con Solar vs. Sin Solar](#2-soporte-dual-hogares-con-solar-vs-sin-solar)
3. [Clean Architecture y Separación de Responsabilidades](#3-clean-architecture-y-separación-de-responsabilidades)
4. [Microservicio Independiente (`backend-simulator/`)](#4-microservicio-independiente-backend-simulator)
5. [Rendimiento, Polling y Gráficas Históricas](#5-rendimiento-polling-y-gráficas-históricas)
6. [Flujo de Git, Commits y Calidad TypeScript](#6-flujo-de-git-commits-y-calidad-typescript)
7. [Catálogo de Errores Pasados y Solución Definitiva](#7-catálogo-de-errores-pasados-y-solución-definitiva)

---

## 1. Base de Datos, Supabase y Seguridad RLS

### ⛔ Advertencia Crítica: Operaciones `DELETE` con RLS
* **Error cometido:** Intentar vaciar o borrar filas de `energy_readings` mediante el cliente de Supabase (`.delete()`). En PostgreSQL/Supabase, si una tabla tiene **Row Level Security (RLS)** activado y no existe una política explícita para la operación `DELETE`, la API devuelve código HTTP `204 No Content` (éxito aparente) pero **elimina 0 filas silenciosamente**.
* **Regla:** Toda tabla con RLS debe contar con políticas explícitas para `SELECT`, `INSERT`, `UPDATE` y `DELETE`. En `.docs/database/schema.sql` debe mantenerse siempre:
  ```sql
  CREATE POLICY "rls_readings_delete" 
  ON public.energy_readings FOR DELETE 
  TO anon, authenticated USING (true);
  ```
* **Para limpiar lecturas masivas:** La vía más rápida y recomendada es ejecutar en el SQL Editor de Supabase:
  ```sql
  TRUNCATE TABLE public.energy_readings;
  ```

### ⛔ Prevención de Duplicación Masiva de Telemetría
* **Error cometido:** Ejecutar comandos de sembrado múltiples veces sin limpiar la tabla acumuló más de 19.000 filas. Esto triplicó los registros para el mismo minuto, rompió el escaneo de rangos históricos (`LIMIT 2880`) y generó gráficas en zigzag.
* **Regla:** 
  1. Nunca ejecutar sembrados masivos sin limpiar la tabla previamente o usar `--clean`.
  2. Los scripts de sembrado (`scripts/seed-readings.mjs`, `npm run simulate:seed:30`) deben generar timestamps únicos y espaciados exactamente a intervalos de 15 minutos.

### ⛔ Onboarding vs Trigger Automático de Usuario
* **Error cometido:** Un trigger en la base de datos creaba un hogar genérico inmediatamente al registrarse un usuario en `auth.users`, impidiéndole unirse a un hogar existente mediante código PIN.
* **Regla:** Al registrarse un usuario nuevo, debe mostrarse la pantalla de bienvenida (`HouseholdOnboarding`) permitiéndole elegir entre:
  * **Crear un Nuevo Hogar** (se convierte en `owner`).
  * **Unirse con Código PIN** (se vincula como `member`/`viewer`).

### ⛔ Seguridad en `daily_energy_summary`
* **Regla:** Ninguna tabla debe quedar con el estado "unrestricted" en el panel de Supabase. La tabla `daily_energy_summary` debe tener siempre `ALTER TABLE public.daily_energy_summary ENABLE ROW LEVEL SECURITY;`.

---

## 2. Soporte Dual: Hogares Con Solar vs. Sin Solar

El sistema **NO asume** que todos los hogares tienen paneles solares. Debe operar impecablemente para dos públicos:

### A. Hogar Con Paneles Solares (`capacity_kwp > 0`)
* **Dashboard (`/`):**
  * Tarjeta central: Muestra **Solar Generado** (kWh) y **% de Cobertura Solar**.
  * Tarjeta derecha: Muestra **Ahorro Estimado** en COP.
  * Tarjeta de Balance: Muestra balance neto solar vs red (*Autosuficiente* vs *Dependiente*).
  * Gráfica Histórica: Doble curva: **Solar (Amarillo)** vs. **Consumo (Azul)**.
* **Histórico (`/historico`):** Métricas de mayor rendimiento solar y días de autonomía (>80%).
* **Ahorro (`/ahorro`):** Retorno de inversión (ROI), ahorro neto retenido y CO₂ evitado.

### B. Hogar Sin Paneles Solares (`capacity_kwp === 0`)
* **Dashboard (`/`):**
  * Tarjeta central: Se transforma automáticamente en **"Costo Estimado Hoy"** (`kWh consumidos * $950 COP`).
  * Tarjeta derecha: Muestra **"Proyección Mensual"** en COP.
  * Tarjeta de Balance: Pasa a modo **"Suministro de Red"** (100% red eléctrica comercial).
  * Tarjeta Solar: Informa *"No instalado / Monitoreo exclusivo de red"*.
  * Gráfica Histórica: Muestra únicamente la curva de **Consumo (Azul)**; la leyenda oculta la etiqueta solar para no confundir al usuario.
* **Histórico (`/historico`):** Muestra "Costo Total Estimado", "Pico de Consumo" y "Promedio Diario (kWh/día)".
* **Ahorro (`/ahorro`):** Muestra el gasto facturado y calcula una simulación de **Ahorro Potencial Solar (hasta 70%)** si el usuario decidiera instalar paneles fotovoltaicos.
* **Sembrador de datos:** Si `capacity_kwp === 0`, el script **NUNCA** debe insertar registros de tipo `solar_generation`.

---

## 3. Clean Architecture y Separación de Responsabilidades

El proyecto sigue estrictamente **Clean Architecture**:

```
src/
├── domain/            # Reglas de negocio puras, interfaces y entidades (Sin dependencias externas)
├── application/       # Casos de uso (Orquestan lógica: GetHistoricalReadings, GetDailySummary, etc.)
├── infrastructure/    # Implementaciones concretas (SupabaseEnergyReadingRepository, SupabaseSettingsRepository)
└── components/ / app/ # Capa de Presentación (React UI, Server Components, Server Actions)
```

### ⛔ Reglas de Capas (Inviolables)
1. **Los componentes de UI NUNCA consultan directamente a Supabase:**  
   Siempre deben interactuar mediante un Caso de Uso (`src/application/use-cases/`) o una Server Action (`actions.ts`) que utilice la capa de repositorios.
2. **El dominio no importa frameworks:**  
   `src/domain/` no puede importar nada de Next.js, React ni Supabase.
3. **El origen de datos simulado es un detalle de infraestructura:**  
   La UI y los casos de uso deben tratar los datos como telemetría real. Si el día de mañana se conecta un inversor físico por MQTT o API REST, solo cambia la implementación en `infrastructure/`.

---

## 4. Microservicio Independiente (`backend-simulator/`)

### ⛔ Desacoplamiento Total del Simulador
* **Propósito:** El simulador telemétrico en tiempo real vive en la carpeta `backend-simulator/` para facilitar su desarrollo conjunto, pero **está diseñado para ser extraído a su propio repositorio de GitHub y desplegado en Railway**.
* **Regla de TypeScript:** El archivo raíz `tsconfig.json` de Next.js **DEBE excluir explícitamente `"backend-simulator"`**:
  ```json
  "exclude": ["node_modules", "backend-simulator"]
  ```
  Esto evita que el compilador de Next.js intente validar los paquetes independientes de Express/Socket.IO.
* **Regla de Git:** `backend-simulator/node_modules`, `backend-simulator/dist` y `backend-simulator/.env` están estrictamente ignorados en `.gitignore`.
* **Despliegue:** Incluye `Dockerfile` multi-etapa y `railway.json`. No agregar dependencias de Next.js dentro de `backend-simulator/`.

---

## 5. Rendimiento, Polling y Gráficas Históricas

### ⛔ No usar Auto-Refresh agresivo de 1 segundo
* **Error cometido:** En etapas tempranas se implementó un `setInterval` de 1 segundo que recargaba la página, saturando la base de datos y bloqueando la interfaz.
* **Regla:** Las páginas del dashboard utilizan Server Components con revalidación controlada (`export const revalidate = 60`). Para telemetría en tiempo real de alta frecuencia se debe utilizar la conexión por WebSockets de `backend-simulator/`.

### ⛔ Interpretación de kW vs kWh en Intervalos
* Las lecturas en `energy_readings.value_kwh` representan potencia instantánea registrada en intervalos de 15 minutos (0.25 horas).
* Para calcular energía acumulada en kWh sobre intervalos de 15 min:
  $$\text{Energía (kWh)} = \frac{\text{Potencia (kW)}}{4}$$

---

## 6. Flujo de Git, Commits y Calidad TypeScript

1. **Idioma y formato de los commits:**  
   Todos los commits deben ser semánticos y redactados en **español**:
   * `feat(telemetry): ...`
   * `fix(dashboard): ...`
   * `docs(guides): ...`
   * `refactor(auth): ...`
2. **Validación TypeScript obligatoria antes de confirmar:**  
   Antes de hacer commit o dar una tarea por finalizada, es obligatorio ejecutar:
   ```bash
   npx tsc --noEmit
   ```
   No se permiten advertencias de tipos sueltas como `possibly null` o parámetros sin tipar.
3. **Resolución DNS en Node.js:**  
   Siempre ejecutar Next.js con:
   ```bash
   NODE_OPTIONS=--dns-result-order=ipv4first
   ```
   (Ya configurado en los scripts de `package.json` para evitar fallos de resolución con Supabase).

---

## 7. Catálogo de Errores Pasados y Solución Definitiva

| Error Cometido en el Pasado | Causa Técnica | Solución Definitiva Implementada |
|---|---|---|
| **DELETE en Supabase respondía 204 pero no borraba nada** | Faltaba la directiva de política RLS para la operación `DELETE`. | Se agregó política `rls_readings_delete` en `schema.sql` y se habilitó `TRUNCATE TABLE` para reseteos rápidos. |
| **Gráfica de 24h oscilando como serrucho y mes cortado al 22-Sep** | Múltiples ejecuciones de sembrado insertaron registros duplicados con el mismo timestamp (19.000 filas). | Scripts con control de timestamps únicos, comando `npm run db:clean` y parámetros `--days` y `--clean`. |
| **El usuario quedaba vinculado automáticamente a un hogar genérico** | Trigger automático en base de datos ejecutado en cada `signup`. | Pantalla de bienvenida `HouseholdOnboarding` que permite elegir entre crear hogar propio o ingresar con PIN. |
| **Página saturada por auto-refresh cada 1 segundo** | Polling innecesario desde el cliente en componentes React. | Eliminación del polling de 1s; uso de `revalidate = 60` y arquitectura preparada para WebSockets. |
| **`tsconfig.json` de Next.js fallaba por archivos de Express** | La raíz de TypeScript incluía archivos de `backend-simulator/`. | Se agregó `"backend-simulator"` a la lista `"exclude"` de `tsconfig.json`. |
| **Error en TypeScript: `inviteMsg is possibly null`** | Manejo de estado tipado sin verificar valores nulos en configuraciones. | Tipado estricto con comprobación condicional de nulidad previa al renderizado. |
| **Hogares sin paneles mostraban métricas solares en 0 o vacías** | La interfaz asumía obligatoriedad de planta solar. | Detección dinámica de `hasSolar = capacity_kwp > 0`, transformando las tarjetas a métricas de red y costo. |
