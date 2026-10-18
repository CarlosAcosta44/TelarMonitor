# Retroalimentación del Proyecto - Carlos

Este documento recopila y estructura los puntos de retroalimentación técnica y funcional recibidos para el sistema **Telar Monitor**, agrupados por áreas para su análisis y ejecución.

---

## 1. Arquitectura, Backend y Despliegue

* **Despliegue de Backend (Simuladores):**
  * Se recomienda desplegar el componente de backend/simuladores en **Railway**.
* **Generación de Informes y Procesamiento de Datos:**
  * El sistema debería pasar un informe completo desde el backend.
  * Se menciona el uso de librerías de análisis y exportación de datos (como `pandas` / procesamiento tabular) para entregar datos en diferentes formatos según la tecnología del backend.
* **Comunicación en Tiempo Real:**
  * Implementar **WebSockets con Socket.IO** en el backend para la transmisión en vivo de lecturas y eventos de telemetría hacia el cliente.


---

## 2. Multi-Tenancy, Seguridad y Gestión de Cuentas

* **Multi-Inquilino (Multi-Tenant):**
  * Debe soportar **varios clientes en la misma base de datos** utilizando segregación de datos (`cuenta_id` / `household_id`) y **Seguridad a Nivel de Fila (RLS - Row Level Security)**.
  * *Problema señalado:* Actualmente existe una única instalación y una configuración global; se debe establecer la relación e informes directamente con la base de datos del Monitor.
* **Autenticación y Control de Acceso:**
  * *Falta identificada:* No existía un flujo formal de inicio de sesión ni control de roles por usuario.

---

## 3. Visualización y Datos en el Dashboard

* **Detalle de Consumo:**
  * Al intentar ver el detalle del consumo energético, actualmente no permite visualizarlo o falla la carga de la vista detallada.
* **Funcionalidades Huérfanas / Sin Uso:**
  * Hay botones, opciones o elementos en la interfaz que actualmente no tienen una funcionalidad real asociada o están inactivas.

---

## 4. Alertas y Notificaciones

* **Sistema de Alertas:**
  * Las alertas del sistema no deben ser solo registros estáticos en una tabla: deben integrarse como un sistema de **notificaciones activas** (push, correo o canales de mensajería).

---

## 5. Configuración del Hogar e Instalación

* **Ubicación Geográfica:**
  * Debe ajustarse y validarse de forma precisa la configuración de ubicación del hogar.
* **Capacidad Instalada y Desglose de Módulos:**
  * En las propiedades del panel o paneles, se debe especificar con claridad **cuántos paneles están registrados**, su modelo/especificación física y su potencia unitaria.
* **Estandarización de Fechas:**
  * Las fechas deben manejarse con formatos estandarizados o tipos enumerados/estructurados (`timestamp` / `date`) en lugar de cadenas de texto libres ("Fecha sin enum").
* **Parámetros Comerciales:**
  * Configuración completa de empresas distribuidoras (EPM, etc.), tarifas y estratos.

---

## 6. Diseño y Experiencia de Usuario (UI/UX)

* **Diseño Responsivo:**
  * Se detectaron errores de visualización en dispositivos móviles o pantallas pequeñas (la interfaz actualmente no es completamente responsive).
