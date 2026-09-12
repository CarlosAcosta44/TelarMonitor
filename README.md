# Telar Monitor 

Telar Monitor es un dashboard web interactivo y en tiempo real para visualizar el consumo de energía eléctrica y la generación de paneles solares. Construido con **Next.js 16**, **React 19** y **Tailwind CSS v4**.

## Cómo instalar y ejecutar el proyecto

Para correr el proyecto localmente en tu entorno de desarrollo:

1. **Instalar las dependencias:**
   Asegúrate de tener Node.js instalado (v18 o superior).
   ```bash
   npm install
   ```

2. **Configurar las variables de entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto basándote en las credenciales de tu base de datos (por ejemplo, Supabase).
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_token_aqui
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

---

## Datos Simulados y Pruebas

Durante la etapa de desarrollo o para hacer demostraciones (MVP), puedes poblar la base de datos con datos simulados y realistas sin necesidad de conectar hardware físico.

- **Generar el historial inicial (Seed):**
  Para generar datos realistas (cada 15 minutos) de los últimos 7 días con variaciones de clima y fines de semana, ejecuta en otra terminal:
  ```bash
  curl -X POST http://localhost:3000/api/simulate/seed
  ```
  *(Nota: Esto puede tardar unos segundos porque inserta más de 1,500 registros en la base de datos).*

- **Simular lecturas en tiempo real:**
  Si estás haciendo una presentación y quieres que el dashboard se mueva en vivo, el proyecto cuenta con un script de simulación automática que envía un pulso de energía cada 10 segundos. Ejecútalo así:
  ```bash
  # Para un entorno local:
  node simulate-live.js
  
  # Para simular directo a un despliegue en Vercel:
  node simulate-live.js https://tu-proyecto.vercel.app/api/simulate/reading
  ```

---

## Documentación Técnica

Para un entendimiento profundo del proyecto, dirígete a la carpeta [`.docs/`](./.docs/) donde encontrarás información vital:

- [**Arquitectura y Funcionamiento**](./.docs/arquitectura-y-funcionamiento.md): Conoce las capas del software (Clean Architecture), los casos de uso, las tolerancias a fallos del sistema y cómo fluyen los datos en tiempo real.
- [**Guía de Integración con Hardware Real**](./.docs/real-hardware-integration.md): Las tres arquitecturas recomendadas y ejemplos de código para migrar del simulador a sensores IoT reales (ESP32, Raspberry Pi, MQTT).
- [**Setup de Base de Datos**](./.docs/setup-database.sql): Script SQL de referencia para recrear las tablas y los índices necesarios en la base de datos.
