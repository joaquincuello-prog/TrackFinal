# FICHA DE ELECCIÓN DEL PROYECTO FINAL — PP2 | INDUSTRIA 4.0

**Materia:** Práctica Profesionalizante II — 3.º Año  
**Carrera:** Tecnicatura Superior en Desarrollo de Software  
**Fecha de Presentación:** 14/08/2026 (Semana 1) — Regularizado el 04/09/2026  
**Estado:** EVIDENCIADO  

---

## 1. Datos del Estudiante y del Proyecto

* **Integrante:** Joaquín Nicolás Cuello
* **Legajo / Matrícula:** Regular — 3.º Año Desarrollo de Software
* **KIT Seleccionado:** **AVZ-03 – Trazabilidad de Lote/Unidad (Genealogía Avanzada)**
* **Nombre del Proyecto:** **TrackFinal**
* **Empresa / Organización de Referencia:** Lácteos San Antonio S.A. *(Empresa láctea ficticia dedicada a la elaboración y envasado de quesos y yogures).*

---

## 2. Definición del Problema Industrial

* **Situación Actual:**  
  La fábrica lleva el registro de los lotes de elaboración y envasado de manera manual mediante planillas de papel ubicadas en las líneas productivas. Luego de finalizada la jornada, los partes se transcriben de forma desfasada a planillas de cálculo Excel independientes. No existe vinculación digital ni en tiempo real entre la línea de envasado, la cámara de frío de almacenamiento y el sector de despacho a clientes.
* **Problema Concreto que se Desea Resolver:**  
  Ante el reclamo de un cliente por un lote en mal estado o una auditoría bromatológica urgente, el personal tarda entre 2 y 5 días hábiles en identificar qué lote específico se entregó a qué cliente. Esto se debe a la necesidad de cruzar a mano remitos físicos de transporte con partes de envasado y cuadernos de cámara de frío, generando riesgo de sanciones sanitarias, pérdida de clientes y la necesidad de retirar preventivamente pallets completos de producto no afectados por no poder aislar con certeza el lote involucrado.

---

## 3. Usuarios del Sistema

1. **Encargado de Despacho / Logística (Usuario Principal):**  
   Registra la expedición de mercadería asociando cada lote de producto terminado al cliente destinatario y número de remito, y consulta de forma inmediata qué clientes recibieron un lote específico ante cualquier reclamo.
2. **Operario de Producción / Cámara de Frío:**  
   Registra el fin de envasado, genera la identificación del lote con código QR y registra el ingreso físico a la cámara de frío asignando la posición de estiba.
3. **Administrador del Sistema:**  
   Gestiona los datos maestros (catálogo de productos lácteos, clientes distribuidores/supermercados, materias primas) y administra las cuentas y permisos de los usuarios.

---

## 4. Objetivo General del Proyecto

Desarrollar un MVP de software web (**TrackFinal**) bajo arquitectura cliente-servidor (React + Node.js/Express + MySQL) que centralice el seguimiento y control de lotes de producto terminado mediante identificación por códigos QR y registro asistido en terminales de planta, reduciendo el tiempo de identificación y reconstrucción genealógica de lotes despachados de varios días a menos de 5 segundos.

---

## 5. Funcionalidades Principales del MVP (5 Nucleares)

1. **F1 - Generación de Lote PT con Emisión de Código QR:**  
   Alta ágil de lotes de producto terminado (yogures y quesos) con fecha de elaboración, fecha de vencimiento calculada, cantidad de unidades y generación automática de etiqueta con código QR identificatorio.
2. **F2 - Captura Asistida en Cámara de Frío:**  
   Terminal simplificada para registrar el ingreso del lote a la cámara de maduración/conservación y asignación de rack y sector.
3. **F3 - Registro de Despacho y Expedición a Clientes:**  
   Módulo para registrar la salida de mercadería asociando los lotes seleccionados al cliente destinatario, fecha de carga y número de remito de transporte.
4. **F4 - Motor de Trazabilidad y Consulta Inmediata (Backward & Forward / Recall):**  
   - *Hacia Atrás:* Escaneo o ingreso del código de lote PT para visualizar de inmediato fecha, lote de materia prima, controles e historial de movimientos.
   - *Hacia Adelante (Recall):* Búsqueda por lote para listar en segundos todos los clientes que lo recibieron y su ubicación actual, con opción de bloqueo preventivo.
5. **F5 - Seguridad, Autenticación y Perfiles RBAC:**  
   Control de acceso mediante tokens JWT y autorización por roles diferenciados (*Administrador, Operario de Producción/Cámara, Encargado de Despacho*).

---

## 6. Datos, Sensores y Mecanismos de Captura

* **Datos:** Dataset simulado con productos lácteos representativos (ej. Yogur Bebible Frutilla 1L, Queso Cremoso 4kg, Queso Tybo en barra), proveedores lácteos y cartera de clientes (supermercados y mayoristas).
* **Mecanismo de Captura:** Simulación asistida en interfaces web responsivas (terminales de planta táctiles y selección guiada), garantizando máxima estabilidad operativa sin requerir hardware industrial físico.
* **Control de Versiones:** Repositorio Git formal con ramas y registro continuo de cambios.
* **Herramientas de Inteligencia Artificial:** Gemini (asistencia en ingeniería de software, arquitectura de datos, revisión de código y documentación).

---

## 7. Alcance que NO se Incluirá (Exclusiones Explícitas)

Para asegurar la viabilidad del MVP en 10 semanas, quedan expresamente fuera de alcance:
* No incluye facturación electrónica AFIP, cobranzas ni módulo contable/financiero.
* No incluye seguimiento satelital de vehículos por GPS ni optimización de ruteo logístico.
* No incluye sensorización física IoT en tiempo real en ruta ni integración a PLCs de planta.
* No incluye gestión de nóminas o recursos humanos.
