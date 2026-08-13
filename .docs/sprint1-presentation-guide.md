# Guión de presentación — Telar Monitor Sprint 1

> Duración estimada: 5–8 minutos. Tener el dashboard abierto en `localhost:3000` (o URL de Vercel) y el servidor corriendo.

---

## Apertura

> *"Lo que ven aquí es **Telar Monitor** — un dashboard que muestra en tiempo real el consumo eléctrico de un hogar o empresa, y la generación de sus paneles solares. El objetivo es que cualquier persona pueda entender su comportamiento energético de un vistazo, sin necesidad de ser técnica."*

---

## Recorrido por el dashboard

### Tarjetas superiores
> *"Aquí arriba tienen tres indicadores clave: el consumo eléctrico actual, la generación solar actual, y el balance entre los dos. Estos números se actualizan automáticamente desde nuestra base de datos en la nube — sin necesidad de recargar la página."*

- Señalar el **Consumo Actual** (rojo).
- Señalar la **Generación Solar** (verde) y el indicador de si los paneles están activos o no.
- Señalar el **Balance** y explicar si hay excedente o déficit.

### Gráfico histórico
> *"En el gráfico pueden ver el comportamiento del día completo. La línea roja es el consumo — noten cómo sube en las mañanas y las noches, que es cuando más electricidad se usa en un hogar. La línea verde es la generación solar — sube al mediodía cuando el sol está en su punto más alto, y baja a cero en la noche. Esto es exactamente cómo se comporta una instalación solar real."*

---

## Sobre los datos

> *"Hoy los datos que ven son una simulación realista. No están conectados a un medidor físico todavía — ese es el siguiente paso. Pero la simulación reproduce patrones reales: más consumo en horas pico, generación solar siguiendo la curva del sol."*

> *"Lo importante es que cuando conectemos el medidor real de su instalación, **este mismo dashboard mostrará sus datos reales sin cambiar nada en la interfaz**. La arquitectura está diseñada específicamente para eso."*

---

## Demo en vivo (opcional, muy impactante)

Mientras el cliente observa el dashboard, en otra terminal ejecutar:

```bash
curl -X POST http://localhost:3000/api/simulate/reading
```

> *"Acabo de simular la llegada de una nueva lectura del medidor — igual a como llegará cuando tengamos el hardware instalado. En unos segundos el dashboard se actualiza automáticamente."*

Esperar ~10 segundos y señalar el cambio en las tarjetas.

---

## Si preguntan por la tecnología

- **"¿Dónde están los datos?"** → En Supabase (PostgreSQL en la nube). Los mismos datos que hoy son simulados serán reemplazados por lecturas reales del medidor.
- **"¿Funciona en celular?"** → Sí, es completamente responsive. Mostrar en el teléfono o reducir la ventana del navegador.
- **"¿Se puede ver desde cualquier lado?"** → Sí, se despliega en Vercel con una URL pública.
- **"¿Cuándo se conecta el medidor real?"** → Eso es el Sprint 2. La arquitectura ya está lista para recibirlo.

---

## Cierre

> *"Este es el MVP del Sprint 1. El objetivo era demostrar cómo se vería y funcionaría el producto con datos reales — y creo que lo logramos. El siguiente paso es conectar el medidor físico de su instalación, que es solo un cambio en la capa de datos, no en el dashboard."*

---

## Comandos útiles para la demo

| Acción | Comando |
|---|---|
| Levantar el servidor | `npm run dev` |
| Simular una nueva lectura (demo en vivo) | `curl -X POST http://localhost:3000/api/simulate/reading` |
| Recargar todos los datos históricos | `curl -X POST http://localhost:3000/api/simulate/seed` |
| Borrar datos para empezar limpio | SQL: `delete from energy_readings;` |
