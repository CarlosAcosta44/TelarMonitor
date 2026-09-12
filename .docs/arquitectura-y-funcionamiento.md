# Arquitectura y Funcionamiento de Telar Monitor

**Telar Monitor** es un dashboard web interactivo diseñado para mostrar, en tiempo real, el consumo eléctrico de una instalación y la generación de sus paneles solares. Su objetivo es democratizar la comprensión de la energía mediante una interfaz clara y profesional.

---

## 1. Funcionamiento del Dashboard

El panel de control principal está compuesto por diferentes módulos que se actualizan automáticamente en tiempo real (cada 10 segundos):

- **Estado en Vivo:** Un indicador pulsante confirma que el sistema está conectado al backend. Además, se muestra cuánto tiempo hace que se recibió la última lectura de los sensores.
- **Tarjetas Superiores:**
  - **Consumo Actual:** La demanda eléctrica de la instalación en el instante presente.
  - **Generación Solar:** Lo que están produciendo los paneles solares. Incluye la métrica de cobertura (qué porcentaje del consumo actual se suple con energía solar).
  - **Balance de Energía:** Muestra gráficamente cuánto viene del sol y cuánto de la red externa. Si es negativo (Déficit), se está importando de la red.
- **Resumen del Día:**
  - **Consumo Total / Solar Generado:** Los acumulados en kWh desde que empezó el día (00:00).
  - **Ahorro Estimado:** Se calcula de manera dinámica tomando la generación solar útil multiplicada por la tarifa actual de la energía (ej. $950 COP/kWh).
- **Gráfico Histórico:** Permite alternar entre los últimos **7 días** o las últimas **24 horas**, mostrando las curvas de consumo y generación superpuestas.

### Tolerancia a Fallos
Si los sensores dejan de enviar datos (por problemas de internet, corte de luz, etc.), el dashboard cuenta con un mecanismo que detecta la interrupción y muestra una alerta visual ("Sin señal del sensor") indicando hace cuánto se perdió la conexión.

---

## 2. Arquitectura de Software (Clean Architecture)

El proyecto está diseñado de forma escalable utilizando los principios de Arquitectura Limpia (Clean Architecture). Esto garantiza que **la interfaz visual y las reglas de negocio no dependan de la base de datos o de APIs externas**. 

### Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| Frontend | **Next.js 16** + **React 19** | App Router con Server Components. La conexión con la base de datos es segura y sucede en el servidor. |
| Base de datos | **Backend Propio / SQL** | Actualmente configurado mediante un adaptador REST (con Supabase/PostgreSQL en fase temprana), pero fácilmente migrable a cualquier base de datos. |
| Estilos | **Tailwind CSS v4** | Sistema de diseño coherente, utilidades ágiles. |
| Gráficas | **Recharts** | Visualización nativa en React, ligera y responsiva. |

### Estructura de Directorios

```text
src/
├── domain/          ← Entidades y contratos (Sin dependencias externas)
│   ├── entities/    (Modelos como EnergyReading.ts o Setting.ts)
│   └── repositories/(Contratos como EnergyReadingRepository.ts)
│
├── application/     ← Casos de uso (Reglas de negocio puras)
│   └── use-cases/   (Ej. GetDailySummary.ts, GetEnergyRate.ts)
│
├── infrastructure/  ← Implementaciones externas (Bases de datos, APIs)
│   ├── supabase/    (Implementación real que habla con la DB)
│   └── simulation/  (Motor de simulación opcional)
│
└── components/      ← UI (Capa visual de React)
    └── (HistoryChart, SolarCard, DailySummaryBar, etc.)
```

> **Nota Estratégica:**
> Al cambiar los sensores físicos o al migrar a una nueva base de datos, **solo se modifica la carpeta `infrastructure/`**. Ni la lógica de los Casos de Uso (`application/`) ni las vistas (`components/`) se verán afectadas.

---

## 3. Flujo de Datos en Tiempo Real

1. **Sensores/Backend:** El hardware envía los datos (lecturas de consumo y generación) y se almacenan en la base de datos.
2. **Infraestructura:** La capa de repositorios extrae los datos usando librerías HTTP optimizadas (`cross-fetch`).
3. **Casos de Uso:** El sistema realiza las agregaciones necesarias (ej. sumar las lecturas del día, calcular el balance).
4. **Server Components:** Next.js renderiza la página y las gráficas en el servidor de forma segura (sin exponer credenciales al navegador).
5. **Auto-refresh:** Un componente de cliente (`DashboardRefresher`) llama a `router.refresh()` cada 10 segundos para buscar nuevos datos sin necesidad de recargar la página completa.
