# Contexto del proyecto — Telar Monitor

## 1. Qué es Telar

Telar es una empresa/proyecto que ofrece soluciones tecnológicas (desarrollo web, IA, automatización, NFC y domótica) para ayudar a empresas, profesionales y hogares a crecer. Este repositorio corresponde únicamente a la rama **Telar Monitor**, una de las 8 líneas de producto de Telar.

## 2. Qué es Telar Monitor

**Telar Monitor** es un dashboard que muestra en tiempo real métricas de **consumo eléctrico** y de **generación/consumo de paneles solares**, dirigido a hogares y empresas que quieren entender y controlar mejor su comportamiento energético — especialmente quienes ya tienen paneles solares instalados y quieren ver su rendimiento.

Telar **no suministra el hardware ni el servicio eléctrico**: solo se integra con el servidor de medición que el cliente ya tiene. En este primer sprint esa integración real todavía no existe.

## 3. Objetivo de este sprint (Sprint 1)

Construir el **MVP funcional** de Telar Monitor: un dashboard que se pueda mostrar a un cliente real, aunque todavía no esté conectado a un medidor físico. Prioridad: **velocidad, claridad y valor**.

**Importante:** en este sprint, todos los datos de consumo y generación solar son **simulados**. El objetivo no es conectar hardware real, sino demostrar cómo se vería y funcionaría el producto: la interfaz, las visualizaciones, la actualización de datos y el flujo completo.

## 4. Alcance funcional del MVP

Incluir:

- Vista de dashboard con:
  - Indicador de consumo eléctrico actual (simulado, actualizándose periódicamente para dar sensación de "tiempo real").
  - Indicador de generación solar actual (simulado).
  - Gráfico histórico de consumo (por hora o por día, según lo que sea más simple de simular bien).
  - Gráfico histórico de generación solar.
  - Algún indicador simple de ahorro o balance (consumo vs. generación), aunque sea básico.
- Diseño **responsive** (celular, tablet, escritorio).

Fuera de alcance en este sprint (dejar para después):

- Conexión real con el servidor de medición del cliente.
- Alertas automáticas por consumo anómalo (se puede dejar como visual estático de ejemplo si da tiempo, no como sistema real de alertas).
- Múltiples ubicaciones/usuarios.
- Autenticación multi-rol o multi-cliente.

## 5. Stack tecnológico

- **Frontend:** Next.js (App Router), React.
- **Backend / Base de datos:** Supabase (PostgreSQL) — se usará para almacenar los datos simulados de consumo y generación, de forma que el dashboard los consulte igual que consultaría datos reales en el futuro (esto facilita el reemplazo posterior sin rediseñar nada).
- **Gráficos:** una librería de visualización de datos para React (por ejemplo Recharts o similar — usar la que el equipo ya maneje o la más simple de integrar con Next.js).
- **Simulación de datos:** un script o función (puede ser un cron/Edge Function de Supabase, o un generador simple ejecutado periódicamente) que inserte lecturas simuladas de consumo y generación solar con variación realista (ej. más generación solar al mediodía, más consumo en la noche).
- **Despliegue:** Vercel.

## 6. Estructura de datos sugerida en Supabase

```sql
create table energy_readings (
  id uuid primary key default gen_random_uuid(),
  reading_type text not null check (reading_type in ('consumption', 'solar_generation')),
  value_kwh numeric not null,
  recorded_at timestamptz not null default now()
);
```

Notas sobre la simulación:

- Generar lecturas con una frecuencia razonable para el MVP (ej. una lectura cada 5-15 minutos simulados, o directamente datos históricos precargados por día/hora).
- El consumo simulado puede variar por franja horaria (más alto en la mañana y la noche).
- La generación solar simulada debe ser 0 en la noche y máxima cerca del mediodía, para que el dashboard se vea creíble.
- Es válido precargar un dataset de ejemplo (ej. 7 días de datos simulados) en vez de generar datos en vivo, si eso simplifica el MVP y sigue permitiendo mostrar gráficos con información completa.

## 7. Requisitos no funcionales

- El dashboard debe reflejar los datos como si fueran actuales (aunque sean simulados) — evitar que se note como "datos de prueba" en la presentación al cliente.
- Código organizado por componentes reutilizables (ConsumptionCard, SolarCard, HistoryChart, etc.).
- La consulta de datos debe estar desacoplada de la fuente (hoy Supabase con datos simulados, mañana Supabase con datos reales del medidor) para que el cambio futuro sea solo de origen de datos, no de arquitectura del dashboard.
- Variables de entorno (`.env.local`) para las credenciales de Supabase.

