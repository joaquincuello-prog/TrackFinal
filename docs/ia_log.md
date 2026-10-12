# BITÁCORA DE USO RESPONSABLE DE INTELIGENCIA ARTIFICIAL — PP2

**Proyecto:** TrackFinal — Seguimiento de Producto Terminado  
**KIT:** AVZ-03 (Trazabilidad de Lote/Unidad — Genealogía Avanzada)  
**Empresa Piloto:** Lácteos San Antonio S.A.  
**Estudiante:** Joaquín Nicolás Cuello  
**Carrera:** Tecnicatura Superior en Desarrollo de Software (3.º Año)  
**Cátedra:** Práctica Profesionalizante II (PP2)  
**Herramienta Principal de IA:** Gemini (Google DeepMind / Antigravity)  
**Estado:** REGULARIZADO Y CONSOLIDADO (Semanas 1 a 9)  

---

## 1. Declaración de Principios y Criterio Académico

El uso de Inteligencia Artificial en este proyecto se enmarca como una **herramienta de asistencia técnica, co-pilotaje y aceleración de ingeniería de software**, bajo supervisión, comprensión y validación humana permanente. Cada diseño arquitectónico, script de base de datos relacional, endpoint REST, componente de interfaz de usuario y caso de prueba generado o sugerido por la IA ha sido analizado, ejecutado y defendido técnicamente por el estudiante, cumpliendo rigurosamente con las directivas académicas de la Tecnicatura Superior en Desarrollo de Software.

---

## 2. Registro Cronológico de Consultas e Interacciones Técnicas

### Registro 01 — Definición de Propuesta y Ficha de Proyecto (Semana 1)
* **Fecha:** 04/09/2026
* **Objetivo:** Delimitar la problemática de la PyME láctea ficticia (Lácteos San Antonio S.A.), acotar el alcance MVP del KIT AVZ-03 (Seguimiento de Producto Terminado) y redactar la Ficha Oficial del Proyecto.
* **Consulta / Prompt Realizado:** *"Diseñar el alcance MVP para un sistema de seguimiento de producto terminado en una fábrica láctea enfocado en resolver demoras en despachos y reclamos de clientes, respetando las 10 semanas de plazo."*
* **Resultado de la IA:** Propuesta de 5 funcionalidades nucleares, exclusión explícita de facturación fiscal y GPS físico, y definición preliminar de los perfiles de usuario.
* **Decisión Técnica del Estudiante:** Se aceptó el enfoque centrado en la conexión entre envasado, cámara de frío y despacho, confirmando que la captura fuera asistida en pantalla web táctil para evitar dependencias de hardware externo de difícil adquisición.
* **Aprendizaje:** La importancia de delimitar claramente las exclusiones (*fuera de alcance*) para asegurar la factibilidad de entrega en tiempo y forma.

---

### Registro 02 — Análisis de Requerimientos y Diagramas AS-IS vs TO-BE (Semana 2)
* **Fecha:** 04/09/2026
* **Objetivo:** Modelar los flujos de proceso productivo, formular los requisitos funcionales (RF01 a RF09) y no funcionales (RNF), y definir casos de uso con sintaxis Gherkin.
* **Consulta / Prompt Realizado:** *"Estructurar la especificación de requerimientos de software industrial y generar diagramas de flujo Mermaid comparando el proceso manual en papel con el digitalizado 4.0."*
* **Resultado de la IA:** Diagramas de flujo Mermaid de los procesos AS-IS y TO-BE, tabla exhaustiva de RF y RNF, y especificación formal de criterios de aceptación Given-When-Then.
* **Decisión Técnica del Estudiante:** Se validaron los criterios de aceptación en formato Gherkin para garantizar que las reglas de negocio fueran verificables mediante pruebas automatizadas.
* **Aprendizaje:** El valor de la matriz de trazabilidad de requerimientos para auditar que cada tabla, endpoint y pantalla responda a un requerimiento funcional concreto.

---

### Registro 03 — Definición y Transición del Motor de Persistencia (Semana 3)
* **Fecha:** 04/09/2026 - 15/09/2026
* **Objetivo:** Analizar la viabilidad técnica del motor de persistencia, evaluando PostgreSQL y MySQL 8.0+ para trazabilidad industrial con soporte de campos JSON.
* **Consulta / Prompt Realizado:** *"Comparar el manejo de payloads estructurados para códigos QR entre PostgreSQL (JSONB) y MySQL 8.0 (JSON nativo), evaluando transacciones ACID y facilidad de despliegue en entornos Windows para la PyME."*
* **Resultado de la IA:** Se comprobó que MySQL 8.0+ provee tipo de dato nativo `JSON`, soporte completo de transacciones ACID (`START TRANSACTION / COMMIT / ROLLBACK`), funciones de consulta y óptima integración con el ecosistema de herramientas de la tecnicatura.
* **Decisión Técnica del Estudiante:** Implementar el modelo en MySQL 8.0+ mediante el driver `mysql2/promise` con un wrapper transaccional que estandariza las consultas, manteniendo compatibilidad total con los requerimientos del KIT AVZ-03.
* **Aprendizaje:** Adaptabilidad arquitectónica: cómo diseñar abstracciones en la capa de persistencia (`db.js`) para que el resto de la aplicación sea agnóstica a particularidades del dialecto SQL.

