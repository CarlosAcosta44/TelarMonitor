# Guía de Integración de Hardware Real: De la Simulación a la Realidad

Este documento detalla cómo dar el paso para conectar **sensores físicos reales** (medidores inteligentes, inversores solares, ESP32, etc.) a Telar Monitor. Actualmente, el proyecto utiliza un entorno de simulación para generar datos de prueba. Para medir energía en el mundo real, los dispositivos IoT deben comunicarse directamente con nuestra base de datos a través de un backend propio (API REST) o un servidor intermedio.

A continuación se presentan las **tres arquitecturas más viables** para la integración, ordenadas de la más simple a la más escalable.

---

## 1. Conexión Directa: Microcontrolador ➔ Backend REST API (La más simple)

Esta es la forma más rápida y económica de empezar. Un microcontrolador con WiFi (como el **ESP32** o el **ESP8266**) lee los datos del sensor de corriente (ej. SCT-013) o voltaje, y hace un llamado `POST` a una ruta de nuestro backend propio para insertar los datos en la base de datos.

```mermaid
graph LR
    A[Sensor SCT-013] -->|Analógico| B(Microcontrolador ESP32)
    B -->|WiFi / HTTP POST| C[(Backend Propio / API REST)]
    C --> D[(Base de Datos)]
    C --> E[Telar Monitor Frontend]
```

### Ventajas y Desventajas
- ✅ **Pros:** No requiere servidores físicos intermedios en el sitio, muy económico, fácil de programar en C/C++.
- ❌ **Contras:** Los microcontroladores pequeños a veces sufren manejando certificados HTTPS grandes, y si se cae el internet localmente, se pierden lecturas (a menos que el ESP32 guarde un búfer en su memoria flash interna).

### Ejemplo de Código en C++ (Arduino IDE para ESP32)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "TU_WIFI";
const char* password = "TU_PASSWORD";

// Ruta a la API de tu backend
const String api_url = "https://api.tu-backend.com/v1/energy_readings";
const String api_token = "TU_TOKEN_DE_SEGURIDAD";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void loop() {
  // 1. Leer el sensor (Simulado aquí, pero usarías EmonLib para un SCT-013 real)
  float consumption_kwh = leerSensorDeCorriente(); 
  
  // 2. Enviar los datos al Backend
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(api_url);
    http.addHeader("Authorization", "Bearer " + api_token);
    http.addHeader("Content-Type", "application/json");

    // Construir el JSON
    String jsonPayload = "{\"reading_type\": \"consumption\", \"value_kwh\": " + String(consumption_kwh) + "}";
    
    int httpResponseCode = http.POST(jsonPayload);
    http.end();
  }
  
  delay(15000); // Esperar 15 segundos antes de la siguiente lectura
}
```

---

## 2. Gateway Local: Sensores ➔ Raspberry Pi ➔ Backend Propio (La más robusta para industrias/hogares)

En este escenario, los sensores no tienen acceso directo a internet ni envían los datos por su cuenta. Se comunican por un protocolo local e industrial (Zigbee, Modbus RS485, o Serial) hacia una microcomputadora central en la instalación (como una Raspberry Pi o un PLC inteligente). Esta computadora corre un script en Python o Node.js que recolecta la información de todos los inversores y medidores y la envía empaquetada al backend.

```mermaid
graph LR
    A[Inversor Solar RS485] -->|Cable / Modbus| B(Gateway Local Raspberry Pi)
    C[Medidor Inteligente Zigbee] -->|Inalámbrico| B
    B -->|Python / HTTP POST| D[Backend en la Nube]
    D --> E[(Base de Datos)]
```

### Ventajas y Desventajas
- ✅ **Pros:** Altamente robusto. Si se cae el internet, la Raspberry puede guardar los datos en una base de datos local (SQLite) y subirlos todos juntos cuando vuelva la conexión (evita pérdida total de datos). Puede comunicarse de forma nativa con inversores profesionales que usan RS485/Modbus.
- ❌ **Contras:** Requiere hardware adicional (un Gateway/Raspberry Pi) en la instalación que eleva un poco el costo de implementación.

### Ejemplo de Código en Python (Corriendo en la Raspberry Pi)

```python
# Instalar dependencias: pip install requests pyserial
import time
import serial
import requests