## 8. Criterios de "hecho" para el MVP

- [ ] El dashboard se puede ver correctamente en celular y escritorio.
- [ ] Muestra consumo eléctrico y generación solar con datos simulados coherentes (no aleatorios sin sentido).
- [ ] Incluye al menos un gráfico histórico funcional.
- [ ] Los datos vienen de Supabase (no están hardcodeados en el frontend).
- [ ] El dashboard está desplegado en una URL pública.
- [ ] Se puede presentar a un cliente real explicando claramente que los datos son una simulación de cómo funcionará con su medidor real.

## 9. Arquitectura del proyecto: Clean Architecture

Este proyecto debe seguir los principios de **Clean Architecture**, adaptados a un proyecto Next.js. La idea central es separar el código en capas con responsabilidades claras, donde las capas internas (dominio, casos de uso) no dependen de las externas (frameworks, base de datos, UI), sino al revés. Esto es especialmente importante en Monitor porque hoy la fuente de datos es simulada y más adelante será un medidor real — la arquitectura debe hacer ese cambio trivial.

Estructura de carpetas sugerida:

```
src/
  domain/            # Entidades y reglas de negocio puras (sin dependencias externas)
    entities/         # ej: EnergyReading
    repositories/      # Interfaces/contratos de los repositorios (ej: EnergyReadingRepository)
  application/        # Casos de uso: orquestan la lógica de negocio
    use-cases/         # ej: GetCurrentConsumption, GetHistoricalReadings, GetSolarGeneration
  infrastructure/     # Implementaciones concretas (Supabase, generador de datos simulados)
    supabase/           # Cliente de Supabase y repositorios concretos (ej: SupabaseEnergyReadingRepository)
    simulation/          # Lógica de generación de datos simulados (aislada aquí, no en el dominio)
  presentation/        # Next.js: páginas, componentes, hooks de UI
    app/                # App Router (rutas, layouts, server actions)
    components/         # Componentes de React reutilizables (ConsumptionCard, SolarCard, HistoryChart)
```

Reglas clave a seguir:

- El **dominio** (`domain/`) no debe importar nada de Next.js, Supabase ni de la capa de presentación. Solo contiene entidades (ej. `EnergyReading`) y contratos (interfaces) como `EnergyReadingRepository`.
- Los **casos de uso** (`application/`) dependen de las interfaces del dominio, no de implementaciones concretas — así, cuando se conecte el medidor real, solo cambia la implementación en `infrastructure/`, no la lógica de negocio ni los componentes de UI.
- La **infraestructura** (`infrastructure/`) implementa esas interfaces (ej. `SupabaseEnergyReadingRepository implements EnergyReadingRepository`) y es la única capa que conoce detalles de Supabase o de cómo se generan los datos simulados.
- La **presentación** (`presentation/` / `app/`) solo llama a los casos de uso, nunca accede directamente a Supabase ni a la lógica de simulación desde un componente.
- El hecho de que los datos sean "simulados" debe ser un detalle de infraestructura, no algo que el dominio o los casos de uso necesiten saber.

Para un MVP pequeño no es necesario sobre-diseñar: se puede mantener la estructura simple (un caso de uso por consulta relevante: `getCurrentConsumption`, `getHistoricalReadings`), pero respetando siempre la separación de capas y la dirección de las dependencias.

## 10. Notas para el agente

- Este es un proyecto de un aprendiz SENA (ADSO) trabajando en equipo dentro de Telar; el código debe ser claro y fácil de entender/mantener por otros compañeros, no solo funcional.
- Diseñar pensando en que los datos simulados serán reemplazados por datos reales más adelante: no acoplar la lógica del dashboard a que los datos sean "falsos"; esa responsabilidad vive solo en la capa de infraestructura (ver sección 9).
- Seguir buenas prácticas de Next.js (App Router, Server Components donde tenga sentido, Client Components solo donde se necesite interactividad), respetando siempre la separación de capas de Clean Architecture.
- No romper la Clean Architecture "por rapidez": incluso en el MVP, evitar que un componente de UI llame directamente a Supabase o a la lógica de simulación; siempre pasar por un caso de uso.
- Si hay dudas sobre alcance, priorizar siempre lo que se pueda **mostrar funcionando** en el cierre del sprint por encima de features adicionales — pero sin sacrificar la estructura de capas para "ir más rápido".