---

### Registro 04 — Diseño DDL Normalizado, Seeds y Contratos REST (Semana 3)
* **Fecha:** 04/09/2026 - 22/09/2026
* **Objetivo:** Elaborar el script SQL DDL oficial (`database/schema_mysql.sql`) en Tercera Forma Normal (3FN), generar el dataset inicial (`database/seeds_mysql.sql`) y documentar los contratos de API REST.
* **Consulta / Prompt Realizado:** *"Diseñar el script DDL normalizado en MySQL con 13 tablas relacionales para seguimiento de producto terminado en fábrica láctea, incluyendo tipos JSON para rótulos QR, índices de genealogía y seeds con contraseñas en bcrypt."*
* **Resultado de la IA:** Script DDL con claves foráneas estrictas (`ON DELETE RESTRICT`), índices B-Tree optimizados para consultas por lote, y dataset inicial con tambos de la cuenca bonaerense y lotes de quesos y yogures.
* **Decisión Técnica del Estudiante:** Incorporar índices compuestos sobre `(lote_pt_id, timestamp_evento)` y `(orden_produccion_id, lote_mp_id)` para garantizar que las consultas de genealogía respondan en milisegundos.
* **Aprendizaje:** La importancia de la integridad referencial para evitar la pérdida accidental de la cadena de custodia bromatológica.

---

### Registro 05 — Backend Transaccional, Pool MySQL y Seguridad RBAC (Semana 4)
* **Fecha:** 15/09/2026
* **Objetivo:** Desarrollar la arquitectura backend en Node.js/Express, crear el pool de conexiones con transacciones atómicas y asegurar las rutas mediante JWT y control de acceso basado en roles (RBAC).
* **Consulta / Prompt Realizado:** *"Crear un helper transaccional `withTransaction` en Node.js con `mysql2/promise` para ejecutar consumos de insumos de forma atómica y un middleware `authorizeRoles` que devuelva 403 Forbidden cuando el rol no tenga permisos."*
* **Resultado de la IA:** Implementación de `withTransaction` con `beginTransaction`, `commit` y `rollback` en bloques `try/catch/finally`, y middleware RBAC desacoplado de la lógica de controladores.
* **Decisión Técnica del Estudiante:** Se restringió de forma estricta que los roles `OPERARIO` y `AUDITOR` no puedan alterar estados de lotes ni registrar salidas comerciales, preservando al Auditor como un veedor inmutable.
* **Aprendizaje:** Principio de mínimo privilegio (*Least Privilege*) aplicado a la seguridad en sistemas de planta industrial.

---

### Registro 06 — Frontend SPA Ergonómico de Planta en React (Semana 5)
* **Fecha:** 18/09/2026 - 23/09/2026
* **Objetivo:** Construir la interfaz de usuario con React y Vite, diseñada específicamente para pantallas táctiles de operarios en planta y terminales móviles en red local LAN.
* **Consulta / Prompt Realizado:** *"Diseñar componentes de captura táctil en React con Tailwind CSS para 6 puntos de planta (recepción, tina, envasado, calidad, cámara, despacho), con botones amplios, validación inmediata y modales de confirmación."*
* **Resultado de la IA:** Componente `CapturaPlanta.jsx` con navegación por pestañas de alto contraste, formularios asistidos, modales para rótulos QR y avisos Toast no intrusivos.
* **Decisión Técnica del Estudiante:** Optimizar el espaciado táctil para uso con guantes industriales y preconfigurar valores por defecto en los formularios para minimizar errores tipográficos en planta.
* **Aprendizaje:** La ergonomía de usuario (UX de planta) es tan determinante para el éxito de un sistema industrial como la solidez de la base de datos.

---

### Registro 07 — Integración End-to-End y Circuito Nuclear (Semana 6)
* **Fecha:** 23/09/2026
* **Objetivo:** Integrar el flujo completo (Frontend -> API REST -> Lógica de Negocio -> MySQL -> Respuesta -> UI) y validar la consistencia del circuito operativo.
* **Consulta / Prompt Realizado:** *"Conectar el modal de alta de lote PT de React con la API REST `POST /api/v1/lotes-pt`, verificando que la respuesta incluya el payload JSON del QR y renderice inmediatamente la tarjeta con el código bidimensional en pantalla."*
* **Resultado de la IA:** Flujo asíncrono con `lotesService.createLote`, interceptores Axios para el token Bearer y sincronización del estado en tiempo real.
* **Decisión Técnica del Estudiante:** Centralizar los servicios en la capa `frontend/src/services/` para aislar los componentes visuales de las llamadas de red directas.
* **Aprendizaje:** El valor del desacoplamiento de capas para depurar incidentes de integración de forma rápida y controlada.