API_URL = "https://api.tu-backend.com/v1/energy_readings"
HEADERS = {
    "Authorization": "Bearer TU_TOKEN_DE_SEGURIDAD",
    "Content-Type": "application/json"
}

# Supongamos que leemos por Serial de un Arduino o Inversor
ser = serial.Serial('/dev/ttyUSB0', 9600)

while True:
    try:
        # 1. Leer datos del sensor/inversor
        linea = ser.readline().decode('utf-8').strip()
        kw_leidos = float(linea)

        # 2. Insertar en el Backend
        payload = {
            "reading_type": "consumption",
            "value_kwh": kw_leidos
        }
        response = requests.post(API_URL, json=payload, headers=HEADERS, timeout=10)
        
        if response.status_code == 201:
            print("Datos enviados correctamente.")
        else:
            print(f"El backend rechazó el envío: {response.text}")
            
    except Exception as e:
        print(f"Error o desconexión temporal: {e}")
        # Aquí podrías guardar el dato en un archivo de texto o base de datos local para reenviarlo luego
        
    time.sleep(15)
```

---

## 3. Arquitectura IoT Profesional: Sensores ➔ Broker MQTT ➔ Backend Propio (La más escalable)

Si Telar Monitor crece para tener **cientos o miles de puntos de medición**, las conexiones HTTP constantes terminarán saturando el backend tradicional. El estándar de la industria para IoT es MQTT. Los dispositivos envían mensajes extremadamente ligeros a un "Broker MQTT" (como AWS IoT Core, HiveMQ o Mosquitto). Luego, un microservicio de tu backend se conecta al Broker consumiendo los datos en masa y procesándolos hacia la base de datos de forma asíncrona.

```mermaid
graph LR
    A[Dispositivo Cliente 1] -->|MQTT| B((Broker MQTT Central))
    C[Dispositivo Cliente 2] -->|MQTT| B
    B -->|Suscripción| D[Microservicio / Worker Backend]
    D -->|Procesamiento y Almacenamiento| E[(Base de Datos)]
```

### Ventajas y Desventajas
- ✅ **Pros:** Escala a millones de dispositivos. MQTT consume muchísimos menos datos de red y batería que HTTP. Permite una arquitectura orientada a eventos.
- ❌ **Contras:** La infraestructura es significativamente más compleja; requiere gestionar y mantener un servidor extra dedicado exclusivamente al Broker MQTT.

### Ejemplo de Configuración

1. **En el dispositivo IoT (ESP32 con librería PubSubClient):**
   Envía un mensaje rápido y ultraligero sin esperar respuesta compleja de servidores HTTP.
   ```cpp
   client.publish("telar/clientes/casa_001/consumo", "3.45");
   ```

2. **En el Microservicio Node.js de tu Backend:**
   Un proceso secundario en tu backend que siempre está corriendo escuchando todos los mensajes.
   
   ```javascript
   const mqtt = require('mqtt');
   const { db } = require('./tu_conexion_a_db');

   const client = mqtt.connect('mqtt://tu-broker-mqtt.com');

   client.on('connect', () => {
     client.subscribe('telar/clientes/+/consumo');
     console.log("Worker escuchando lecturas MQTT...");
   });

   client.on('message', async (topic, message) => {
     // Interpretar el tópico y el valor
     const valor_kwh = parseFloat(message.toString());
     const clienteId = topic.split('/')[2];

     try {
       // Insertar directo a la base de datos propia
       await db.query(
         'INSERT INTO energy_readings (client_id, reading_type, value_kwh) VALUES (?, ?, ?)', 
         [clienteId, 'consumption', valor_kwh]
       );
     } catch(err) {
       console.error("Fallo al guardar en DB", err);
     }
   });
   ```

---

## ¿Cuál es la mejor opción para Telar Monitor?

Para una primera versión funcional de este software (que permita reemplazar los datos simulados por datos verídicos de un entorno controlado), se recomienda la **Opción 1 (ESP32 con Conexión HTTP Directa)**, o la **Opción 2 (Gateway Raspberry Pi)** si los inversores o tableros solares requieren protocolos industriales cableados como RS485 o Modbus.

Ambas se pueden conectar a prácticamente cualquier backend en Node, Python, PHP o Java que elijas implementar a futuro, siempre que expongas una ruta REST sencilla para recibir la información.
