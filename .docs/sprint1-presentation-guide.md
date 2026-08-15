# Guión de presentación — Telar Monitor · Sprint 1

> **Duración estimada:** 8–12 minutos.  
> Tener el dashboard abierto en `http://localhost:3000` (o URL de Vercel) y el servidor corriendo en otra terminal.

---

## 1. Apertura (1 min)

> *"Lo que ven aquí es **Telar Monitor** — un dashboard que muestra en tiempo real el consumo eléctrico de un hogar o empresa, y la generación de sus paneles solares. El objetivo es que cualquier persona pueda entender su comportamiento energético de un vistazo, sin necesidad de ser técnica."*

---

## 2. Recorrido por el dashboard (3–4 min)

### Encabezado
> *"Arriba a la izquierda ven el nombre del sistema y un indicador 'EN VIVO' que pulsa continuamente — eso confirma que el dashboard está conectado y recibiendo datos en este momento. A la derecha del panel principal ven la fecha de hoy y el timestamp exacto de la última lectura recibida."*

### Tarjetas superiores
> *"Aquí tienen tres indicadores clave:"*

- **Consumo Actual** (rojo) — demanda eléctrica en este momento.
- **Generación Solar** (verde) — lo que están produciendo los paneles ahora. Señalar el badge **ACTIVO/INACTIVO** y la barra de **cobertura solar** (qué % del consumo cubre el sol).
- **Balance de Energía** — la barra horizontal muestra visualmente cuánto viene del sol y cuánto de la red. Las dos pills muestran los valores exactos. Si el balance es positivo, están vertiendo excedente a la red.

### Gráfico histórico
> *"En el gráfico ven el comportamiento del día completo. La línea roja es el consumo — noten cómo sube en las mañanas y las noches. La línea verde es la generación solar — sigue la curva del sol, con su pico al mediodía. Si pasan el cursor sobre cualquier punto, el tooltip muestra los tres valores: solar, consumo, y el balance de ese momento exacto."*

---

## 3. Demo en vivo — auto-refresh (2 min)

> *"Una cosa que quiero mostrarles explícitamente: el dashboard se actualiza solo, sin que nadie toque nada."*

En otra terminal, ejecutar:

```bash
curl -X POST http://localhost:3000/api/simulate/reading
```

> *"Acabo de simular la llegada de una nueva lectura del medidor. Observen las tarjetas... en unos segundos los números cambian solos. No es una recarga de página — solo los datos se actualizan, sin ningún parpadeo. Así funcionará con el hardware real."*

Esperar ~10 segundos y señalar el cambio en los valores.

---

## 4. Robustez del sistema (1 min)

> *"El sistema también está preparado para escenarios adversos. Si el sensor dejara de enviar datos — porque se fue la luz, o hay un problema de conexión — el dashboard muestra un aviso visible en lugar de quedarse mostrando ceros en silencio."*

*(Opcional: simular apagando el simulador y esperando 5 min, o mostrar el banner manualmente en el código.)*

---

## 5. Arquitectura y código (2–3 min)

> *"Quiero dedicar un momento a explicar cómo está construido esto por dentro, porque la arquitectura fue una decisión estratégica, no solo técnica."*

### Stack tecnológico

| Capa | Tecnología | Decisión |
|---|---|---|
| Frontend | **Next.js 16** + **React 19** | App Router con Server Components — la lógica de datos vive en el servidor, no en el navegador |
| Base de datos | **Supabase** (PostgreSQL) | Managed, con API REST lista desde el día 1. Sin infraestructura que mantener |
| Estilos | **Tailwind CSS v4** | Sistema de diseño coherente, dark mode automático, variables CSS personalizadas |
| Gráficas | **Recharts** | Librería React nativa, sin dependencias pesadas |
| Fuente | **Outfit** (Google Fonts) | Tipografía premium diseñada para dashboards de datos |

### Arquitectura en capas (Clean Architecture)

