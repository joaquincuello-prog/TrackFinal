# TrackFinal — Sistema de Trazabilidad y Seguimiento de Producto Terminado

[![Proyecto Final PP2](https://img.shields.io/badge/PP2-3er%20A%C3%B1o-blue.svg)](https://github.com/)
[![Industria 4.0](https://img.shields.io/badge/Industria%204.0-KIT%20AVZ--03-orange.svg)](https://github.com/)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MySQL-green.svg)](https://github.com/)

**Proyecto Final Integrador — Práctica Profesionalizante II (PP2)**  
Tecnicatura Superior en Desarrollo de Software — 3.º Año  
**Estudiante:** Joaquín Nicolás Cuello  
**KIT 4.0:** AVZ-03 – Trazabilidad de Lote/Unidad (Genealogía Avanzada)  
**Propuesta:** Seguimiento de Producto Terminado  
**Empresa de Referencia:** Lácteos San Antonio S.A. (Planta piloto de quesos y yogures)  

---

## 📌 Descripción del Proyecto

**TrackFinal** es un sistema web concebido bajo el paradigma de **Industria 4.0** que centraliza y digitaliza el seguimiento de lotes de producto terminado desde el final de línea de envasado hasta su expedición al cliente final.

Resuelve el problema crítico de las PyMEs industriales que gestionan sus lotes en planillas de papel y Excel inconexos, provocando demoras de varios días para reconstruir la historia de entrega ante reclamos bromatológicos o comerciales. **TrackFinal** permite identificar lotes despachados, clientes afectados y su árbol genealógico en **menos de 5 segundos** mediante códigos QR e interfaces de captura asistida.

---

## 🚀 Funcionalidades Principales (MVP)

1. **Generación de Lotes de Producto Terminado con Código QR:** Alta inmediata de lotes de quesos y yogures con cálculo de fecha de vencimiento y emisión de etiqueta con código QR.
2. **Terminal de Planta para Cámara de Frío:** Registro asistido del ingreso de pallets a la cámara y asignación física de rack/posición.
3. **Módulo de Expedición y Despacho:** Vinculación ágil del lote al cliente destinatario y número de remito de transporte.
4. **Motor de Trazabilidad Bidireccional:**
   - *Trazabilidad Hacia Atrás (Backward):* Del código de lote a la orden de producción, materia prima y controles.
   - *Trazabilidad Hacia Adelante (Forward / Recall):* De un lote observado a la lista inmediata de clientes que lo recibieron para bloqueo preventivo.
5. **Autenticación y Control de Accesos (RBAC):** Perfiles protegidos para *Administrador*, *Operario de Planta/Cámara* y *Encargado de Despacho*.

---

## 🛠️ Arquitectura y Tecnologías

* **Frontend:** React (Vite) + Tailwind CSS (Diseño ergonómico para terminales de planta).
* **Backend:** Node.js + Express (API REST modular en capas: rutas, controladores, servicios y modelos).
* **Base de Datos:** MySQL 8.0 (Modelo relacional normalizado con transacciones ACID e índices optimizados para búsquedas por lote).
* **Seguridad:** Autenticación con JWT (JSON Web Tokens) y contraseñas hasheadas con `bcrypt`.
* **Captura de Datos:** Simulación asistida en pantalla web sin dependencia de hardware físico.

---

## 📂 Estructura del Proyecto

```
SegDeProductosTerminados/
├── .agents/skills/              # 11 Skills especializadas de Antigravity (Tutor y Semanas 1 a 10)
│   ├── pp2-trazabilidad-base/   # Skill metodológica base del proyecto
│   ├── pp2-semana-01-propuesta/ # Ficha de proyecto y alcance
│   ├── pp2-semana-02-analisis/  # Requerimientos y diagramas de proceso
│   ├── pp2-semana-03-diseno/    # Arquitectura y Base de Datos MySQL
│   ├── pp2-semana-04-backend/   # Backend, CRUDs, transacciones y Auth
│   ├── pp2-semana-05-frontend/  # React, UI de planta y consumo de APIs
│   ├── pp2-semana-06-integracion/
│   ├── pp2-semana-07-funcionalidad-kit/
│   ├── pp2-semana-08-kpis-reportes/
│   ├── pp2-semana-09-testing-docs/
│   └── pp2-semana-10-defensa-demo/
├── docs/                        # Documentación académica del proyecto
│   ├── REGISTRO_GENERAL_V1.md   # Registro formal de inicio del proyecto
│   ├── FICHA_PROYECTO.md        # Ficha oficial de elección (Semana 1)
│   ├── REQUERIMIENTOS_ANALISIS.md # Especificación RF/RNF y AS-IS vs TO-BE (Semana 2)
│   └── ia_log.md                # Bitácora de uso responsable de IA
├── database/                    # Scripts SQL (Semana 3)
│   ├── schema.sql               # DDL de tablas, claves foráneas e índices
│   └── seeds.sql                # Dataset inicial de prueba
├── backend/                     # Servidor Node.js + Express (Semana 4)
├── frontend/                    # Cliente React SPA con Vite (Semana 5)
└── README.md                    # Presentación general del proyecto
```

---

## 📖 Documentación Académica

* [Ficha de Elección de Proyecto (Semana 1)](docs/FICHA_PROYECTO.md)
* [Especificación de Requerimientos y Casos de Uso (Semana 2)](docs/REQUERIMIENTOS_ANALISIS.md)
* [Registro General V1](docs/REGISTRO_GENERAL_V1.md)
* [Bitácora de Uso de IA](docs/ia_log.md)

---

## 👨‍💻 Autor
* **Joaquín Nicolás Cuello**  
* Estudiante de 3.º Año — Tecnicatura Superior en Desarrollo de Software  
* Proyecto Integrador de Práctica Profesionalizante II — 2026
