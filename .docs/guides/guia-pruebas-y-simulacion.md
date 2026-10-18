# 🧪 Guía Paso a Paso: Pruebas, Simulación y Gestión de Hogares en TelarMonitor

Esta guía detalla de forma clara y exhaustiva cómo probar todas las funcionalidades del proyecto, sembrar datos de prueba (en vivo, 7 días o 30 días), limpiar la base de datos y configurar hogares con y sin paneles solares.

---

## 📋 Índice
1. [Diagnóstico y Limpieza de la Tabla de Lecturas](#1-diagnóstico-y-limpieza-de-la-tabla-de-lecturas)
2. [¿Por qué las gráficas se comportaban de forma extraña?](#2-por-qué-las-gráficas-se-comportaban-de-forma-extraña)
3. [Comandos de Sembrado y Simulación](#3-comandos-de-sembrado-y-simulación)
4. [Caso de Uso 1: Hogar con Paneles Solares (Consumo + Generación)](#4-caso-de-uso-1-hogar-con-paneles-solares-consumo--generación)
5. [Caso de Uso 2: Hogar Sin Paneles Solares (Solo Consumo de Red)](#5-caso-de-uso-2-hogar-sin-paneles-solares-solo-consumo-de-red)
6. [Flujo de Verificación Pantalla por Pantalla](#6-flujo-de-verificación-pantalla-por-pantalla)
7. [Microservicio Independiente de Simulación (`backend-simulator/`)](#7-microservicio-independiente-de-simulación-backend-simulator)

---

## 1. Diagnóstico y Limpieza de la Tabla de Lecturas

Si ejecutaste el comando de sembrado varias veces y se acumularon miles de registros duplicados (por ejemplo, 19.000 filas), puedes limpiar la tabla de dos formas:

### Opción A (Recomendada y Definitiva - Directo en Supabase):
1. Entra a tu proyecto en el [Panel de Supabase](https://supabase.com/dashboard/project/lonuptruktezinruxwya).
2. Ve al **SQL Editor** en el menú lateral izquierdo.
3. Ejecuta la siguiente sentencia SQL:
   ```sql
   TRUNCATE TABLE public.energy_readings;
   ```
   *Esto vacía la tabla de lecturas al instante y resetea los índices sin tocar la configuración ni los usuarios.*

### Opción B (Desde la terminal del proyecto):
```bash
npm run db:clean
```
*(Requiere que la política `rls_readings_delete` esté activa en la base de datos).*

---

## 2. ¿Por qué las gráficas se comportaban de forma extraña?

Con 19.000 registros en la base de datos, se observaban los siguientes comportamientos:

1. **La gráfica de 24h subía y bajaba erráticamente en lapsos muy cortos:**  
   Al ejecutarse el sembrado 3 o 4 veces sin limpiar la tabla previamente, se insertaron 3 o 4 registros distintos para el **mismo minuto o intervalo de 15 minutos**. La consulta del frontend traía filas duplicadas consecutivas con valores oscilantes, generando picos en zigzag.

2. **La gráfica de 7 días solo mostraba 4 días y la de 30 días se cortaba en el 22 de septiembre:**  
   El repositorio consulta el histórico con un límite (`LIMIT 672` para 7 días y `LIMIT 2880` para 30 días, que corresponden al número exacto de intervalos de 15 minutos en ese lapso).  
   Al haber 3 o 4 registros por cada intervalo, el límite de 2.880 filas se llenaba rápidamente abarcando solo 8 a 10 días reales de calendario en lugar de los 30 días esperados.

**Solución aplicada:**  
Los nuevos scripts limpian o respetan las marcas de tiempo únicas, y una vez vaciada la tabla y sembrada una sola vez con `npm run simulate:seed:30`, las curvas se visualizan fluidas, continuas y cubriendo exactamente desde hoy hasta 30 días atrás.

---

## 3. Comandos de Sembrado y Simulación

En la raíz del proyecto tienes a disposición los siguientes comandos en `package.json`:

| Comando | Acción | Registros generados |
|---|---|---|
| `npm run db:clean` | Limpia todas las lecturas de telemetría | 0 filas |
| `npm run simulate:seed:7` | Siembra histórico de los últimos **7 días** | ~1.344 lecturas (intervalos de 15 min) |
| `npm run simulate:seed:30` | Siembra histórico de los últimos **30 días** | ~5.760 lecturas (intervalos de 15 min) |
| `npm run simulate:live` | Inicia simulación en vivo (emite lectura cada 3s) | En tiempo real en consola y BD |

### Parámetros opcionales del script de sembrado:
```bash
# Sembrar 14 días limpiando automáticamente antes de insertar:
node scripts/seed-readings.mjs --days=14 --clean

# Sembrar para un hogar específico:
node scripts/seed-readings.mjs --days=30 --household=TU_UUID_AQUI
```

---

## 4. Caso de Uso 1: Hogar con Paneles Solares (Consumo + Generación)

Este es el escenario para usuarios que autogeneran energía fotovoltaica en su vivienda.

### Configuración del Hogar:
1. Inicia sesión con tu cuenta.
2. Si eres nuevo, en la pantalla de bienvenida selecciona **"Crear un Nuevo Hogar"**.
3. Ingresa:
   - **Nombre:** "Casa Solar Las Palmas"
   - **Ubicación:** "Envigado, Antioquia"
   - **¿Cuenta con paneles solares?:** ✅ Activado
   - **Capacidad Solar Instalada (kWp):** `4.2`
4. Haz clic en **"Crear Hogar y Empezar"**.
5. En la terminal, corre el sembrado para ese hogar:
   ```bash
   npm run simulate:seed:30
   ```

### Qué verás en pantalla:
- **Panel de Control (Dashboard):**
  - **Tarjeta Solar Generado:** Muestra los kWh solares producidos hoy y el % de Cobertura Solar.
  - **Tarjeta Ahorro Estimado:** Calcula el ahorro en COP monetizando la energía solar producida frente a la tarifa de red.
  - **Balance de Energía:** Muestra la relación entre autogeneración y demanda de red, indicando si el hogar está en estado *Autosuficiente* o *Dependiente*.
  - **Gráfica Histórica:** Doble curva superpuesta: **Línea Amarilla (Solar)** vs. **Línea Azul (Consumo)**.
- **Página de Histórico (`/historico`):**
  - Métricas de "Mayor Rendimiento Solar" y "Autonomía Lograda (>80%)".
  - Tabla comparativa de generación vs consumo.
- **Página de Ahorro (`/ahorro`):**
  - Ahorro Neto Consolidado en COP, retorno de inversión (ROI) estimado y toneladas de CO₂ evitadas.

---

## 5. Caso de Uso 2: Hogar Sin Paneles Solares (Solo Consumo de Red)

Este es el escenario para usuarios que solo desean monitorear y optimizar su consumo de la red de servicios públicos sin tener paneles fotovoltaicos.

### Configuración del Hogar:
1. Puedes crear un segundo hogar o una cuenta de prueba.
2. En la pantalla de bienvenida selecciona **"Crear un Nuevo Hogar"**.
3. Ingresa:
   - **Nombre:** "Apartamento Poblado 402"
   - **Ubicación:** "Medellín, Antioquia"
   - **¿Cuenta con paneles solares?:** ❌ **Desactivado** (el sistema asignará automáticamente `capacity_kwp = 0`).
4. Haz clic en **"Crear Hogar y Empezar"**.
5. Siembra datos para este hogar:
   ```bash
   node scripts/seed-readings.mjs --days=30 --household=ID_DEL_HOGAR_SIN_SOLAR
   ```
   *(El generador detectará `capacity_kwp: 0` y omitirá automáticamente las lecturas de `solar_generation`, registrando exclusivamente lecturas de `consumption`).*

### Qué verás en pantalla (Adaptación automática):
- **Panel de Control (Dashboard):**
  - **Tarjeta Central:** Se transforma automáticamente en **"Costo Estimado Hoy"** (en COP), calculando el gasto del día según los kWh consumidos multiplicados por la tarifa de referencia ($950 COP/kWh).
  - **Tarjeta Derecha:** Muestra **"Proyección Mensual"** en COP basada en el promedio de consumo diario.
  - **Balance de Energía:** Pasa a modo **"Suministro de Red"** con estado *Red Eléctrica*, mostrando 100% de abastecimiento por red comercial.
  - **Tarjeta Solar:** Informa *"No instalado / Monitoreo exclusivo de red"*.
  - **Gráfica Histórica:** Muestra únicamente la curva de **Consumo (Azul)**; la leyenda oculta la etiqueta solar para mantener la interfaz limpia y profesional.
- **Página de Histórico (`/historico`):**
  - Muestra "Costo Total Estimado", "Pico de Consumo (Día de mayor demanda)" y "Promedio Diario (kWh/día)".
  - La gráfica histórica solo grafica consumo.
- **Página de Ahorro (`/ahorro`):**
  - Muestra el **Costo Acumulado de Red Eléctrica** facturado y una simulación de **Ahorro Potencial Solar (hasta 70%)** si el usuario decidiera cotizar e instalar paneles en el futuro.

---

## 6. Flujo de Verificación Pantalla por Pantalla

Para validar el funcionamiento completo de la rama:

1. **Dashboard (`/`):**
   - Comprobar selector de rango: `24 h`, `7 días`, `Mes`.
   - Comprobar botón de exportación PDF (genera el informe ejecutivo).
   - Comprobar que el nombre del hogar activo arriba a la izquierda coincida con el hogar seleccionado.

2. **Histórico y Tendencias (`/historico`):**
   - Comprobar cambio de rangos (Día, Semana, Mes en curso).
   - Verificar la tabla de desglose de los últimos 7 días.
   - Probar el botón "Exportar Reporte (CSV)".

3. **Eficiencia & Ahorro (`/ahorro`):**
   - Verificar cálculo de facturación real vs estimada.
   - Comprobar métricas ambientales (árboles equivalentes, km limpios, kg CO₂ evitados).

4. **Configuración (`/configuracion`):**
   - Comprobar edición de datos de la instalación (Nombre, tarifa $/kWh, capacidad kWp).
   - Comprobar gestión de miembros: ver miembros actuales del hogar y compartir código PIN de invitación.
   - Comprobar cambio de contraseña del perfil.

---

## 7. Microservicio Independiente de Simulación (`backend-simulator/`)

Para desacoplar por completo la generación de telemetría de Next.js, se ha creado el microservicio en `backend-simulator/`:

- **Arquitectura:** Clean Architecture (Domain, Application, Infrastructure).
- **Protocolos:** HTTP REST (Express) + WebSockets en tiempo real (Socket.IO).
- **Preparado para producción:** Incluye `Dockerfile` multi-etapa y `railway.json`.

### Cómo probarlo localmente:
```bash
# 1. Entrar al directorio
cd backend-simulator

# 2. Iniciar en modo desarrollo
npm run dev
```

### Probar endpoints con `curl`:
```bash
# Chequeo de salud:
curl http://localhost:4000/health

# Iniciar simulación en vivo:
curl -X POST http://localhost:4000/api/simulation/start

# Sembrar 30 días para un hogar:
curl -X POST http://localhost:4000/api/simulation/seed \
  -H "Content-Type: application/json" \
  -d '{"days": 30, "cleanBefore": true}'

# Detener simulación:
curl -X POST http://localhost:4000/api/simulation/stop
```

Cuando desees moverlo a su propio repositorio de GitHub, simplemente copia la carpeta `backend-simulator/` como raíz de un nuevo repositorio.
