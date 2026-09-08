# BITÁCORA DE USO RESPONSABLE DE INTELIGENCIA ARTIFICIAL — PP2

**Proyecto:** TrackFinal — Seguimiento de Producto Terminado  
**KIT:** AVZ-03 (Trazabilidad de Lote/Unidad)  
**Estudiante:** Joaquín Nicolás Cuello  
**Herramienta Principal de IA:** Gemini (Google DeepMind / Antigravity)  

---

## 1. Declaración de Principios y Criterio Académico

El uso de Inteligencia Artificial en este proyecto se enmarca como una **herramienta de asistencia técnica y aceleración de ingeniería de software**, bajo supervisión y comprensión humana permanente. Cada diseño, script de base de datos, endpoint y componente de interfaz generado o sugerido por la IA ha sido analizado, validado y defendido por el estudiante, cumpliendo con los estándares de la Tecnicatura Superior en Desarrollo de Software.

---

## 2. Registro Cronológico de Consultas e Interacciones

### Registro 01 — Definición de Propuesta y Ficha de Proyecto (Semana 1)
* **Fecha:** 04/09/2026
* **Objetivo:** Delimitar la problemática de la PyME láctea ficticia (Lácteos San Antonio S.A.), acotar el alcance MVP del KIT AVZ-03 (Seguimiento de Producto Terminado) y redactar la Ficha Oficial del Proyecto.
* **Consulta / Prompt Realizado:** *"Diseñar el alcance MVP para un sistema de seguimiento de producto terminado en una fábrica láctea enfocado en resolver demoras en despachos y reclamos de clientes, respetando las 10 semanas de plazo."*
* **Resultado de la IA:** Propuesta de 5 funcionalidades nucleares, exclusión explícita de facturación y GPS, y definición de los perfiles de usuario.
* **Decisión Técnica del Estudiante:** Se aceptó el enfoque centrado en la conexión entre envasado, cámara de frío y despacho, confirmando que la captura fuera simulada en pantalla para evitar dependencias de hardware físico.
* **Aprendizaje:** La importancia de delimitar claramente las exclusiones (*fuera de alcance*) para evitar que un proyecto de tesis fracase por intentar abarcar un ERP completo.

---

### Registro 02 — Análisis de Requerimientos y Diagramas AS-IS vs TO-BE (Semana 2)
* **Fecha:** 04/09/2026
* **Objetivo:** Modelar los flujos de proceso productivo, formular los requisitos funcionales (RF01 a RF09) y no funcionales (RNF), y definir casos de uso con sintaxis Gherkin.
* **Consulta / Prompt Realizado:** *"Estructurar la especificación de requerimientos de software industrial y generar diagramas de flujo Mermaid comparando el proceso manual en papel con el digitalizado 4.0."*
* **Resultado de la IA:** Diagramas de flujo Mermaid de los procesos AS-IS y TO-BE, tabla de RF y RNF, y wireframes esquemáticos en texto.
* **Decisión Técnica del Estudiante:** Se validaron los criterios de aceptación en formato Given-When-Then para asegurar que el comportamiento del sistema sea comprobable mediante pruebas automatizadas.
* **Aprendizaje:** El valor de la matriz de trazabilidad para auditar que cada tabla y endpoint responda a un requerimiento funcional concreto.

---

### Registro 03 — Definición Arquitectónica de Base de Datos: PostgreSQL
* **Fecha:** 04/09/2026
* **Objetivo:** Justificar técnicamente el reemplazo de MySQL por PostgreSQL como motor de base de datos relacional para el KIT AVZ-03.
* **Consulta / Prompt Realizado:** *"Validar el cambio de MySQL a PostgreSQL para trazabilidad de lote/unidad con soporte JSONB e indexación B-Tree."*
* **Resultado de la IA:** Se confirmó la idoneidad superior de PostgreSQL para entornos de trazabilidad industrial gracias al soporte nativo de campos `JSONB` (para payloads de códigos QR y parámetros analíticos variables), transacciones ACID estrictas y extensiones de auditoría.
* **Decisión Técnica del Estudiante:** Adoptar PostgreSQL 15+ con el driver `pg` (`node-postgres`) en Express.
* **Aprendizaje:** Cómo justificar técnicamente ante el tribunal docente un reemplazo de la tecnología base según las normas académicas.

---

### Registro 04 — Diseño DDL en PostgreSQL, Seeds y Contratos REST (Semana 3)
* **Fecha:** 04/09/2026 (Regularizado)
* **Objetivo:** Diseñar la arquitectura en capas, elaborar el script SQL DDL oficial (`database/schema.sql`) para PostgreSQL 15+ en Tercera Forma Normal (3FN), generar el dataset inicial representativo (`database/seeds.sql`) y documentar los contratos de API REST (`docs/ARQUITECTURA_DISENO.md`).
* **Consulta / Prompt Realizado:** *"Diseñar el script DDL normalizado en PostgreSQL con 13 tablas relacionales para seguimiento de producto terminado en una fábrica láctea, incluyendo campos JSONB para códigos QR, índices de genealogía y seeds con contraseñas en bcrypt."*
* **Resultado de la IA:** Script DDL completo con integridad referencial estricta (`ON DELETE RESTRICT`), índices B-Tree y GIN optimizados para respuestas `< 2s`, dataset con productos y tambos de Lácteos San Antonio S.A., y documentación formal de arquitectura en capas y contratos de endpoints.
* **Decisión Técnica del Estudiante:** Se adoptó el tipo de dato nativo `JSONB` con índice GIN para desacoplar el contenido del código QR de la estructura relacional rígida, y se mantuvieron claves foráneas estrictas para garantizar la inmutabilidad de la cadena de custodia.
* **Aprendizaje:** La aplicación práctica de la Tercera Forma Normal (3FN) en un modelo de trazabilidad y cómo la indexación compuesta sobre `(lote_pt_id, timestamp_evento)` permite resolver el árbol genealógico en milisegundos.

---

### Registro 05 — Próximos Registros Planificados
* **Semana 4:** Estructura backend en Node.js/Express, transacciones ACID y autenticación JWT.
* **Semana 5 a 8:** Implementación frontend React, QR y Dashboard de KPIs.
* **Semana 9 y 10:** Testing automatizado y simulador de defensa técnica.