```
src/
├── domain/          ← Entidades y contratos (sin dependencias externas)
│   ├── entities/    EnergyReading.ts — el modelo de datos central
│   └── repositories/ IEnergyReadingRepository.ts — el contrato
│
├── application/     ← Casos de uso (lógica de negocio pura)
│   └── use-cases/   GetCurrentConsumption, GetSolarGeneration, GetHistoricalReadings
│
├── infrastructure/  ← Implementaciones concretas (Supabase, simulación)
│   ├── supabase/    SupabaseEnergyReadingRepository.ts
│   └── simulation/  SimulationService.ts
│
└── components/      ← UI (solo presentación, recibe datos como props)
    ├── ConsumptionCard, SolarCard, BalanceIndicator
    ├── HistoryChart
    ├── DashboardRefresher  ← auto-refresh del cliente
    └── StaleDataWarning    ← alerta de sensor desconectado
```

> *"La clave de este diseño es que **Supabase es un detalle de implementación, no el núcleo del sistema**. El dominio — la lógica de qué es un 'balance', cómo se calcula la cobertura solar — no sabe nada de bases de datos. Esto tiene una consecuencia práctica muy concreta:"*

> *"Cuando conectemos el medidor físico de su instalación, lo único que cambia es añadir un nuevo archivo en `infrastructure/`. El dashboard, el dominio, los casos de uso — nada de eso se toca. Ese cambio puede hacerse en horas, no en días."*

### Cómo fluyen los datos

```
Supabase (PostgreSQL)
     ↓
SupabaseEnergyReadingRepository   (infrastructure)
     ↓
GetCurrentConsumption / GetSolarGeneration   (application)
     ↓
DashboardPage (Server Component)   — corre en el servidor, no expone credenciales
     ↓
ConsumptionCard / SolarCard / BalanceIndicator / HistoryChart   (components)
     ↓
DashboardRefresher (Client Component)   — router.refresh() cada 10 s
```

---

## 6. Si preguntan por la tecnología

- **"¿Dónde están los datos?"** → En Supabase (PostgreSQL gestionado en la nube). Los mismos datos que hoy son simulados serán reemplazados por lecturas del medidor real sin cambiar el dashboard.
- **"¿Funciona en celular?"** → Sí, es completamente responsive. Mostrarlo en el teléfono o reducir la ventana del navegador.
- **"¿Se puede ver desde cualquier lado?"** → Sí, se despliega en Vercel con URL pública en minutos.
- **"¿Es seguro? ¿Cualquiera puede ver los datos?"** → En producción se añade autenticación (Sprint 2). Ahora mismo el proyecto asume una instalación interna.
- **"¿Qué pasa si falla internet o el sensor?"** → El dashboard muestra un aviso claro de "Sin señal del sensor" con el tiempo transcurrido desde la última lectura.
- **"¿Cuándo se conecta el medidor real?"** → Sprint 2. La arquitectura ya está lista para recibirlo — es solo un cambio en la capa de infraestructura.

---

## 7. Cierre (30 seg)

> *"Este es el MVP del Sprint 1. El objetivo era demostrar, con datos reales y una interfaz profesional, cómo se verá y se comportará el producto final. El siguiente paso — Sprint 2 — es conectar el medidor físico de su instalación. Desde el punto de vista del código, ya está todo preparado para recibirlo."*

---

## Comandos útiles para la demo

| Acción | Comando |
|---|---|
| Levantar el servidor | `npm run dev` |
| Simular una nueva lectura (demo en vivo) | `curl -X POST http://localhost:3000/api/simulate/reading` |
| Recargar todos los datos históricos (24h) | `curl -X POST http://localhost:3000/api/simulate/seed` |
| Borrar datos para empezar limpio | SQL: `delete from energy_readings;` |
| Ver el build de producción | `npm run build && npm start` |

---

## Checklist pre-demo

- [ ] `npm run dev` corriendo en terminal
- [ ] Dashboard abierto en el navegador — verificar que los datos cargan
- [ ] Modo oscuro del sistema activado para mejor presentación visual
- [ ] Segunda terminal lista para el `curl` de demo en vivo
- [ ] Si es en Vercel: URL de producción abierta y compartida en pantalla
