# REGISTRO GENERAL V1 — PROYECTO FINAL PP2 | INDUSTRIA 4.0

**Fecha de emisión:** 04/09/2026  
**Semana del ciclo:** Semana 4/10  
**Próximo cierre:** 04/09/2026 (23:59 hs - Cierre formal de Semana 4)  
**Tutor:** Tutor Académico PP2 | Industria 4.0  

---

## 1. Datos Generales del Estudiante y Proyecto
- **Estudiante:** Joaquín Nicolás Cuello
- **Legajo / Matrícula:** A completar / Sin registrar
- **Nombre del Proyecto:** TrackFinal
- **KIT Seleccionado:** AVZ-03 – Trazabilidad de Lote/Unidad (Genealogía Avanzada)
- **Propuesta Específica:** Seguimiento de Producto Terminado
- **Organización / PyME de Referencia:** Lácteos San Antonio S.A. (Empresa ficticia de elaboración de yogures y quesos)

---

## 2. Definición del Problema y Contexto Operativo
- **Situación Actual:** El registro de lotes de yogures y quesos se realiza manualmente en planillas de papel en la línea de producción y posteriormente se vuelca a planillas Excel inconexas. No existe integración digital entre la planta de elaboración, la cámara de frío y el sector de despacho.
- **Problema Concreto:** Ante un reclamo de cliente o requerimiento bromatológico, la empresa demora varios días en identificar qué lote específico se entregó a qué cliente, debido a la necesidad de cruzar manualmente papeles dispersos entre áreas.
- **Usuarios Clave:**
  1. *Encargado de Despacho / Logística:* Registra la salida de cada lote y remito, consultando destino y cliente.
  2. *Operario de Producción / Cámara de Frío:* Registra envasado, lote PT, genera QR y asigna ubicación en cámara.
  3. *Administrador del Sistema:* Gestiona catálogo de productos, clientes y permisos.

---

## 3. Objetivos y Alcance del MVP
- **Objetivo General:** Desarrollar un MVP de software web (TrackFinal) que centralice el seguimiento de lotes de producto terminado mediante código QR y registro asistido en terminales, reduciendo el tiempo de identificación de lotes despachados de varios días a menos de 5 segundos.
- **Funcionalidades Nucleares del MVP (3 a 5):**
  1. *F1 - Alta y Generación de Lote PT con QR:* Asignación de lote correlativo, fecha de elaboración, vencimiento y emisión de código QR.
  2. *F2 - Captura Asistida en Cámara de Frío:* Registro del ingreso físico del lote a frío y asignación de rack/posición.
  3. *F3 - Registro de Despacho a Cliente:* Asociación ágil de lote PT a cliente y número de remito de entrega.
  4. *F4 - Consulta Inmediata de Trazabilidad:* Reconstrucción hacia atrás (origen del lote) y hacia adelante (clientes a los que se les envió un lote ante reclamo/recall).
  5. *F5 - Control de Accesos y Roles:* Perfiles diferenciados (Admin, Operario, Despacho).
- **Flujo Principal:** Envasado (Lote PT + QR) $\rightarrow$ Ingreso a Cámara de Frío $\rightarrow$ Despacho a Cliente (Remito) $\rightarrow$ Consulta instantánea ante Reclamo.
- **Exclusiones Explícitas (Fuera de Alcance):**
  - Sin facturación electrónica AFIP ni cobranzas.
  - Sin seguimiento satelital GPS de camiones ni ruteo logístico.
  - Sin sensorización física IoT en ruta (se implementa registro asistido en planta).

---

## 4. Tecnologías y Metodología de Desarrollo
- **Frontend:** React (Vite) con interfaz adaptada a terminales de planta.
- **Backend:** Node.js + Express (API REST) con autenticación JWT y autorización RBAC.
- **Base de Datos:** PostgreSQL 15+ (modelo relacional normalizado con transacciones ACID, tipos JSONB e índices B-Tree para búsquedas por lote).
- **Mecanismo de Captura:** Simulación asistida en interfaz web (selección/ingreso guiado para máxima estabilidad sin depender de periféricos físicos).
- **Repositorio:** Git configurado.
- **Uso de Inteligencia Artificial:** Gemini (asistencia técnica en arquitectura, generación y depuración de código, pruebas y documentación).

---

## 5. Auditoría de Avance y Estado de Entregables (Semana 4)

| Semana | Entregable Exigible | Estado Académico | Evidencia Verificable | Puntos Obtenidos / Disp. |
| :---: | :--- | :---: | :--- | :---: |
| **S1 (14/08)** | Ficha de Proyecto, Alcance y Repo Git | **EVIDENCIADO (REGULARIZADO)** | `docs/FICHA_PROYECTO.md` y estructura de repositorio Git configurada. | **10 / 10** |
| **S2 (21/08)** | Requisitos RF/RNF, Casos de Uso, AS-IS/TO-BE | **EVIDENCIADO (REGULARIZADO)** | `docs/REQUERIMIENTOS_ANALISIS.md` con flujos Mermaid y wireframes. | **15 / 15** |
| **S3 (28/08)** | Base de Datos PostgreSQL (DDL), Seeds y API | **EVIDENCIADO (REGULARIZADO)** | `database/schema.sql`, `database/seeds.sql` y `docs/ARQUITECTURA_DISENO.md`. | **8 / 8** |
| **S4 (04/09)** | Backend, CRUD, Reglas de negocio y Auth | **PENDIENTE (EN PROCESO)** | Inicialización de backend Node.js + Express con PostgreSQL pool y JWT. | **0 / 12** |

---

## 6. Métrica de Avance y Calificación Provisoria

- **Puntos Obtenidos hasta hoy:** 33 puntos (S1: 10, S2: 15, S3: 8)
- **Puntos Disponibles a la fecha (S1 a S4):** 45 puntos
- **Nota de Avance:** $\frac{33}{45} \times 100 = \mathbf{73.3\%}$
- **Puntos Consolidados sobre 100:** $\mathbf{33 / 100}$
- **Penalización por regularización tardía:**
  - S1: -2.00 provisorio
  - S2: -2.00 provisorio
  - S3: -1.00 provisorio
  - S4: En término
  - *Calificación neta consolidada: 28.00 / 33 puntos logrados (Recuperables con bonificación de demo).*

---

## 7. Diagnóstico General y Nivel de Riesgo
- **Estado General:** 🟢 **EN CURSO / RECUPERADO**
- **Riesgo de Alcance MVP:** **BAJO**  
  *Justificación:* Se regularizaron al 100% los entregables de diseño conceptual (S1 y S2) y diseño de datos y arquitectura (S3 con PostgreSQL normalizado e indexado). El proyecto cuenta ahora con una base arquitectónica sólida y lista para iniciar inmediatamente la codificación del backend en Node.js (Semana 4).

---

## 8. Plan de Contingencia y Prioridades Inmediatas (Máximo 3)

1. **Prioridad 1 (Semana 4 - Backend):** Inicializar el servidor backend en `backend/` con Node.js + Express, instalar dependencias (`pg`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`) y configurar el pool de conexiones a PostgreSQL.
2. **Prioridad 2 (Semana 4 - Auth & RBAC):** Implementar los middlewares de autenticación JWT y autorización RBAC para proteger las rutas de envasado, cámara y despacho.
3. **Prioridad 3 (Semana 4 - Reglas de Negocio):** Implementar la lógica transaccional de alta de lote PT con generación de payload QR y registro de despacho a clientes.
