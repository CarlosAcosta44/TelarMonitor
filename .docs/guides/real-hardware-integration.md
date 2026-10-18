# Guía de Integración de Hardware Real: De la Simulación a la Realidad

Este documento documenta la **arquitectura definitiva** elegida para conectar sensores físicos reales (medidores inteligentes, inversores solares, ESP32) a Telar Monitor. 

Tras analizar las distintas alternativas, **Telar Monitor ha sido configurado para utilizar la Arquitectura de Conexión Directa (Microcontrolador ➔ Backend REST API)**. Esta es la opción más rápida, económica y directa para enviar datos desde el sitio de instalación hacia la nube.

---

## Arquitectura Definitiva (Nube a Nube / Directa)

En esta arquitectura, un microcontrolador (ej. **ESP32**) equipado con sensores de corriente y voltaje se conecta a la red WiFi del hogar. De forma periódica (ej. cada 15 minutos), el microcontrolador empaqueta las lecturas y hace una solicitud `POST` directamente a nuestra API en Next.js.

```mermaid
graph LR
    A[Sensor de Corriente/Voltaje] -->|Señal Analógica/I2C| B(Microcontrolador ESP32)
    B -->|WiFi / HTTP POST| C[Controlador: /api/telemetry]
    C -->|SaveTelemetry (Caso de Uso)| D[Supabase Repo (Infraestructura)]
    D --> E[(Base de Datos Supabase)]
    E --> F[Telar Monitor Frontend]
```

---

## Implementación Actual en el Código (Arquitectura Limpia)

El backend de Telar Monitor ya está **preparado y listo** para recibir las métricas del hardware, respetando estrictamente los principios de Arquitectura Limpia (Hexagonal).

### 1. El Controlador de Recepción (`src/app/api/telemetry/route.ts`)

Se ha creado una ruta de API en Next.js que actúa como nuestro controlador. Cuando el ESP32 tiene datos listos, se comunica con esta ruta. Puedes revisar el código fuente en [`src/app/api/telemetry/route.ts`](file:///home/kairos/Proyectos/TelarMonitor/src/app/api/telemetry/route.ts).

El flujo interno funciona así:
1. **Seguridad (Auth):** El controlador valida que la solicitud HTTP tenga el encabezado `Authorization: Bearer TELAR_HARDWARE_TOKEN_2026`. Esto previene que terceros inserten datos falsos.
2. **Desacoplamiento (Capa de Aplicación):** En lugar de tocar la base de datos, el controlador parsea el JSON y llama al Caso de Uso `SaveTelemetry` (`src/application/use-cases/SaveTelemetry.ts`).
3. **Persistencia (Capa de Infraestructura):** El caso de uso realiza las validaciones de negocio estrictas (que no sea un número negativo, que el tipo de lectura exista) y, si todo está bien, guarda el registro usando el patrón Repositorio a través de `SupabaseEnergyReadingRepository`.

### 2. Formato de Envío (Contrato de Datos JSON)

Para que el backend procese el pulso correctamente, el ESP32 debe enviar el payload con esta estructura exacta:

**Para consumo eléctrico de red (Importación):**
```json
{
  "reading_type": "consumption",
  "value_kwh": 1.25
}
```

**Para generación de los paneles (Exportación / Autoconsumo):**
```json
{
  "reading_type": "solar_generation",
  "value_kwh": 3.42
}
```

---

## Configuración del Hardware (Código en C++ para ESP32)

A continuación, el código exacto en C++ (Arduino IDE) que debe flashearse en el ESP32 para emparejarlo con nuestro endpoint `api/telemetry`.

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// Configuración de Red
const char* ssid = "TU_WIFI_LOCAL";
const char* password = "TU_PASSWORD_WIFI";

// Credenciales del Backend Telar Monitor
const String api_url = "https://tu-dominio.com/api/telemetry"; // Cambiar por tu IP/Dominio
const String api_token = "TELAR_HARDWARE_TOKEN_2026"; // Debe coincidir con el route.ts

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print("."); 
  }
  Serial.println(" ¡Conectado!");
}

void loop() {
  // 1. Obtener la métrica real (Ej: EmonLib u otro conversor ADC)
  // Aquí simulamos que leímos 2.45 kW de generación solar
  float energia_medida_kw = 2.45; 
  
  // 2. Transmisión HTTP a Next.js
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(api_url);
    
    // Encabezados obligatorios esperados por route.ts
    http.addHeader("Authorization", "Bearer " + api_token);
    http.addHeader("Content-Type", "application/json");

    // Construcción del Payload
    String jsonPayload = "{\"reading_type\": \"solar_generation\", \"value_kwh\": " + String(energia_medida_kw) + "}";
    
    // Ejecución del POST
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      Serial.println("OK: Dato recibido por Telar Monitor. Código: " + String(httpResponseCode));
    } else {
      Serial.println("ERROR: Fallo en envío. Código: " + String(httpResponseCode));
    }
    http.end();
  }
  
  // Esperar 15 minutos (900,000 ms) antes de la siguiente medición masiva
  // Para pruebas en vivo, puedes reducirlo a 10 segundos (10000 ms)
  delay(900000);
}
```

## Pruebas de Escritorio (Sin hardware)

Si aún no tienes el ESP32 ensamblado, puedes probar que el endpoint `route.ts` funciona perfectamente desde tu terminal con `curl`:

```bash
curl -X POST http://localhost:3000/api/telemetry \
  -H "Authorization: Bearer TELAR_HARDWARE_TOKEN_2026" \
  -H "Content-Type: application/json" \
  -d '{"reading_type": "solar_generation", "value_kwh": 4.10}'
```

Al lanzar este comando, el backend registrará los `4.10 kW` en la base de datos de Supabase, y el Dashboard Principal reaccionará de inmediato a la nueva métrica de energía limpia.