---

### Registro 08 — KIT AVZ-03: Payloads QR y Motor de Genealogía (Semana 7)
* **Fecha:** 23/09/2026 - 29/09/2026
* **Objetivo:** Implementar los motores de trazabilidad bidireccional (Backward y Forward) y la generación física de imágenes QR (DataURL Base64).
* **Consulta / Prompt Realizado:** *"Construir los algoritmos de genealogía: hacia atrás uniendo lotes_pt con consumos_mp y tambos proveedores; y hacia adelante uniendo lotes_mp con productos afectados y remitos de clientes para protocolo de recall."*
* **Resultado de la IA:** Métodos `getGenealogiaAtras` y `getGenealogiaAdelante` en `trazabilidad.service.js`, generación de QR mediante la librería `qrcode` y endpoints alias `/trazabilidad/backward/:codigo` y `/trazabilidad/forward/:codigo`.
* **Decisión Técnica del Estudiante:** Se estructuró el payload del código QR como un documento JSON compacto pero autosuficiente, permitiendo tanto su lectura offline como la redirección directa al árbol genealógico web.
* **Aprendizaje:** Cómo resolver árboles genealógicos en bases de datos relacionales sin penalizar los tiempos de respuesta.

---

### Registro 09 — Dashboard, KPIs de Calidad y Bloqueo de Recall (Semana 8)
* **Fecha:** 29/09/2026 - 02/10/2026
* **Objetivo:** Incorporar filtros avanzados multicriterio, tarjetas de estado y el protocolo de bloqueo preventivo masivo ante alertas sanitarias.
* **Consulta / Prompt Realizado:** *"Diseñar un mecanismo de bloqueo preventivo masivo que actualice atómicamente a estado BLOQUEADO todos los lotes derivados de una materia prima observada y registre un evento de auditoría sanitaria."*
* **Resultado de la IA:** Endpoint `POST /api/v1/trazabilidad/recall/bloqueo-preventivo` con transacción segura y refresco inmediato en la vista de trazabilidad.
* **Decisión Técnica del Estudiante:** Habilitar esta acción de emergencia únicamente a los roles `SUPERVISOR` y `ADMIN`, exigiendo motivo obligatorio para auditoría.
* **Aprendizaje:** La criticidad del factor tiempo en la gestión de incidentes bromatológicos en la industria de alimentos.

---

### Registro 10 — Suite de Testing, Congelamiento de Código y Documentación (Semana 9)
* **Fecha:** 07/10/2026
* **Objetivo:** Ejecutar la verificación formal de aseguramiento de calidad (QA), confeccionar la suite de pruebas de integración, declarar el congelamiento de código (*Code Freeze*) y redactar los manuales técnicos y de usuario.
* **Consulta / Prompt Realizado:** *"Actuar como QA Manager y Redactor Técnico Académico: formalizar la matriz de casos de prueba CP-01 a CP-10, validar la suite de 15 pruebas de integración de API, y elaborar la Documentación Técnica de Arquitectura y el Manual de Usuario por roles sin modificar código fuente."*
* **Resultado de la IA:** Elaboración exhaustiva de `docs/matriz_pruebas.md`, `docs/DOCUMENTACION_TECNICA.md`, `docs/MANUAL_USUARIO.md` y actualización de la bitácora `docs/ia_log.md`.
* **Decisión Técnica del Estudiante:** Respetar de forma irrestricta la fase de congelamiento de código (*Code Freeze*), blindando el software contra regresiones previo a la defensa final de la Semana 10.
* **Aprendizaje:** La documentación rigurosa y las evidencias formales de prueba son tan fundamentales para la aprobación académica y profesional como el software funcionando.

---

## 3. Balance Crítico del Uso de Inteligencia Artificial

| Dimensión | Aporte Positivo de la IA | Control Humano Ejercido por el Estudiante |
| :--- | :--- | :--- |
| **Diseño y Arquitectura** | Aceleración en diagramación Mermaid y estructuración de capas. | Selección de tecnologías viables y adaptación a la realidad de la PyME. |
| **Persistencia y Modelado** | Generación de scripts SQL normalizados y sintaxis transaccional. | Auditoría de integridad referencial, índices y cardinalidades. |
| **Seguridad y Reglas** | Esqueleto de middlewares JWT y RBAC. | Restricción estricta de perfiles (ej. Auditor como veedor inmutable). |
| **Testing y Calidad** | Elaboración de suites de integración y aserciones HTTP. | Ejecución real de las pruebas y verificación de resultados. |
| **Documentación** | Redacción técnica profesional y estructuración pedagógica. | Coherencia con las consignas académicas de la cátedra PP2. |
